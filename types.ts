export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vector2;
  vel: Vector2;
  width: number;
  height: number;
  isGrounded: boolean;
  isDashing: boolean;
  dashTimer: number;
  trail: { x: number; y: number; alpha: number, color?: string }[];
  
  // Super Dash & Charging states
  chargeAmount: number;
  chargeDir: number;
  isCharging: boolean;
  isSuperDashing: boolean;
  superDashTimer: number;
  isAutoLanding: boolean;
  autoLandTarget: Vector2 | null;
  autoLandStartPos: Vector2 | null;
  autoLandTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  hasChargeZone?: boolean;
  chargeZoneOffset?: number;
  chargeZoneWidth?: number;
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface InputState {
  isDown: boolean;
  startX: number;
  startY: number;
  currentX: number;
  downTime: number;
}
