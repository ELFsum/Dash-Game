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
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Mutable game state held in refs to avoid re-renders during the game loop
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
    isSuperDashing: false,
    superDashTimer: 0,
    isAutoLanding: false,
    autoLandTarget: null,
    autoLandStartPos: null,
    autoLandTimer: 0
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
      isSuperDashing: false,
      superDashTimer: 0,
      isAutoLanding: false,
      autoLandTarget: null,
      autoLandStartPos: null,
      autoLandTimer: 0
    };
    cameraRef.current.x = 0;
    distanceRef.current = 0;
    
    // Initial starting platform (always give them a safe space and a charge zone to practice)
    platformsRef.current = [{
      x: 50,
      y: 400,
      width: 1000,
      height: GAME_CONSTANTS.PLATFORM_HEIGHT,
      hasChargeZone: true,
      chargeZoneOffset: 400,
      chargeZoneWidth: 200
    }];
  }, []);

  // Initialize on mount or when playing starts
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initGame();
    }
  }, [gameState, initGame]);

  const generatePlatforms = (canvasWidth: number, canvasHeight: number) => {
    const platforms = platformsRef.current;
    const lastPlatform = platforms[platforms.length - 1];
    
    // Generate new platforms if we are getting close to the end of the current ones
    if (lastPlatform && lastPlatform.x + lastPlatform.width < cameraRef.current.x + canvasWidth * 2) {
      const gap = GAME_CONSTANTS.MIN_GAP + Math.random() * (GAME_CONSTANTS.MAX_GAP - GAME_CONSTANTS.MIN_GAP);
      const width = GAME_CONSTANTS.MIN_PLATFORM_WIDTH + Math.random() * (GAME_CONSTANTS.MAX_PLATFORM_WIDTH - GAME_CONSTANTS.MIN_PLATFORM_WIDTH);
      
      // Determine next Y, ensuring it's jumpable
      const maxYChange = 150;
      let nextY = lastPlatform.y + (Math.random() * maxYChange * 2 - maxYChange);
      
      // Constrain Y to screen bounds with some padding
      const minY = canvasHeight * 0.3;
      const maxY = canvasHeight * 0.8;
      nextY = Math.max(minY, Math.min(maxY, nextY));

      // 60% chance to spawn a charge zone on this platform
      const hasChargeZone = Math.random() > 0.4;
      let chargeZoneWidth = 0;
      let chargeZoneOffset = 0;
      
      if (hasChargeZone) {
        chargeZoneWidth = Math.max(80, Math.random() * 150);
        chargeZoneWidth = Math.min(chargeZoneWidth, width); // Don't exceed platform width
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

    // Cleanup old platforms
    platformsRef.current = platforms.filter(p => p.x + p.width > cameraRef.current.x - 200);
  };

  const updatePhysics = (dt: number, canvas: HTMLCanvasElement) => {
    const player = playerRef.current;
    const input = inputRef.current;
    const now = performance.now();

    // 1. Check if Player is Grounded AND inside a Charge Zone
    let inChargeZone = false;
    if (player.isGrounded) {
      const px = player.pos.x + player.width / 2; // Check center of player
      for (const p of platformsRef.current) {
        if (p.hasChargeZone && p.chargeZoneOffset !== undefined && p.chargeZoneWidth !== undefined) {
          const zx = p.x + p.chargeZoneOffset;
          const zw = p.chargeZoneWidth;
          // Player must be horizontally in the zone and vertically on the platform
          if (px >= zx && px <= zx + zw && Math.abs(player.pos.y + player.height - p.y) < 10) {
            inChargeZone = true;
            break;
          }
        }
      }
    }

    // 2. Process Input State for Holding
    let isHolding = false;
    if (input.isDown) {
      const holdDuration = now - input.downTime;
      const dx = input.currentX - input.startX;
      if (holdDuration > GAME_CONSTANTS.HOLD_DELAY && dx < GAME_CONSTANTS.SWIPE_MIN_DIST) {
        // Only allow holding if grounded and in a glowing zone
        if (inChargeZone) {
          isHolding = true;
        }
      }
    }

    // 3. Horizontal & Vertical Movement Handling
    if (player.isAutoLanding && player.autoLandTarget && player.autoLandStartPos) {
      // Lerp perfectly onto the target platform
      player.autoLandTimer += dt;
      const t = Math.min(player.autoLandTimer / GAME_CONSTANTS.AUTO_LAND_DURATION, 1);
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out
      
      player.pos.x = player.autoLandStartPos.x + (player.autoLandTarget.x - player.autoLandStartPos.x) * ease;
      player.pos.y = player.autoLandStartPos.y + (player.autoLandTarget.y - player.autoLandStartPos.y) * ease;
      player.vel.x = 0;
      player.vel.y = 0;

      if (t >= 1) {
        player.isAutoLanding = false;
        player.isGrounded = true;
        player.pos.y = player.autoLandTarget.y; // Snap exactly
      }
    } else if (player.isSuperDashing) {
      // Free flying high speed dash
      player.vel.x = GAME_CONSTANTS.SUPER_DASH_SPEED_X;
      player.vel.y = GAME_CONSTANTS.SUPER_DASH_SPEED_Y; 
      player.superDashTimer -= dt;
      
      if (player.superDashTimer <= 0) {
        player.isSuperDashing = false;
        // Trigger auto land by finding nearest platform ahead
        const aheadPlatforms = platformsRef.current.filter(p => p.x > player.pos.x + 50);
        if (aheadPlatforms.length > 0) {
          aheadPlatforms.sort((a, b) => a.x - b.x);
          const targetPlatform = aheadPlatforms[0];
          
          player.isAutoLanding = true;
          player.autoLandTarget = {
            x: targetPlatform.x + 30, // Land safely 30px inwards
            y: targetPlatform.y - player.height
          };
          player.autoLandStartPos = { x: player.pos.x, y: player.pos.y };
          player.autoLandTimer = 0;
        }
      }
      player.pos.x += player.vel.x * dt;
      player.pos.y += player.vel.y * dt;

    } else if (isHolding) {
      // Holding to charge: freeze player in place
      player.vel.x = 0;
      player.vel.y = 0; 
      player.isCharging = true;
      
      // Ping pong charge bar
      player.chargeAmount += GAME_CONSTANTS.CHARGE_RATE * dt * player.chargeDir;
      if (player.chargeAmount >= 1) {
        player.chargeAmount = 1;
        player.chargeDir = -1;
      } else if (player.chargeAmount <= 0) {
        player.chargeAmount = 0;
        player.chargeDir = 1;
      }
    } else {
      // Normal movement flow
      if (player.isCharging && input.isDown) {
        // Canceled charge via swipe before releasing OR slipped out of the valid zone
        player.isCharging = false;
        player.chargeAmount = 0;
        player.chargeDir = 1;
      }

      if (player.isDashing) {
        player.vel.x = GAME_CONSTANTS.DASH_SPEED;
        player.vel.y = 0; // Float while normal dashing
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) {
          player.isDashing = false;
        }
      } else {
        player.vel.x = GAME_CONSTANTS.BASE_SPEED; // Auto run
      }

      player.pos.x += player.vel.x * dt;

      // Apply Gravity
      if (!player.isDashing) {
        player.vel.y += GAME_CONSTANTS.GRAVITY * dt;
      }
      player.pos.y += player.vel.y * dt;
    }

    // 4. Camera Follow
    const targetCameraX = player.pos.x - canvas.width * 0.2;
    if (targetCameraX > cameraRef.current.x) {
      // Smooth camera follow to avoid snapping heavily during super dashes
      cameraRef.current.x += (targetCameraX - cameraRef.current.x) * dt * 8;
      if (Math.abs(targetCameraX - cameraRef.current.x) < 1) {
        cameraRef.current.x = targetCameraX;
      }
    }

    // 5. Collision Detection (Only if not using special movement)
    if (!player.isAutoLanding && !player.isSuperDashing && !isHolding) {
      player.isGrounded = false;
      for (const p of platformsRef.current) {
        if (
          player.pos.x < p.x + p.width &&
          player.pos.x + player.width > p.x &&
          player.pos.y < p.y + p.height &&
          player.pos.y + player.height > p.y
        ) {
          // Check if coming from above
          if (player.vel.y > 0 && player.pos.y + player.height - player.vel.y * dt <= p.y + 5) {
            player.pos.y = p.y - player.height;
            player.vel.y = 0;
            player.isGrounded = true;
            player.isDashing = false; 
          } else if (player.pos.x + player.width > p.x && player.pos.x < p.x && player.vel.x > 0) {
             // Hit side
             player.pos.x = p.x - player.width;
          }
        }
      }
    }

    // 6. Death Conditions
    if (player.pos.y > canvas.height + 100) {
      setGameState(GameState.GAME_OVER);
    }
    if (player.pos.x + player.width < cameraRef.current.x) {
       setGameState(GameState.GAME_OVER);
    }

    // 7. Update Trail
    if (player.vel.x > 0 || Math.abs(player.vel.y) > 0) {
      const r = player.isSuperDashing || player.isAutoLanding ? 234 : player.isDashing ? 34 : 6;
      const g = player.isSuperDashing || player.isAutoLanding ? 179 : player.isDashing ? 211 : 182;
      const b = player.isSuperDashing || player.isAutoLanding ? 8 : player.isDashing ? 238 : 212;
      player.trail.push({ x: player.pos.x, y: player.pos.y, alpha: 1, color: `${r}, ${g}, ${b}` });
    }
    player.trail.forEach(t => t.alpha -= dt * 3);
    player.trail = player.trail.filter(t => t.alpha > 0);

    // 8. Update Distance & Score
    if (player.pos.x > distanceRef.current) {
      distanceRef.current = player.pos.x;
      setScore(Math.floor(distanceRef.current / 100));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = GAME_CONSTANTS.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cameraX = cameraRef.current.x;

    // Grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const offsetX = -(cameraX % gridSize);
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw Platforms
    platformsRef.current.forEach(p => {
      const screenX = p.x - cameraX;
      if (screenX + p.width > 0 && screenX < canvas.width) {
        // Base platform
        ctx.fillStyle = GAME_CONSTANTS.COLORS.PLATFORM;
        ctx.fillRect(screenX, p.y, p.width, p.height);
        
        // Draw Charge Zone if it exists
        if (p.hasChargeZone && p.chargeZoneOffset !== undefined && p.chargeZoneWidth !== undefined) {
          const zx = screenX + p.chargeZoneOffset;
          const zw = p.chargeZoneWidth;
          
          // Background of zone
          ctx.fillStyle = GAME_CONSTANTS.COLORS.CHARGE_ZONE_BG;
          ctx.fillRect(zx, p.y, zw, p.height);

          // Glowing top edge
          ctx.shadowBlur = 15;
          ctx.shadowColor = GAME_CONSTANTS.COLORS.CHARGE_ZONE_GLOW;
          ctx.fillStyle = GAME_CONSTANTS.COLORS.CHARGE_ZONE_GLOW;
          ctx.fillRect(zx, p.y, zw, 6);
          ctx.shadowBlur = 0;
        } else {
          // Normal top edge
          ctx.fillStyle = GAME_CONSTANTS.COLORS.PLATFORM_TOP;
          ctx.fillRect(screenX, p.y, p.width, 4);
        }
      }
    });

    // Draw Player Trail
    const player = playerRef.current;
    player.trail.forEach(t => {
      const screenX = t.x - cameraX;
      ctx.fillStyle = `rgba(${t.color || '6, 182, 212'}, ${t.alpha * 0.5})`;
      ctx.fillRect(screenX, t.y, player.width, player.height);
    });

    // Draw Player
    const playerScreenX = player.pos.x - cameraX;
    
    if (player.isSuperDashing || player.isAutoLanding) {
      ctx.fillStyle = '#eab308'; // yellow-500
    } else if (player.isDashing) {
      ctx.fillStyle = GAME_CONSTANTS.COLORS.PLAYER_DASH;
    } else {
      ctx.fillStyle = GAME_CONSTANTS.COLORS.PLAYER;
    }
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(playerScreenX, player.pos.y, player.width, player.height);
    ctx.shadowBlur = 0; 

    // Draw Charging Bar
    if (player.isCharging) {
      const barWidth = 60;
      const barHeight = 8;
      const barX = playerScreenX + player.width / 2 - barWidth / 2;
      const barY = player.pos.y - 20;

      // Container background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Sweet Spot Zone Indicator
      const spotMin = GAME_CONSTANTS.CHARGE_SWEET_SPOT_MIN;
      const spotMax = GAME_CONSTANTS.CHARGE_SWEET_SPOT_MAX;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.4)'; // transparent green
      ctx.fillRect(barX + barWidth * spotMin, barY, barWidth * (spotMax - spotMin), barHeight);

      // Current Charge Amount
      const inSweetSpot = player.chargeAmount >= spotMin && player.chargeAmount <= spotMax;
      ctx.fillStyle = inSweetSpot ? '#22c55e' : '#eab308'; // green if good, yellow if not
      ctx.fillRect(barX, barY, barWidth * player.chargeAmount, barHeight);
      
      // Outline border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  };

  const loop = useCallback((time: number) => {
    if (!canvasRef.current || gameState !== GameState.PLAYING) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, loop]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    inputRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      downTime: performance.now()
    };
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

    // Action Hierarchy: Charge Evaluate > Swipe Dash > Tap Jump
    if (playerRef.current.isCharging) {
      const charge = playerRef.current.chargeAmount;
      if (charge >= GAME_CONSTANTS.CHARGE_SWEET_SPOT_MIN && charge <= GAME_CONSTANTS.CHARGE_SWEET_SPOT_MAX) {
        // Successful Sweet Spot Super Dash!
        playerRef.current.isSuperDashing = true;
        playerRef.current.superDashTimer = GAME_CONSTANTS.SUPER_DASH_DURATION;
        playerRef.current.isDashing = false; 
      }
      // Reset charge mechanics regardless of success
      playerRef.current.isCharging = false;
      playerRef.current.chargeAmount = 0;
      playerRef.current.chargeDir = 1;
      
    } else if (dx > GAME_CONSTANTS.SWIPE_MIN_DIST) {
      if (!playerRef.current.isDashing && !playerRef.current.isSuperDashing && !playerRef.current.isAutoLanding) {
        playerRef.current.isDashing = true;
        playerRef.current.dashTimer = GAME_CONSTANTS.DASH_DURATION;
        playerRef.current.vel.y = -200; 
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
