import { CELL_TYPE } from '../types/evacuation.types'
import type {
  GridPoint,
  MapDefinition,
  PathResult,
} from '../types/evacuation.types'

interface SearchNode {
  point: GridPoint
  gScore: number
  fScore: number
  order: number
}

type UntimedPathResult = Omit<PathResult, 'elapsedMs'>

const DIRECTIONS: readonly GridPoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

function pointKey(point: GridPoint): string {
  return `${String(point.x)},${String(point.y)}`
}

function isSamePoint(left: GridPoint, right: GridPoint): boolean {
  return left.x === right.x && left.y === right.y
}

function isInsideMap(map: MapDefinition, point: GridPoint): boolean {
  return Number.isInteger(point.x)
    && Number.isInteger(point.y)
    && point.x >= 0
    && point.x < map.width
    && point.y >= 0
    && point.y < map.height
}

function getCell(map: MapDefinition, point: GridPoint) {
  return map.cells[point.y]?.[point.x]
}

function isKnownCell(cell: number): boolean {
  return cell === CELL_TYPE.Walkable
    || cell === CELL_TYPE.Wall
    || cell === CELL_TYPE.Danger
}

function isValidMap(map: MapDefinition): boolean {
  if (
    !Number.isInteger(map.width)
    || !Number.isInteger(map.height)
    || map.width < 1
    || map.height < 1
  ) {
    return false
  }

  if (
    map.cells.length !== map.height
    || !map.cells.every(row =>
      row.length === map.width && row.every(isKnownCell),
    )
  ) {
    return false
  }

  if (!isInsideMap(map, map.start) || !isInsideMap(map, map.exit)) {
    return false
  }

  return getCell(map, map.start) !== CELL_TYPE.Wall
    && getCell(map, map.exit) !== CELL_TYPE.Wall
}

function isWalkable(map: MapDefinition, point: GridPoint): boolean {
  return isInsideMap(map, point)
    && getCell(map, point) === CELL_TYPE.Walkable
}

function heuristic(from: GridPoint, to: GridPoint): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
}

function reconstructPath(
  cameFrom: Map<string, GridPoint>,
  destination: GridPoint,
): GridPoint[] {
  const path: GridPoint[] = [destination]
  let currentKey = pointKey(destination)

  while (cameFrom.has(currentKey)) {
    const previous = cameFrom.get(currentKey)

    if (previous === undefined) {
      break
    }

    path.push(previous)
    currentKey = pointKey(previous)
  }

  return path.reverse()
}

function completeResult(
  startedAt: number,
  result: UntimedPathResult,
): PathResult {
  return {
    ...result,
    elapsedMs: performance.now() - startedAt,
  }
}

export function findPath(map: MapDefinition): PathResult {
  const startedAt = performance.now()

  if (!isValidMap(map)) {
    return completeResult(startedAt, {
      found: false,
      path: [],
      visitedCount: 0,
      reason: 'INVALID_MAP',
    })
  }

  const startKey = pointKey(map.start)
  const openNodes: SearchNode[] = [{
    point: map.start,
    gScore: 0,
    fScore: heuristic(map.start, map.exit),
    order: 0,
  }]
  const gScores = new Map<string, number>([[startKey, 0]])
  const cameFrom = new Map<string, GridPoint>()
  const closedKeys = new Set<string>()

  let nextOrder = 1
  let visitedCount = 0

  while (openNodes.length > 0) {
    // fScoreが同じ場合は追加順を維持し、隣接評価順を結果へ反映する。
    openNodes.sort(
      (left, right) =>
        left.fScore - right.fScore || left.order - right.order,
    )

    const current = openNodes.shift()

    if (current === undefined) {
      break
    }

    const currentKey = pointKey(current.point)

    if (closedKeys.has(currentKey)) {
      continue
    }

    closedKeys.add(currentKey)
    visitedCount += 1

    if (isSamePoint(current.point, map.exit)) {
      return completeResult(startedAt, {
        found: true,
        path: reconstructPath(cameFrom, current.point),
        visitedCount,
      })
    }

    for (const direction of DIRECTIONS) {
      const neighbor: GridPoint = {
        x: current.point.x + direction.x,
        y: current.point.y + direction.y,
      }

      if (!isWalkable(map, neighbor)) {
        continue
      }

      const neighborKey = pointKey(neighbor)

      if (closedKeys.has(neighborKey)) {
        continue
      }

      const tentativeGScore = current.gScore + 1
      const knownGScore = gScores.get(neighborKey)

      if (
        knownGScore !== undefined
        && tentativeGScore >= knownGScore
      ) {
        continue
      }

      cameFrom.set(neighborKey, current.point)
      gScores.set(neighborKey, tentativeGScore)
      openNodes.push({
        point: neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + heuristic(neighbor, map.exit),
        order: nextOrder,
      })
      nextOrder += 1
    }
  }

  return completeResult(startedAt, {
    found: false,
    path: [],
    visitedCount,
    reason: 'NO_ROUTE',
  })
}
