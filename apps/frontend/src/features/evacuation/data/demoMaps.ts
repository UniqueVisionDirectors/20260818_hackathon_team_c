import { CELL_TYPE } from '../types/evacuation.types'
import type {
  MapDefinition,
  ScenarioId,
} from '../types/evacuation.types'

const O = CELL_TYPE.Walkable
const W = CELL_TYPE.Wall
const D = CELL_TYPE.Danger

// 各内側配列が1行を表し、cells[y][x]で参照する。
export const DEMO_MAPS: Record<ScenarioId, MapDefinition> = {
  normal: {
    id: 'normal',
    name: '通常時',
    width: 12,
    height: 8,
    cells: [
      [O, O, O, O, O, O, O, O, O, O, O, O],
      [W, W, W, W, W, W, W, W, W, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, O, O, O, O, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, O, O, O, O, O, O, O],
    ],
    start: { x: 0, y: 7 },
    exit: { x: 11, y: 0 },
  },

  fire: {
    id: 'fire',
    name: '火災時',
    width: 12,
    height: 8,
    cells: [
      [O, O, O, O, O, O, O, O, O, O, O, O],
      [W, W, W, W, W, W, W, W, W, O, O, O],
      [O, O, O, O, O, W, O, O, O, D, O, O],
      [O, O, O, O, O, W, O, O, O, D, O, O],
      [O, O, O, O, O, O, O, D, D, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, W, O, O, O, O, O, O],
      [O, O, O, O, O, O, O, O, O, O, O, O],
    ],
    start: { x: 0, y: 7 },
    exit: { x: 11, y: 0 },
  },
}
