import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Player, Platform, InputState } from '../types';
import { GAME_CONSTANTS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  const playerRef = useRef<Player>({
    pos: { x: 100, y: 100 },
    vel: { x: 0, y: 0 },
    width: GAME_CONSTANTS.PLAYER_SIZE,
    height: GAME_CONSTANTS.PLAYER_SIZE,
    isGrounded: false,
    isDashing: false,
    dashTimer: 0,
    trail: [],
    chargeAmount: 0,
    chargeDir: 1,
    isCharging: false,
    qteStartTime: 0,
    qteSweetSpotRange: [0.7, 0.9],
    isSuperDashing: false,
    superDashTimer: 0,
    isAutoLanding: false,
    autoLandTarget: null,
    autoLandStartPos: null,
    autoLandTimer: 0,
    currentSpeed: GAME_CONSTANTS.MIN_SPEED
  });
  const platformsRef = useRef<Platform[]>([]);
  const cameraRef = useRef<{ x: number }>({ x: 0 });
  const distanceRef = useRef<number>(0);

  const inputRef = useRef<InputState>({
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    downTime: 0
  });

  const initGame = useCallback(() => {
    playerRef.current = {
      pos: { x: 100, y: 200 },
      vel: { x: 0, y: 0 },
      width: GAME_CONSTANTS.PLAYER_SIZE,
      height: GAME_CONSTANTS.PLAYER_SIZE,
      isGrounded: false,
      isDashing: false,
      dashTimer: 0,
      trail: [],
      chargeAmount: 0,
      chargeDir: 1,
      isCharging: false,
      qteStartTime: 0,
      qteSweetSpotRange: [0.7, 0.9],
      isSuperDashing: false,
      superDashTimer: 0,
      isAutoLanding: false,
      autoLandTarget: null,
      autoLandStartPos: null,
      autoLandTimer: 0,
      currentSpeed: GAME_CONSTANTS.MIN_SPEED
    };
    cameraRef.current.x = 0;
    distanceRef.current = 0;
    
    platformsRef.current = [{
      x: 0,
      y: 400,
      width: 1000,
      height: GAME_CONSTANTS.PLATFORM_HEIGHT,
      hasChargeZone: true,
      chargeZoneOffset: 400,
      chargeZoneWidth: 200
    }];
  }, []);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initGame();
    }
  }, [gameState, initGame]);

  const generatePlatforms = (canvasWidth: number, canvasHeight: number) => {
    const platforms = platformsRef.current;
    const lastPlatform = platforms[platforms.length - 1];
    const score = Math.floor(distanceRef.current / 100);
    const diffFactor = Math.min(score / 500, 1);

    if (lastPlatform && lastPlatform.x + lastPlatform.width < cameraRef.current.x + canvasWidth * 2) {
      const curSpeed = playerRef.current.currentSpeed;
      const t_jump = (2 * Math.abs(GAME_CONSTANTS.JUMP_FORCE)) / GAME_CONSTANTS.GRAVITY;
      const maxHorizontalReach = curSpeed * t_jump;
      
      const width = GAME_CONSTANTS.START_PLATFORM_WIDTH - (diffFactor * (GAME_CONSTANTS.START_PLATFORM_WIDTH - GAME_CONSTANTS.MIN_PLATFORM_WIDTH_TARGET));
      const minGap = GAME_CONSTANTS.START_GAP + (diffFactor * 50);
      const maxGap = maxHorizontalReach * GAME_CONSTANTS.MAX_GAP_SAFETY_MARGIN;
      const gap = minGap + Math.random() * (maxGap - minGap);
      
      const maxYChange = 100 + (diffFactor * 100);
      let nextY = lastPlatform.y + (Math.random() * maxYChange * 2 - maxYChange);
      const minY = canvasHeight * 0.3;
      const maxY = canvasHeight * 0.8;
      nextY = Math.max(minY, Math.min(maxY, nextY));

      const hasChargeZone = Math.random() > 0.4; 
      let chargeZoneWidth = 0;
      let chargeZoneOffset = 0;
      
      if (hasChargeZone) {
        chargeZoneWidth = 180;
        chargeZoneOffset = Math.random() * (width - chargeZoneWidth);
      }

      platforms.push({
        x: lastPlatform.x + lastPlatform.width + gap,
        y: nextY,
        width: width,
        height: GAME_CONSTANTS.PLATFORM_HEIGHT,
        hasChargeZone,
        chargeZoneOffset,
        chargeZoneWidth
      });
    }

    platformsRef.current = platforms.filter(p => p.x + p.width > cameraRef.current.x - 200);
  };

  const updatePhysics = (dt: number, canvas: HTMLCanvasElement) => {
    const player = playerRef.current;
    const input = inputRef.current;
    const now = performance.now();

    const score = Math.floor(distanceRef.current / 100);
    player.currentSpeed = Math.min(
      GAME_CONSTANTS.MIN_SPEED + (score * GAME_CONSTANTS.SPEED_SCALE),
      GAME_CONSTANTS.MAX_SPEED
    );

    let inChargeZone = false;
    if (player.isGrounded) {
      const px = player.pos.x + player.width / 2;
      for (const p of platformsRef.current) {
        if (p.hasChargeZone && p.chargeZoneOffset !== undefined && p.chargeZoneWidth !== undefined) {
          const zx = p.x + p.chargeZoneOffset;
          const zw = p.chargeZoneWidth;
          if (px >= zx && px <= zx + zw && Math.abs(player.pos.y + player.height - p.y) < 12) {
            inChargeZone = true;
            break;
          }
        }
      }
    }

    let isHolding = false;
    if (input.isDown) {
      const holdDuration = now - input.downTime;
      const dx = input.currentX - input.startX;
      if (holdDuration > GAME_CONSTANTS.HOLD_DELAY && Math.abs(dx) < GAME_CONSTANTS.SWIPE_MIN_DIST) {
        if (inChargeZone && !player.isSuperDashing && !player.isAutoLanding) {
          isHolding = true;
        }
      }
    }

    if (player.isAutoLanding && player.autoLandTarget && player.autoLandStartPos) {
      player.autoLandTimer += dt;
      const t = Math.min(player.autoLandTimer / GAME_CONSTANTS.AUTO_LAND_DURATION, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      player.pos.x = player.autoLandStartPos.x + (player.autoLandTarget.x - player.autoLandStartPos.x) * ease;
      player.pos.y = player.autoLandStartPos.y + (player.autoLandTarget.y - player.autoLandStartPos.y) * ease;
      if (t >= 1) {
        player.isAutoLanding = false;
        player.isGrounded = true;
        player.pos.y = player.autoLandTarget.y;
        player.vel.y = 0;
      }
    } else if (player.isSuperDashing) {
      player.vel.x = player.currentSpeed * GAME_CONSTANTS.SUPER_DASH_SPEED_MULT;
      player.vel.y = GAME_CONSTANTS.SUPER_DASH_SPEED_Y; 
      player.superDashTimer -= dt;
      if (player.superDashTimer <= 0) {
        player.isSuperDashing = false;
        // Restore horizontal momentum and trigger auto-landing
        const aheadPlatforms = platformsRef.current.filter(p => p.x > player.pos.x + 20);
        if (aheadPlatforms.length > 0) {
          aheadPlatforms.sort((a, b) => a.x - b.x);
          const targetPlatform = aheadPlatforms[0];
          player.isAutoLanding = true;
          player.autoLandTarget = { x: targetPlatform.x + 30, y: targetPlatform.y - player.height };
          player.autoLandStartPos = { x: player.pos.x, y: player.pos.y };
          player.autoLandTimer = 0;
        } else {
          player.vel.x = player.currentSpeed;
        }
      }
      player.pos.x += player.vel.x * dt;
      player.pos.y += player.vel.y * dt;
    } else if (isHolding) {
      if (!player.isCharging) {
        player.isCharging = true;
        player.chargeAmount = 0;
        player.chargeDir = 1;
        player.qteStartTime = now;
        const start = 0.1 + Math.random() * (0.9 - GAME_CONSTANTS.QTE_SWEET_SPOT_WIDTH - 0.1);
        player.qteSweetSpotRange = [start, start + GAME_CONSTANTS.QTE_SWEET_SPOT_WIDTH];
      }
      
      const timeSinceStart = (now - player.qteStartTime) / 1000;
      if (timeSinceStart > GAME_CONSTANTS.QTE_MAX_HOLD_TIME) {
        player.isCharging = false;
        isHolding = false;
      } else {
        player.vel.x = 0;
        player.vel.y = 0; 
        player.chargeAmount += (1 / GAME_CONSTANTS.QTE_CYCLE_DURATION) * dt * player.chargeDir;
        if (player.chargeAmount >= 1) { player.chargeAmount = 1; player.chargeDir = -1; }
        else if (player.chargeAmount <= 0) { player.chargeAmount = 0; player.chargeDir = 1; }
      }
    } else {
      if (player.isCharging) {
        player.isCharging = false;
        player.chargeAmount = 0;
      }

      if (player.isDashing) {
        player.vel.x = player.currentSpeed * GAME_CONSTANTS.DASH_SPEED_MULT;
        player.vel.y = 0;
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) player.isDashing = false;
      } else {
        player.vel.x = player.currentSpeed;
      }

      player.pos.x += player.vel.x * dt;
      if (!player.isDashing) player.vel.y += GAME_CONSTANTS.GRAVITY * dt;
      player.pos.y += player.vel.y * dt;
    }

    const targetCameraX = player.pos.x - canvas.width * 0.2;
    if (targetCameraX > cameraRef.current.x) {
      cameraRef.current.x += (targetCameraX - cameraRef.current.x) * dt * 10;
    }

    if (!player.isSuperDashing && !player.isAutoLanding && !isHolding) {
      player.isGrounded = false;
      for (const p of platformsRef.current) {
        if (player.pos.x < p.x + p.width && player.pos.x + player.width > p.x && player.pos.y < p.y + p.height && player.pos.y + player.height > p.y) {
          if (player.vel.y >= 0 && player.pos.y + player.height - player.vel.y * dt <= p.y + 10) {
            player.pos.y = p.y - player.height;
            player.vel.y = 0;
            player.isGrounded = true;
            player.isDashing = false; 
          }
        }
      }
    }

    if (player.pos.y > canvas.height + 100 || player.pos.x + player.width < cameraRef.current.x) {
       setGameState(GameState.GAME_OVER);
    }

    if (player.vel.x > 0 || Math.abs(player.vel.y) > 0) {
      const color = (player.isSuperDashing || player.isAutoLanding) ? '234, 179, 8' : (player.isDashing ? '34, 211, 238' : '6, 182, 212');
      player.trail.push({ x: player.pos.x, y: player.pos.y, alpha: 1, color });
    }
    player.trail.forEach(t => t.alpha -= dt * 4);
    player.trail = player.trail.filter(t => t.alpha > 0);

    if (player.pos.x > distanceRef.current) {
      distanceRef.current = player.pos.x;
      setScore(Math.floor(distanceRef.current / 100));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = GAME_CONSTANTS.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cameraX = cameraRef.current.x;

    platformsRef.current.forEach(p => {
      const screenX = p.x - cameraX;
      if (screenX + p.width > 0 && screenX < canvas.width) {
        ctx.fillStyle = GAME_CONSTANTS.COLORS.PLATFORM;
        ctx.fillRect(screenX, p.y, p.width, p.height);
        if (p.hasChargeZone && p.chargeZoneOffset !== undefined && p.chargeZoneWidth !== undefined) {
          const zx = screenX + p.chargeZoneOffset;
          const zw = p.chargeZoneWidth;
          ctx.fillStyle = GAME_CONSTANTS.COLORS.CHARGE_ZONE_BG;
          ctx.fillRect(zx, p.y, zw, p.height);
          ctx.shadowBlur = 10; ctx.shadowColor = GAME_CONSTANTS.COLORS.CHARGE_ZONE_GLOW;
          ctx.fillStyle = GAME_CONSTANTS.COLORS.CHARGE_ZONE_GLOW;
          ctx.fillRect(zx, p.y, zw, 4); ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = GAME_CONSTANTS.COLORS.PLATFORM_TOP;
          ctx.fillRect(screenX, p.y, p.width, 4);
        }
      }
    });

    const player = playerRef.current;
    player.trail.forEach(t => {
      const screenX = t.x - cameraX;
      ctx.fillStyle = `rgba(${t.color || '6, 182, 212'}, ${t.alpha * 0.4})`;
      ctx.fillRect(screenX, t.y, player.width, player.height);
    });

    const playerScreenX = player.pos.x - cameraX;
    ctx.fillStyle = (player.isSuperDashing || player.isAutoLanding) ? '#eab308' : (player.isDashing ? GAME_CONSTANTS.COLORS.PLAYER_DASH : GAME_CONSTANTS.COLORS.PLAYER);
    ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(playerScreenX, player.pos.y, player.width, player.height);
    ctx.shadowBlur = 0; 

    if (player.isCharging) {
      const now = performance.now();
      const timeRemaining = Math.max(0, GAME_CONSTANTS.QTE_MAX_HOLD_TIME - (now - player.qteStartTime) / 1000);
      const timePercent = timeRemaining / GAME_CONSTANTS.QTE_MAX_HOLD_TIME;

      const barWidth = 140; const barHeight = 16;
      const barX = playerScreenX + player.width / 2 - barWidth / 2;
      const barY = player.pos.y - 60;
      
      ctx.fillStyle = GAME_CONSTANTS.COLORS.QTE_BAR_BG;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(barX, barY, barWidth * timePercent, barHeight);

      const [sMin, sMax] = player.qteSweetSpotRange;
      ctx.fillStyle = GAME_CONSTANTS.COLORS.QTE_SUCCESS;
      ctx.globalAlpha = 0.6 + Math.sin(now * 0.01) * 0.2;
      ctx.fillRect(barX + barWidth * sMin, barY, barWidth * (sMax - sMin), barHeight);
      ctx.globalAlpha = 1.0;

      const inSweetSpot = player.chargeAmount >= sMin && player.chargeAmount <= sMax;
      ctx.fillStyle = inSweetSpot ? '#ffffff' : '#f59e0b';
      ctx.shadowBlur = inSweetSpot ? 10 : 0; ctx.shadowColor = '#ffffff';
      ctx.fillRect(barX + barWidth * player.chargeAmount - 2, barY - 4, 4, barHeight + 8);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText("RELEASE TO DASH", barX + barWidth / 2, barY - 10);
      
      if (timeRemaining < 1) {
        ctx.fillStyle = GAME_CONSTANTS.COLORS.QTE_FAIL;
        ctx.fillText("OVERHEAT IMMINENT!", barX + barWidth / 2, barY + barHeight + 12);
      }
    }
  };

  const loop = useCallback((time: number) => {
    if (!canvasRef.current || gameState !== GameState.PLAYING) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    }
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1); 
    lastTimeRef.current = time;
    updatePhysics(dt, canvas);
    generatePlatforms(canvas.width, canvas.height);
    draw(ctx, canvas);
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(loop);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, loop]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    inputRef.current = { isDown: true, startX: e.clientX, startY: e.clientY, currentX: e.clientX, downTime: performance.now() };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!inputRef.current.isDown || gameState !== GameState.PLAYING) return;
    inputRef.current.currentX = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!inputRef.current.isDown || gameState !== GameState.PLAYING) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const now = performance.now();
    const duration = now - inputRef.current.downTime;
    const dx = e.clientX - inputRef.current.startX;
    inputRef.current.isDown = false;

    if (playerRef.current.isCharging) {
      const charge = playerRef.current.chargeAmount;
      const [sMin, sMax] = playerRef.current.qteSweetSpotRange;
      if (charge >= sMin && charge <= sMax) {
        playerRef.current.isSuperDashing = true;
        playerRef.current.superDashTimer = GAME_CONSTANTS.SUPER_DASH_DURATION;
      }
      playerRef.current.isCharging = false;
    } else if (dx > GAME_CONSTANTS.SWIPE_MIN_DIST) {
      if (!playerRef.current.isDashing && !playerRef.current.isSuperDashing && !playerRef.current.isAutoLanding) {
        playerRef.current.isDashing = true; playerRef.current.dashTimer = GAME_CONSTANTS.DASH_DURATION;
      }
    } else if (duration < GAME_CONSTANTS.TAP_MAX_TIME) {
      if (playerRef.current.isGrounded && !playerRef.current.isSuperDashing && !playerRef.current.isAutoLanding) {
        playerRef.current.vel.y = GAME_CONSTANTS.JUMP_FORCE;
        playerRef.current.isGrounded = false;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    />
  );
};