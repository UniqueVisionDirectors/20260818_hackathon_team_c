<template>
  <figure class="evacuation-canvas">
    <div class="evacuation-canvas__viewport">
      <canvas
        ref="canvasRef"
        class="evacuation-canvas__surface"
        tabindex="0"
        aria-label="避難経路の3Dマップ。ドラッグで回転し、ホイールで拡大縮小できます。"
      >
        このブラウザは Canvas に対応していません。
      </canvas>

      <div
        v-if="status !== 'ready'"
        class="evacuation-canvas__overlay"
        :class="{ 'evacuation-canvas__overlay--error': status === 'error' }"
        :role="status === 'error' ? 'alert' : 'status'"
      >
        <span
          class="evacuation-canvas__status-mark"
          aria-hidden="true"
        />
        <span>{{ statusMessage }}</span>
      </div>
    </div>

    <figcaption class="evacuation-canvas__caption">
      <span>{{ engineLabel }}</span>
      <span>ドラッグ: 回転</span>
      <span>ホイール: ズーム</span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import type { EvacuationRenderer } from '../renderer/EvacuationRenderer'
import type { GridPoint, MapDefinition } from '../types/evacuation.types'
import type { RendererInfo } from '@/renderer/types'

type CanvasStatus = 'idle' | 'initializing' | 'ready' | 'error'

const emit = defineEmits<{
  ready: [info: RendererInfo]
  error: [error: Error]
  simulationComplete: []
}>()

const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
const rendererRef = shallowRef<EvacuationRenderer | null>(null)
const status = ref<CanvasStatus>('idle')
const rendererInfo = shallowRef<RendererInfo | null>(null)
let resizeObserver: ResizeObserver | null = null
let pendingMap: MapDefinition | null = null
let pendingPath: readonly GridPoint[] | null = null
let pendingSimulationPath: readonly GridPoint[] | null = null
let unmounted = false

const requestedBackend = import.meta.env.VITE_BABYLON_RENDERER === 'webgpu'
  ? 'webgpu'
  : 'webgl'

const statusMessage = computed(() => status.value === 'error'
  ? '3Dマップを表示できませんでした。WebGLの利用可否を確認してください。'
  : '3Dマップを準備しています…')

const engineLabel = computed(() => {
  const info = rendererInfo.value

  if (!info) {
    return requestedBackend.toUpperCase()
  }

  if (info.fallbackReason) {
    return `${info.activeBackend.toUpperCase()}（WebGPUからフォールバック）`
  }

  return info.activeBackend.toUpperCase()
})

const renderMap = (map: MapDefinition): void => {
  pendingMap = map
  pendingPath = null
  pendingSimulationPath = null

  if (status.value === 'ready') {
    rendererRef.value?.renderMap(map)
  }
}

const renderPath = (path: readonly GridPoint[]): void => {
  pendingPath = path
  pendingSimulationPath = null

  if (status.value === 'ready') {
    rendererRef.value?.renderPath(path)
  }
}

const startSimulation = (path: readonly GridPoint[]): void => {
  pendingSimulationPath = path

  if (status.value === 'ready') {
    rendererRef.value?.startSimulation(path)
  }
}

const reset = (): void => {
  pendingPath = null
  pendingSimulationPath = null

  if (status.value === 'ready') {
    rendererRef.value?.reset()
  }
}

defineExpose({ renderMap, renderPath, startSimulation, reset })

const handleVisibilityChange = (): void => {
  rendererRef.value?.setSuspended(document.hidden)
}

const applyPendingState = (renderer: EvacuationRenderer): void => {
  if (pendingMap) {
    renderer.renderMap(pendingMap)
  }

  if (pendingPath) {
    renderer.renderPath(pendingPath)
  }

  if (pendingSimulationPath) {
    renderer.startSimulation(pendingSimulationPath)
  }
}

onMounted(async () => {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  status.value = 'initializing'
  let renderer: EvacuationRenderer | null = null

  try {
    const module = await import('../renderer/EvacuationRenderer')

    if (unmounted) {
      return
    }

    renderer = new module.EvacuationRenderer(canvas, {
      backend: requestedBackend,
      onSimulationCompleted: () => { emit('simulationComplete') },
    })
    rendererRef.value = renderer
    resizeObserver = new ResizeObserver(() => { renderer?.resize() })
    resizeObserver.observe(canvas)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const info = await renderer.initialize()

    if (rendererRef.value !== renderer) {
      return
    }

    rendererInfo.value = info
    applyPendingState(renderer)
    renderer.setSuspended(document.hidden)
    status.value = 'ready'
    emit('ready', info)
  } catch (cause) {
    if (unmounted) {
      return
    }

    const error = cause instanceof Error ? cause : new Error('Unknown renderer error')
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    resizeObserver?.disconnect()
    resizeObserver = null
    renderer?.dispose()
    rendererRef.value = null
    status.value = 'error'
    emit('error', error)
  }
})

onUnmounted(() => {
  unmounted = true
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  resizeObserver?.disconnect()
  resizeObserver = null
  rendererRef.value?.dispose()
  rendererRef.value = null
})
</script>

<style scoped>
.evacuation-canvas {
  display: grid;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid #c7d0d8;
  border-radius: 1rem;
  background: #c9d6df;
  box-shadow: 0 1.25rem 3rem rgb(24 39 52 / 18%);
}

.evacuation-canvas__viewport {
  position: relative;
  min-height: 30rem;
}

.evacuation-canvas__surface {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 30rem;
  outline: none;
  touch-action: none;
}

.evacuation-canvas__surface:focus-visible {
  box-shadow: inset 0 0 0 3px #0969da;
}

.evacuation-canvas__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #18324a;
  background: rgb(231 237 242 / 88%);
  text-align: center;
}

.evacuation-canvas__overlay--error {
  color: #8f1320;
}

.evacuation-canvas__status-mark {
  width: 0.75rem;
  height: 0.75rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #0969da;
  box-shadow: 0 0 1rem rgb(9 105 218 / 55%);
  animation: evacuation-pulse 1.2s ease-in-out infinite;
}

.evacuation-canvas__overlay--error .evacuation-canvas__status-mark {
  background: #cf222e;
  box-shadow: 0 0 1rem rgb(207 34 46 / 45%);
  animation: none;
}

.evacuation-canvas__caption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0.8rem 1rem;
  border-top: 1px solid #c7d0d8;
  color: #526779;
  background: #f4f7f9;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.evacuation-canvas__caption span:first-child {
  color: #0969da;
  font-weight: 700;
}

@keyframes evacuation-pulse {
  50% {
    opacity: 0.4;
    transform: scale(0.72);
  }
}

@media (max-width: 640px) {
  .evacuation-canvas__viewport,
  .evacuation-canvas__surface {
    min-height: 21rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .evacuation-canvas__status-mark {
    animation: none;
  }
}
</style>
