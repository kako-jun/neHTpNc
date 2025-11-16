export type GameMode = 'classic' | 'trio' | 'pento' | 'circular' | 'gravity-flip' | 'mirror';

export interface BlockPosition {
  x: number;
  y: number;
  z?: number; // 3D用
}

export interface TetrominoShape {
  blocks: BlockPosition[];
  color: number;
  name: string;
}

export interface GameState {
  mode: GameMode;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
}
