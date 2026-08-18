import { describe, expect, it } from 'vitest'
import { CELL_TYPE } from '../types/evacuation.types'
import type { MapDefinition } from '../types/evacuation.types'
import { findPath } from './pathfinder'
import { DEMO_MAPS } from '../data/demoMaps'

describe('findPath', () => {
  it('直線経路: スタートから出口までの最短経路を返す', () => {
    const map: MapDefinition = {
      id: 'normal',
      name: '直線経路テスト',
      width: 3,
      height: 1,
      cells: [[
        CELL_TYPE.Walkable,
        CELL_TYPE.Walkable,
        CELL_TYPE.Walkable,
      ]],
      start: { x: 0, y: 0 },
      exit: { x: 2, y: 0 },
    }

    const result = findPath(map)

    expect(result.found).toBe(true)
    expect(result.path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ])
    expect(result.visitedCount).toBe(3)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(result.reason).toBeUndefined()
  })

  it('壁がある場合: 上側を迂回して出口まで到達する', () => {
    const map: MapDefinition = {
        id: 'normal',
        name: '壁迂回テスト',
        width: 3,
        height: 3,
        cells: [
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Walkable,
            CELL_TYPE.Walkable,
        ],
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Wall,
            CELL_TYPE.Walkable,
        ],
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Walkable,
            CELL_TYPE.Walkable,
        ],
        ],
        start: { x: 0, y: 1 },
        exit: { x: 2, y: 1 },
    }

    const result = findPath(map)

    expect(result.found).toBe(true)
    expect(result.path).toEqual([
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
    ])
    expect(result.reason).toBeUndefined()
  })

  it('壁で完全に分断されている場合: NO_ROUTEを返す', () => {
    const map: MapDefinition = {
        id: 'normal',
        name: '経路なしテスト',
        width: 3,
        height: 3,
        cells: [
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Wall,
            CELL_TYPE.Walkable,
        ],
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Wall,
            CELL_TYPE.Walkable,
        ],
        [
            CELL_TYPE.Walkable,
            CELL_TYPE.Wall,
            CELL_TYPE.Walkable,
        ],
        ],
        start: { x: 0, y: 1 },
        exit: { x: 2, y: 1 },
    }

    const result = findPath(map)

    expect(result.found).toBe(false)
    expect(result.path).toEqual([])
    expect(result.visitedCount).toBeGreaterThan(0)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(result.reason).toBe('NO_ROUTE')
  })

  it('スタートと出口が同じ場合: その1マスだけの経路を返す', () => {
    const map: MapDefinition = {
        id: 'normal',
        name: '同一地点テスト',
        width: 1,
        height: 1,
        cells: [[CELL_TYPE.Walkable]],
        start: { x: 0, y: 0 },
        exit: { x: 0, y: 0 },
    }

    const result = findPath(map)

    expect(result.found).toBe(true)
    expect(result.path).toEqual([
        { x: 0, y: 0 },
    ])
    expect(result.visitedCount).toBe(1)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(result.reason).toBeUndefined()
    })

function expectInvalidMap(map: MapDefinition): void {
    const result = findPath(map)

    expect(result.found).toBe(false)
    expect(result.path).toEqual([])
    expect(result.visitedCount).toBe(0)
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
    expect(result.reason).toBe('INVALID_MAP')
}

it('widthが0の場合: INVALID_MAPを返す', () => {
    const map: MapDefinition = {
      id: 'normal',
      name: '不正な幅',
      width: 0,
      height: 1,
      cells: [[]],
      start: { x: 0, y: 0 },
      exit: { x: 0, y: 0 },
}

  expectInvalidMap(map)
})

it('行の長さがwidthと一致しない場合: INVALID_MAPを返す', () => {
  const map: MapDefinition = {
      id: 'normal',
      name: '不正な行長',
      width: 2,
      height: 1,
      cells: [[CELL_TYPE.Walkable]],
      start: { x: 0, y: 0 },
      exit: { x: 0, y: 0 },
  }

    expectInvalidMap(map)
    })

    it('出口がマップ範囲外の場合: INVALID_MAPを返す', () => {
    const map: MapDefinition = {
        id: 'normal',
        name: '範囲外の出口',
        width: 1,
        height: 1,
        cells: [[CELL_TYPE.Walkable]],
        start: { x: 0, y: 0 },
        exit: { x: 1, y: 0 },
    }

    expectInvalidMap(map)
    })

    it('スタートが壁の場合: INVALID_MAPを返す', () => {
    const map: MapDefinition = {
        id: 'normal',
        name: '壁上のスタート',
        width: 2,
        height: 1,
        cells: [[
        CELL_TYPE.Wall,
        CELL_TYPE.Walkable,
        ]],
        start: { x: 0, y: 0 },
        exit: { x: 1, y: 0 },
    }

    expectInvalidMap(map)
    })

    it.each([
        ['スタート', { x: 0, y: 0 }, { x: 1, y: 0 }],
        ['出口', { x: 1, y: 0 }, { x: 0, y: 0 }],
    ] as const)(
        '%sが危険マスの場合: INVALID_MAPを返す',
        (_label, start, exit) => {
            const map: MapDefinition = {
                id: 'fire',
                name: '危険マス上の地点',
                width: 2,
                height: 1,
                cells: [[
                    CELL_TYPE.Danger,
                    CELL_TYPE.Walkable,
                ]],
                start,
                exit,
            }

            expectInvalidMap(map)
        },
    )

    it('危険マスがある場合: 危険マスを通らずに迂回する', () => {
        const map: MapDefinition = {
            id: 'fire',
            name: '危険マス迂回テスト',
            width: 3,
            height: 3,
            cells: [
            [
                CELL_TYPE.Walkable,
                CELL_TYPE.Walkable,
                CELL_TYPE.Walkable,
            ],
            [
                CELL_TYPE.Walkable,
                CELL_TYPE.Danger,
                CELL_TYPE.Walkable,
            ],
            [
                CELL_TYPE.Walkable,
                CELL_TYPE.Walkable,
                CELL_TYPE.Walkable,
            ],
            ],
            start: { x: 0, y: 1 },
            exit: { x: 2, y: 1 },
        }

        const result = findPath(map)

        expect(result.found).toBe(true)
        expect(result.path).toEqual([
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
        ])
        expect(result.path).not.toContainEqual({ x: 1, y: 1 })
        expect(result.reason).toBeUndefined()
        })

        it('同じマップを複数回計算した場合: 毎回同じ経路を返す', () => {
    const firstResult = findPath(DEMO_MAPS.normal)

    expect(firstResult.found).toBe(true)
    expect(firstResult.path.length).toBeGreaterThan(0)

    for (let iteration = 0; iteration < 5; iteration += 1) {
        const repeatedResult = findPath(DEMO_MAPS.normal)

        expect(repeatedResult.found).toBe(true)
        expect(repeatedResult.path).toEqual(firstResult.path)
    }
    })
    it('経路計算を実行した場合: 入力マップを書き換えない', () => {
        const map = structuredClone(DEMO_MAPS.fire)
        const originalMap = structuredClone(map)

        findPath(map)

        expect(map).toEqual(originalMap)
    })
})
