<template>
  <main class="evacuation-page">
    <header class="page-header">
      <div>
        <p>3D EVACUATION SIMULATOR</p>
        <h1>安全な避難経路を見つける。</h1>
      </div>
      <RouterLink to="/dashboard">
        既存アプリへ戻る
      </RouterLink>
    </header>

    <section class="layout">
      <EvacuationCanvas
        ref="canvasRef"
        @ready="handleCanvasReady"
        @error="handleCanvasError"
        @simulation-complete="handleSimulationComplete"
      />
      <EvacuationPanel
        :scenario-id="scenarioId"
        :status="status"
        :status-message="statusMessage"
        :result="result"
        :error-message="errorMessage"
        :renderer-unavailable="rendererUnavailable"
        @calculate="handleCalculate"
        @start="handleStart"
        @reset="handleReset"
        @change-scenario="handleScenarioChange"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import EvacuationCanvas from '../components/EvacuationCanvas.vue'
import EvacuationPanel from '../components/EvacuationPanel.vue'
import { DEMO_MAPS } from '../data/demoMaps'
import type {
  GridPoint,
  MapDefinition,
  PathResult,
  ScenarioId,
  SimulationStatus,
} from '../types/evacuation.types'
import { findPath } from '../utils/pathfinder'

interface EvacuationCanvasApi {
  renderMap(map: MapDefinition): void
  renderPath(path: readonly GridPoint[]): void
  startSimulation(path: readonly GridPoint[]): void
  reset(): void
}

const canvasRef = useTemplateRef<EvacuationCanvasApi>('canvasRef')
const scenarioId = ref<ScenarioId>('normal')
const status = ref<SimulationStatus>('idle')
const result = ref<PathResult | null>(null)
const errorMessage = ref('')
const rendererUnavailable = ref(false)
let calculationRevision = 0

const currentMap = computed(() => DEMO_MAPS[scenarioId.value])
const statusMessages: Record<SimulationStatus, string> = {
  idle: '経路を計算できます',
  calculating: '経路を計算しています',
  ready: '安全な経路を表示しました',
  running: '避難シミュレーション中',
  completed: '避難完了',
  error: '経路を計算できませんでした',
}
const statusMessage = computed(() => statusMessages[status.value])

const resetSimulation = (): void => {
  calculationRevision += 1
  canvasRef.value?.reset()
  result.value = null

  if (rendererUnavailable.value) {
    status.value = 'error'
    errorMessage.value = '3D表示を初期化できませんでした。WebGLの利用可否を確認してください。'
    return
  }

  errorMessage.value = ''
  status.value = 'idle'
}

const handleCanvasReady = (): void => {
  rendererUnavailable.value = false
}

const handleCanvasError = (): void => {
  calculationRevision += 1
  rendererUnavailable.value = true
  result.value = null
  status.value = 'error'
  errorMessage.value = '3D表示を初期化できませんでした。WebGLの利用可否を確認してください。'
}

const handleScenarioChange = (nextScenarioId: ScenarioId): void => {
  scenarioId.value = nextScenarioId
  resetSimulation()
  canvasRef.value?.renderMap(currentMap.value)
}

const handleCalculate = async (): Promise<void> => {
  if (
    rendererUnavailable.value
    || status.value === 'calculating'
    || status.value === 'running'
  ) {
    return
  }

  const revision = calculationRevision + 1
  calculationRevision = revision
  canvasRef.value?.reset()
  result.value = null
  errorMessage.value = ''
  status.value = 'calculating'

  await nextTick()

  if (calculationRevision !== revision) {
    return
  }

  const nextResult = findPath(currentMap.value)

  if (calculationRevision !== revision) {
    return
  }

  result.value = nextResult

  if (!nextResult.found) {
    status.value = 'error'
    errorMessage.value = nextResult.reason === 'INVALID_MAP'
      ? 'マップデータが不正です。設定内容を確認してください。'
      : '出口までの安全な経路が見つかりませんでした。'
    return
  }

  canvasRef.value?.renderPath(nextResult.path)
  status.value = 'ready'
}

const handleStart = (): void => {
  if (
    !result.value?.found
    || (status.value !== 'ready' && status.value !== 'completed')
  ) {
    return
  }

  status.value = 'running'
  canvasRef.value?.startSimulation(result.value.path)
}

const handleSimulationComplete = (): void => {
  if (status.value === 'running') {
    status.value = 'completed'
  }
}

const handleReset = (): void => {
  resetSimulation()
}

onMounted(() => {
  canvasRef.value?.renderMap(currentMap.value)
})
</script>

<style scoped>
.evacuation-page {
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2.5rem);
  color: #eaf6ff;
  background: #030b16;
}

.page-header,
.layout {
  width: min(88rem, 100%);
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header p,
.page-header h1 {
  margin: 0;
}

.page-header p {
  color: #52d5ff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.page-header h1 {
  margin-top: 0.35rem;
  font-size: clamp(1.65rem, 4vw, 3.2rem);
}

.page-header a {
  color: #a8c9e6;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
  gap: 1.25rem;
}

@media (max-width: 900px) {
  .page-header {
    align-items: start;
    flex-direction: column;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
