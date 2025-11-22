// Tipos alineados con el OpenAPI proporcionado (v1.0.0) — solo simulación local
export interface UserInfo {
  id: string
  username: string
  email: string
  score?: number
  level?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number // segundos
  expiresAt: string // ISO date-time
  user: UserInfo
}

export interface LoginRequest {
  username?: string
  email?: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export type UserResponse = UserInfo

export interface UserRequest {
  username?: string
  email?: string
  password?: string
}

export interface ApiErrorShape {
  status: number
  message: string
  path?: string
  details?: string[]
}

// Lobby Types
export interface LobbyResponse {
  id: string
  code: string
  mazeSize: string
  maxPlayers: number
  isPublic: boolean
  status: string
  creatorUsername: string
  createdAt: string
  currentPlayers?: number // Número actual de jugadores en la sala
}

export interface LobbyWithPlayersResponse extends LobbyResponse {
  players: string[]
}

export interface LobbyRequest {
  mazeSize: string
  maxPlayers: number
  isPublic: boolean
  status?: string
}

export interface ChatMessage {
  username: string
  message: string
  timestamp?: string
}

// Game Types
export interface GameState {
  lobbyCode: string
  mazeId: string // UUID del laberinto generado por el backend
  players: PlayerGameState[]
  status: "waiting" | "in-progress" | "finished"
  startedAt?: string
  finishedAt?: string
}

// Maze entity from backend (not used directly in game, but for reference)
export interface MazeEntity {
  id: string
  size: string
  width: number
  height: number
  layout: number[][] // 0 = path, 1 = wall
  startX: number
  startY: number
  goalX: number
  goalY: number
}

export interface PlayerGameState {
  username: string
  position: { x: number; y: number }
  isFinished: boolean
  finishTime?: number
  score?: number
  avatarColor?: string
}

export interface GameMoveEvent {
  type: "move"
  username: string
  position: { x: number; y: number }
  timestamp: string
}

export interface GameFinishEvent {
  type: "finish"
  username: string
  finishTime: number
  timestamp: string
}

export interface GameStartEvent {
  type: "start"
  mazeId: string // UUID del laberinto a usar
  players: string[]
  timestamp: string
}

export interface GamePlayerEvent {
  type: "player_joined" | "player_left"
  username: string
  timestamp: string
}

export type GameEvent = GameMoveEvent | GameFinishEvent | GameStartEvent | GamePlayerEvent

export interface GameSyncMessage {
  type: "sync"
  players: PlayerGameState[]
  timestamp: string
}

// Utilidades
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiErrorShape }
