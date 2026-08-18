<template>
  <aside class="evacuation-panel" aria-labelledby="evacuation-controls-title">
    <p class="eyebrow">TYPESCRIPT PATHFINDER</p>
    <h2 id="evacuation-controls-title">避難シミュレーション</h2>
    <p class="description">経路を計算し、3D空間上で避難者の移動を確認します。</p>

    <label class="field">
      <span>シナリオ</span>
      <select :value="scenarioId" :disabled="controlsLocked" @change="handleScenarioChange">
        <option v-for="option in SCENARIO_OPTIONS" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="actions">
      <button type="button" :disabled="controlsLocked" @click="emit('calculate')">
        {{ status === 'calculating' ? '計算中…' : '経路を計算' }}
      </button>
      <button type="button" :disabled="!result?.found || controlsLocked" @click="emit('start')">
        シミュレーション開始
      </button>
      <button type="button" :disabled="status === 'calculating'" @click="emit('reset')">
        リセット
      </button>
    </div>

    <dl class="metrics">
      <div><dt>状態</dt><dd>{{ statusMessage }}</dd></div>
      <div><dt>経路</dt><dd>{{ result?.found ? `${result.path.length} マス` : '—' }}</dd></div>
      <div><dt>探索ノード</dt><dd>{{ result ? result.visitedCount : '—' }}</dd></div>
      <div><dt>計算時間</dt><dd>{{ result ? `${result.elapsedMs} ms` : '—' }}</dd></div>
    </dl>

    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SCENARIO_OPTIONS, type PathResult, type ScenarioId, type SimulationStatus } from '../types/evacuation.types'

const props = defineProps<{
  scenarioId: ScenarioId
  status: SimulationStatus
  statusMessage: string
  result: PathResult | null
  errorMessage: string
}>()

const emit = defineEmits<{
  calculate: []
  start: []
  reset: []
  changeScenario: [scenarioId: ScenarioId]
}>()

const controlsLocked = computed(() => props.status === 'calculating' || props.status === 'running')

const handleScenarioChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'normal' || value === 'fire') emit('changeScenario', value)
}
</script>

<style scoped>
.evacuation-panel { display: grid; gap: 1rem; align-content: start; padding: 1.5rem; border: 1px solid #24445e; border-radius: 1rem; color: #eaf6ff; background: #071526; }
.evacuation-panel h2, .evacuation-panel p { margin: 0; }
.eyebrow { color: #52d5ff; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.description { color: #9db3c8; line-height: 1.6; }
.field { display: grid; gap: .5rem; color: #bad2e8; font-weight: 700; }
.field select { padding: .7rem; border: 1px solid #315473; border-radius: .5rem; color: #f4fbff; background: #0b2138; }
.actions { display: grid; gap: .6rem; }
.actions button { padding: .75rem 1rem; border: 1px solid #315473; border-radius: .5rem; color: #eaf6ff; background: #102c49; font: inherit; font-weight: 700; cursor: pointer; }
.actions button:first-child { color: #03101e; background: #58d7ff; }
.actions button:disabled { cursor: not-allowed; opacity: .45; }
.metrics { display: grid; gap: .6rem; margin: 0; }
.metrics div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #18344c; padding-bottom: .45rem; }
.metrics dt { color: #86a1bb; }
.metrics dd { margin: 0; text-align: right; font-weight: 700; }
.error { padding: .8rem; border: 1px solid #8d3a48; border-radius: .5rem; color: #ffd5d9; background: #3a1420; }
</style>
