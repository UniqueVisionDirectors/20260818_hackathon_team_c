<template>
  <main class="evacuation-page">
    <header class="page-header">
      <div><p>3D EVACUATION SIMULATOR</p><h1>安全な避難経路を見つける。</h1></div>
      <RouterLink to="/dashboard">既存アプリへ戻る</RouterLink>
    </header>

    <section class="layout">
      <!-- B担当のEvacuationCanvas.vue統合時に差し替える。 -->
      <EvacuationStagePlaceholder ref="stageRef" :result="result" />
      <EvacuationPanel
        :scenario-id="scenarioId"
        :status="status"
        :status-message="statusMessage"
        :result="result"
        :error-message="errorMessage"
        @calculate="handleCalculate"
        @start="handleStart"
        @reset="handleReset"
        @change-scenario="handleScenarioChange"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import EvacuationPanel from '../components/EvacuationPanel.vue'
import EvacuationStagePlaceholder from '../components/EvacuationStagePlaceholder.vue'
import type { PathResult, ScenarioId, SimulationStatus } from '../types/evacuation.types'

const scenarioId = ref<ScenarioId>('normal')
const status = ref<SimulationStatus>('idle')
const result = ref<PathResult | null>(null)
const errorMessage = ref('')
const stageRef = ref<InstanceType<typeof EvacuationStagePlaceholder> | null>(null)

const statusMessages: Record<SimulationStatus, string> = {
  idle: '経路を計算できます',
  calculating: '経路を計算しています',
  ready: '安全な経路を表示できます',
  running: '避難シミュレーション中',
  completed: '避難完了',
  error: '経路を計算できませんでした',
}
const statusMessage = computed(() => statusMessages[status.value])

const resetSimulation = (): void => {
  stageRef.value?.reset()
  result.value = null
  errorMessage.value = ''
  status.value = 'idle'
}

const handleScenarioChange = (nextScenarioId: ScenarioId): void => {
  scenarioId.value = nextScenarioId
  resetSimulation()
}

const handleCalculate = (): void => {
  // A担当のfindPath(map)を統合する箇所。契約だけ先に固定している。
  status.value = 'idle'
  errorMessage.value = '経路探索モジュールの統合待ちです。'
}

const handleStart = (): void => {
  if (!result.value?.found || !stageRef.value) return
  status.value = 'running'
  stageRef.value.startAnimation(() => { status.value = 'completed' })
}

const handleReset = (): void => resetSimulation()
</script>

<style scoped>
.evacuation-page { min-height: 100vh; padding: clamp(1rem, 3vw, 2.5rem); color: #eaf6ff; background: #030b16; }
.page-header, .layout { width: min(88rem, 100%); margin: 0 auto; }
.page-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.page-header p, .page-header h1 { margin: 0; }
.page-header p { color: #52d5ff; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.page-header h1 { margin-top: .35rem; font-size: clamp(1.65rem, 4vw, 3.2rem); }
.page-header a { color: #a8c9e6; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem); gap: 1.25rem; }
@media (max-width: 900px) { .page-header { align-items: start; flex-direction: column; } .layout { grid-template-columns: 1fr; } }
</style>
