import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { Scene } from '@babylonjs/core/scene'

export interface EvacuationSceneContext {
  scene: Scene
  camera: ArcRotateCamera
}

export const createEvacuationScene = (
  engine: AbstractEngine,
  canvas: HTMLCanvasElement,
): EvacuationSceneContext => {
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.79, 0.84, 0.88, 1)

  const camera = new ArcRotateCamera(
    'evacuation-camera',
    -Math.PI / 2,
    Math.PI / 3.2,
    12,
    Vector3.Zero(),
    scene,
  )
  camera.lowerBetaLimit = Math.PI / 6
  camera.upperBetaLimit = Math.PI / 2.15
  camera.lowerRadiusLimit = 4
  camera.upperRadiusLimit = 40
  camera.wheelDeltaPercentage = 0.01
  camera.panningSensibility = 0
  camera.attachControl(canvas, true)

  const ambientLight = new HemisphericLight(
    'evacuation-ambient-light',
    new Vector3(0, 1, 0),
    scene,
  )
  ambientLight.intensity = 0.82
  ambientLight.groundColor = new Color3(0.3, 0.34, 0.38)

  const keyLight = new DirectionalLight(
    'evacuation-key-light',
    new Vector3(-0.7, -1, 0.4),
    scene,
  )
  keyLight.position = new Vector3(6, 12, -8)
  keyLight.intensity = 1.1

  return { scene, camera }
}

export const frameEvacuationMap = (
  camera: ArcRotateCamera,
  width: number,
  height: number,
): void => {
  const longestSide = Math.max(width, height)
  const radius = Math.max(7, longestSide * 1.12)

  camera.setTarget(Vector3.Zero())
  camera.radius = radius
  camera.lowerRadiusLimit = Math.max(3, longestSide * 0.48)
  camera.upperRadiusLimit = Math.max(20, longestSide * 2.8)
}
