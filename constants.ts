export const GAME_CONSTANTS = {
  // Physics & Movement
  BASE_SPEED: 400,        // Pixels per second moving right
  GRAVITY: 2000,          // Downward acceleration
  JUMP_FORCE: -800,       // Upward velocity applied on jump
  DASH_SPEED: 1200,       // Speed during normal dash
  DASH_DURATION: 0.2,     // Seconds normal dash lasts

  // Super Dash & Charge Mechanics
  CHARGE_RATE: 2.0,       // Units per second (fills 0 to 1 in 0.5s)
  CHARGE_SWEET_SPOT_MIN: 0.75, // 75% charge
  CHARGE_SWEET_SPOT_MAX: 0.90, // 90% charge
  SUPER_DASH_DURATION: 0.4,    // Seconds flying through the air
  SUPER_DASH_SPEED_X: 1800,    // High horizontal speed
  SUPER_DASH_SPEED_Y: -600,    // Upward angle
  AUTO_LAND_DURATION: 0.3,     // Interpolation duration to land perfectly
  
  // Input Thresholds
  TAP_MAX_TIME: 200,      // ms to be considered a tap (jump)
  HOLD_DELAY: 120,        // ms before touch is considered a "hold" (stop)
  SWIPE_MIN_DIST: 60,     // pixels moved to trigger dash

  // Dimensions
  PLAYER_SIZE: 30,
  MIN_PLATFORM_WIDTH: 100,
  MAX_PLATFORM_WIDTH: 400,
  MIN_GAP: 80,
  MAX_GAP: 250,
  PLATFORM_HEIGHT: 30,

  // Visuals
  COLORS: {
    BACKGROUND: '#0f172a', // slate-900
    PLAYER: '#06b6d4',     // cyan-500
    PLAYER_DASH: '#22d3ee',// cyan-400
    PLATFORM: '#a855f7',   // purple-500
    PLATFORM_TOP: '#d8b4fe',// purple-300
    TRAIL: 'rgba(6, 182, 212, 0.5)',
    CHARGE_ZONE_BG: 'rgba(74, 222, 128, 0.15)', // green-400 with opacity
    CHARGE_ZONE_GLOW: '#4ade80',                // green-400
  }
};
