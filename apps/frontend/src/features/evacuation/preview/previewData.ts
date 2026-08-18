import type { MapDefinition, PathResult } from '../types/evacuation.types'

export const previewMap: MapDefinition = {
  id: 'normal',
  name: '3D表示プレビュー',
  width: 12,
  height: 8,
  cells: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 2, 0, 1, 0, 0, 0, 0],
    [0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  start: { x: 0, y: 7 },
  exit: { x: 11, y: 0 },
}

export const previewPath: PathResult['path'] = [
  { x: 0, y: 7 },
  { x: 0, y: 6 },
  { x: 0, y: 5 },
  { x: 0, y: 4 },
  { x: 0, y: 3 },
  { x: 0, y: 2 },
  { x: 0, y: 1 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 9, y: 0 },
  { x: 10, y: 0 },
  { x: 11, y: 0 },
]
