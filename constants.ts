export const GAME_CONSTANTS = {
  // Physics & Movement
  MIN_SPEED: 350,         
  MAX_SPEED: 850,         
  SPEED_SCALE: 0.1,       
  GRAVITY: 2200,          
  JUMP_FORCE: -850,       
  DASH_SPEED_MULT: 2.5,   
  DASH_DURATION: 0.2,

  // Super Dash & QTE Mechanics
  QTE_CYCLE_DURATION: 0.8,      // Time for marker to go from 0 to 1
  QTE_MAX_HOLD_TIME: 2.5,       // Max time allowed to hold before auto-fail
  QTE_SWEET_SPOT_WIDTH: 0.18,   // Size of the success zone (18% of bar)
  
  SUPER_DASH_DURATION: 0.8,    
  SUPER_DASH_SPEED_MULT: 4.5,    
  SUPER_DASH_SPEED_Y: 0,
  AUTO_LAND_DURATION: 0.4,       // Restored duration for landing sequence
  
  // Input Thresholds
  TAP_MAX_TIME: 200,      
  HOLD_DELAY: 100,        
  SWIPE_MIN_DIST: 60,     

  // Dimensions
  START_PLATFORM_WIDTH: 450,
  MIN_PLATFORM_WIDTH_TARGET: 140,
  START_GAP: 80,
  MAX_GAP_SAFETY_MARGIN: 0.82, 

  PLATFORM_HEIGHT: 30,
  PLAYER_SIZE: 32,

  // Visuals
  COLORS: {
    BACKGROUND: '#0f172a',
    PLAYER: '#06b6d4',
    PLAYER_DASH: '#22d3ee',
    PLATFORM: '#a855f7',
    PLATFORM_TOP: '#d8b4fe',
    TRAIL: 'rgba(6, 182, 212, 0.5)',
    CHARGE_ZONE_BG: 'rgba(34, 197, 94, 0.15)', 
    CHARGE_ZONE_GLOW: '#22c55e',                
    QTE_SUCCESS: '#22c55e', 
    QTE_FAIL: '#ef4444',    
    QTE_BAR_BG: 'rgba(15, 23, 42, 0.9)',
  }
};