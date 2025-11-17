import { TetrominoShape } from './types';

// クラシックテトロミノ (4ブロック)
export const CLASSIC_SHAPES: TetrominoShape[] = [
  {
    name: 'I',
    color: 0x00ffff,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
  },
  {
    name: 'O',
    color: 0xffff00,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    name: 'T',
    color: 0xff00ff,
    blocks: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'S',
    color: 0x00ff00,
    blocks: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    name: 'Z',
    color: 0xff0000,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'J',
    color: 0x0000ff,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'L',
    color: 0xff8800,
    blocks: [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
];

// トライオミノ (3ブロック)
export const TRIO_SHAPES: TetrominoShape[] = [
  {
    name: 'I3',
    color: 0x00ffff,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  },
  {
    name: 'L3',
    color: 0xff00ff,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
];

// ペントミノ (5ブロック) - 12種類から代表的なものを選択
export const PENTO_SHAPES: TetrominoShape[] = [
  {
    name: 'F',
    color: 0xff1493,
    blocks: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    name: 'I5',
    color: 0x00ffff,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
  },
  {
    name: 'L5',
    color: 0xff8800,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
    ],
  },
  {
    name: 'N',
    color: 0x9370db,
    blocks: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  {
    name: 'P',
    color: 0x00ff00,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  {
    name: 'T5',
    color: 0xff00ff,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    name: 'U',
    color: 0xffd700,
    blocks: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    name: 'V',
    color: 0xff6347,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },
  {
    name: 'W',
    color: 0x4169e1,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },
  {
    name: 'X',
    color: 0xff1493,
    blocks: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    name: 'Y',
    color: 0x00ced1,
    blocks: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  },
  {
    name: 'Z5',
    color: 0xff0000,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },
];

export function getShapesByMode(mode: string): TetrominoShape[] {
  switch (mode) {
    case 'trio':
      return TRIO_SHAPES;
    case 'pento':
      return PENTO_SHAPES;
    case 'circular':
    case 'classic':
    default:
      return CLASSIC_SHAPES;
  }
}
