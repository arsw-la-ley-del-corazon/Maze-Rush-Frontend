export type PowerUpType = 'FREEZE' | 'CONFUSION' | 'CLEAR_FOG';

export type ActiveEffectsMap = {
  [K in PowerUpType]?: number; // timestamp de expiración en ms
};

// Lo que viene del backend en cada player
export interface PlayerState {
  username: string;
  position: { x: number; y: number };
  color?: string;
  activeEffects: ActiveEffectsMap;
  // ...otros campos que ya tengas (score, id, etc.)
}

// Notificación que llega por /notifications
export interface PowerUpNotification {
  type: 'POWER_UP';
  message: string;
  sourceUser: string;
  powerUpType: PowerUpType;
}
