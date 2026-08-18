import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { createEngine } from '@/renderer/createEngine'
import type { RendererBackend, RendererInfo } from '@/renderer/types'
import {
  CELL_TYPE,
  type GridPoint,
  type MapDefinition,
} from '../types/evacuation.types'
import { createEvacuationScene, frameEvacuationMap } from './createEvacuationScene'

const TILE_HEIGHT = 0.06
const WALL_HEIGHT = 1.35
const ROUTE_HEIGHT = 0.14
const EVACUEE_HEIGHT = 0.36
const SIMULATION_SPEED = 2

interface EvacuationMaterials {
  foundation: StandardMaterial
  walkable: StandardMaterial
  wall: StandardMaterial
  danger: StandardMaterial
  start: StandardMaterial
  exit: StandardMaterial
  route: StandardMaterial
  evacuee: StandardMaterial
}

interface SimulationState {
  positions: Vector3[]
  segmentIndex: number
  distanceOnSegment: number
}

export interface EvacuationRendererOptions {
  backend?: RendererBackend
  onSimulationCompleted?: () => void
}

const createMaterial = (
  name: string,
  diffuseColor: Color3,
  scene: Scene,
  emissiveColor = Color3.Black(),
): StandardMaterial => {
  const material = new StandardMaterial(name, scene)
  material.diffuseColor = diffuseColor
  material.emissiveColor = emissiveColor
  material.specularColor = new Color3(0.08, 0.08, 0.08)
  return material
}

const createMaterials = (scene: Scene): EvacuationMaterials => ({
  foundation: createMaterial('foundation-material', new Color3(0.2, 0.23, 0.26), scene),
  walkable: createMaterial('walkable-material', new Color3(0.76, 0.78, 0.8), scene),
  wall: createMaterial('wall-material', new Color3(0.18, 0.2, 0.23), scene),
  danger: createMaterial(
    'danger-material',
    new Color3(0.88, 0.2, 0.08),
    scene,
    new Color3(0.24, 0.035, 0.01),
  ),
  start: createMaterial(
    'start-material',
    new Color3(0.05, 0.38, 0.92),
    scene,
    new Color3(0.01, 0.08, 0.24),
  ),
  exit: createMaterial(
    'exit-material',
    new Color3(0.05, 0.7, 0.26),
    scene,
    new Color3(0.01, 0.18, 0.05),
  ),
  route: createMaterial(
    'route-material',
    new Color3(1, 0.78, 0.02),
    scene,
    new Color3(0.34, 0.2, 0),
  ),
  evacuee: createMaterial(
    'evacuee-material',
    new Color3(0.02, 0.3, 0.95),
    scene,
    new Color3(0.01, 0.06, 0.25),
  ),
})

const assertMapShape = (map: MapDefinition): void => {
  if (!Number.isInteger(map.width) || !Number.isInteger(map.height)
    || map.width < 1 || map.height < 1 || map.cells.length !== map.height) {
    throw new Error('Map dimensions do not match the cell data.')
  }

  for (const row of map.cells) {
    if (row.length !== map.width) {
      throw new Error('Map dimensions do not match the cell data.')
    }
  }
}

const isPointInMap = (point: GridPoint, map: MapDefinition): boolean =>
  Number.isInteger(point.x)
  && Number.isInteger(point.y)
  && point.x >= 0
  && point.x < map.width
  && point.y >= 0
  && point.y < map.height

const assertPointsInMap = (points: readonly GridPoint[], map: MapDefinition): void => {
  if (points.some(point => !isPointInMap(point, map))) {
    throw new Error('A route point is outside the map.')
  }
}

const toWorldPosition = (
  point: GridPoint,
  map: MapDefinition,
  height = 0,
): Vector3 => new Vector3(
  point.x - ((map.width - 1) / 2),
  height,
  point.y - ((map.height - 1) / 2),
)

export class EvacuationRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly requestedBackend: RendererBackend
  private readonly onSimulationCompleted: (() => void) | undefined
  private engine: AbstractEngine | null = null
  private scene: Scene | null = null
  private camera: ArcRotateCamera | null = null
  private materials: EvacuationMaterials | null = null
  private currentMap: MapDefinition | null = null
  private mapRoot: TransformNode | null = null
  private routeRoot: TransformNode | null = null
  private evacuee: Mesh | null = null
  private simulation: SimulationState | null = null
  private disposed = false
  private rendering = false

  private readonly renderFrame = (): void => {
    const engine = this.engine

    if (!engine) {
      return
    }

    this.updateSimulation(engine.getDeltaTime() / 1000)
    this.scene?.render()
  }

  constructor(canvas: HTMLCanvasElement, options: EvacuationRendererOptions = {}) {
    this.canvas = canvas
    this.requestedBackend = options.backend ?? 'webgl'
    this.onSimulationCompleted = options.onSimulationCompleted
  }

  private isDisposed(): boolean {
    return this.disposed
  }

  async initialize(): Promise<RendererInfo> {
    if (this.isDisposed()) {
      throw new Error('Cannot initialize a disposed renderer.')
    }

    if (this.engine || this.scene) {
      throw new Error('Renderer has already been initialized.')
    }

    const result = await createEngine(this.canvas, this.requestedBackend)

    if (this.isDisposed()) {
      result.engine.dispose()
      throw new Error('Renderer was disposed during initialization.')
    }

    this.engine = result.engine

    try {
      const context = createEvacuationScene(result.engine, this.canvas)
      this.scene = context.scene
      this.camera = context.camera
      this.materials = createMaterials(context.scene)
      this.startRendering()
    } catch (error) {
      result.engine.dispose()
      this.engine = null
      throw error
    }

    return {
      requestedBackend: result.requestedBackend,
      activeBackend: result.activeBackend,
      fallbackReason: result.fallbackReason,
    }
  }

  renderMap(map: MapDefinition): void {
    const scene = this.requireScene()
    const materials = this.requireMaterials()
    assertMapShape(map)

    if (!isPointInMap(map.start, map) || !isPointInMap(map.exit, map)) {
      throw new Error('The start or exit is outside the map.')
    }

    this.reset()
    this.mapRoot?.dispose()

    const root = new TransformNode('evacuation-map', scene)
    this.mapRoot = root
    this.currentMap = map

    const foundation = MeshBuilder.CreateBox(
      'map-foundation',
      { width: map.width + 0.24, height: 0.1, depth: map.height + 0.24 },
      scene,
    )
    foundation.position.y = -0.05
    foundation.material = materials.foundation
    foundation.parent = root

    for (let y = 0; y < map.height; y += 1) {
      const row = map.cells[y]

      if (!row) {
        throw new Error('Map row is missing.')
      }

      for (let x = 0; x < map.width; x += 1) {
        const cell = row[x]

        if (cell === undefined) {
          throw new Error('Map cell is missing.')
        }

        const position = toWorldPosition({ x, y }, map)
        const tile = MeshBuilder.CreateBox(
          `tile-${String(x)}-${String(y)}`,
          { width: 0.94, height: TILE_HEIGHT, depth: 0.94 },
          scene,
        )
        tile.position.copyFrom(position)
        tile.position.y = TILE_HEIGHT / 2
        tile.material = cell === CELL_TYPE.Danger ? materials.danger : materials.walkable
        tile.parent = root

        if (cell === CELL_TYPE.Wall) {
          const wall = MeshBuilder.CreateBox(
            `wall-${String(x)}-${String(y)}`,
            { width: 0.92, height: WALL_HEIGHT, depth: 0.92 },
            scene,
          )
          wall.position.copyFrom(position)
          wall.position.y = WALL_HEIGHT / 2 + TILE_HEIGHT
          wall.material = materials.wall
          wall.parent = root
        }
      }
    }

    this.createLocationMarker('start', map.start, materials.start, root)
    this.createLocationMarker('exit', map.exit, materials.exit, root)
    frameEvacuationMap(this.requireCamera(), map.width, map.height)
  }

  renderPath(path: readonly GridPoint[]): void {
    const scene = this.requireScene()
    const materials = this.requireMaterials()
    const map = this.requireMap()
    assertPointsInMap(path, map)

    this.clearSimulation()
    this.evacuee?.dispose()
    this.evacuee = null
    this.routeRoot?.dispose()
    this.routeRoot = null

    if (path.length === 0) {
      return
    }

    const root = new TransformNode('evacuation-route', scene)
    this.routeRoot = root
    const positions = path.map(point => toWorldPosition(point, map, ROUTE_HEIGHT))

    if (positions.length > 1) {
      const route = MeshBuilder.CreateTube(
        'route-line',
        { path: positions, radius: 0.065, tessellation: 12 },
        scene,
      )
      route.material = materials.route
      route.parent = root
    }

    for (const [index, position] of positions.entries()) {
      const marker = MeshBuilder.CreateSphere(
        `route-point-${String(index)}`,
        { diameter: 0.18, segments: 12 },
        scene,
      )
      marker.position.copyFrom(position)
      marker.material = materials.route
      marker.parent = root
    }
  }

  startSimulation(path: readonly GridPoint[]): void {
    const scene = this.requireScene()
    const materials = this.requireMaterials()
    const map = this.requireMap()
    assertPointsInMap(path, map)

    if (path.length === 0) {
      throw new Error('Cannot start a simulation without a route.')
    }

    this.clearSimulation()
    this.evacuee?.dispose()

    const evacuee = MeshBuilder.CreateSphere(
      'evacuee',
      { diameter: 0.5, segments: 20 },
      scene,
    )
    evacuee.material = materials.evacuee
    this.evacuee = evacuee

    const positions = path.map(point => toWorldPosition(point, map, EVACUEE_HEIGHT))
    const start = positions[0]

    if (!start) {
      throw new Error('Cannot start a simulation without a route.')
    }

    evacuee.position.copyFrom(start)

    if (positions.length === 1) {
      this.onSimulationCompleted?.()
      return
    }

    this.simulation = {
      positions,
      segmentIndex: 0,
      distanceOnSegment: 0,
    }
  }

  reset(): void {
    this.clearSimulation()
    this.routeRoot?.dispose()
    this.routeRoot = null
    this.evacuee?.dispose()
    this.evacuee = null
  }

  resize(): void {
    this.engine?.resize()
  }

  setSuspended(suspended: boolean): void {
    if (suspended) {
      this.stopRendering()
      return
    }

    this.startRendering()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.stopRendering()
    this.clearSimulation()
    this.routeRoot?.dispose()
    this.mapRoot?.dispose()
    this.evacuee?.dispose()
    this.scene?.dispose()
    this.engine?.dispose()
    this.routeRoot = null
    this.mapRoot = null
    this.evacuee = null
    this.materials = null
    this.currentMap = null
    this.camera = null
    this.scene = null
    this.engine = null
  }

  private createLocationMarker(
    name: 'start' | 'exit',
    point: GridPoint,
    material: StandardMaterial,
    parent: TransformNode,
  ): void {
    const scene = this.requireScene()
    const map = this.requireMap()
    const marker = MeshBuilder.CreateCylinder(
      `${name}-marker`,
      { diameter: 0.62, height: 0.1, tessellation: 32 },
      scene,
    )
    marker.position.copyFrom(toWorldPosition(point, map, TILE_HEIGHT + 0.05))
    marker.material = material
    marker.parent = parent
  }

  private updateSimulation(deltaSeconds: number): void {
    const state = this.simulation
    const evacuee = this.evacuee

    if (!state || !evacuee) {
      return
    }

    let remainingDistance = Math.max(0, deltaSeconds) * SIMULATION_SPEED

    while (state.segmentIndex < state.positions.length - 1) {
      const from = state.positions[state.segmentIndex]
      const to = state.positions[state.segmentIndex + 1]

      if (!from || !to) {
        this.finishSimulation()
        return
      }

      const segmentLength = Vector3.Distance(from, to)

      if (segmentLength === 0) {
        state.segmentIndex += 1
        state.distanceOnSegment = 0
        continue
      }

      const distanceToEnd = segmentLength - state.distanceOnSegment

      if (remainingDistance < distanceToEnd) {
        state.distanceOnSegment += remainingDistance
        Vector3.LerpToRef(
          from,
          to,
          state.distanceOnSegment / segmentLength,
          evacuee.position,
        )
        return
      }

      evacuee.position.copyFrom(to)
      remainingDistance -= distanceToEnd
      state.segmentIndex += 1
      state.distanceOnSegment = 0
    }

    this.finishSimulation()
  }

  private finishSimulation(): void {
    this.simulation = null
    this.onSimulationCompleted?.()
  }

  private clearSimulation(): void {
    this.simulation = null
  }

  private requireScene(): Scene {
    if (!this.scene) {
      throw new Error('Initialize the renderer before rendering a map.')
    }

    return this.scene
  }

  private requireMaterials(): EvacuationMaterials {
    if (!this.materials) {
      throw new Error('Initialize the renderer before rendering a map.')
    }

    return this.materials
  }

  private requireMap(): MapDefinition {
    if (!this.currentMap) {
      throw new Error('Render a map before rendering a route.')
    }

    return this.currentMap
  }

  private requireCamera(): ArcRotateCamera {
    if (!this.camera) {
      throw new Error('The evacuation camera is not available.')
    }

    return this.camera
  }

  private startRendering(): void {
    if (this.rendering || this.disposed || !this.engine || !this.scene) {
      return
    }

    this.engine.runRenderLoop(this.renderFrame)
    this.rendering = true
  }

  private stopRendering(): void {
    if (!this.rendering || !this.engine) {
      return
    }

    this.engine.stopRenderLoop(this.renderFrame)
    this.rendering = false
  }
}
