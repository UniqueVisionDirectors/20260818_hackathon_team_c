export const CELL_TYPE = {
  Walkable: 0,
  Wall: 1,
  Danger: 2,
} as const

export type CellType = (typeof CELL_TYPE)[keyof typeof CELL_TYPE]

export type ScenarioId = 'normal' | 'fire'

export interface GridPoint {
  x: number
  y: number
}

export interface MapDefinition {
  id: ScenarioId
  name: string
  width: number
  height: number
  cells: CellType[][]
  start: GridPoint
  exit: GridPoint
}

export interface PathResult {
  found: boolean
  path: GridPoint[]
  visitedCount: number
  elapsedMs: number
  reason?: 'NO_ROUTE' | 'INVALID_MAP'
}

export type SimulationStatus =
  | 'idle'
  | 'calculating'
  | 'ready'
  | 'running'
  | 'completed'
  | 'error'

export interface ScenarioOption {
  id: ScenarioId
  label: string
}

export const SCENARIO_OPTIONS: readonly ScenarioOption[] = [
  { id: 'normal', label: '通常時' },
  { id: 'fire', label: '火災発生時' },
]
