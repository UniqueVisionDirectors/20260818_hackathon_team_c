<template>
  <aside
    class="evacuation-panel"
    aria-labelledby="evacuation-controls-title"
  >
    <p class="eyebrow">
      TYPESCRIPT PATHFINDER
    </p>
    <h2 id="evacuation-controls-title">
      避難シミュレーション
    </h2>
    <p class="description">
      経路を計算し、3D空間上で避難者の移動を確認します。
    </p>

    <label class="field">
      <span>シナリオ</span>
      <select
        :value="scenarioId"
        :disabled="controlsLocked"
        @change="handleScenarioChange"
      >
        <option
          v-for="option in SCENARIO_OPTIONS"
          :key="option.id"
          :value="option.id"
        >
          {{ option.label }}
        </option>
      </select>
    </label>

    <div class="actions">
      <button
        type="button"
        :disabled="controlsLocked"
        @click="emit('calculate')"
      >
        {{ status === 'calculating' ? '計算中…' : '経路を計算' }}
      </button>
      <button
        type="button"
        :disabled="!canStart"
        @click="emit('start')"
      >
        シミュレーション開始
      </button>
      <button
        type="button"
        @click="emit('reset')"
      >
        リセット
      </button>
    </div>

    <dl class="metrics">
      <div>
        <dt>状態</dt>
        <dd>{{ statusMessage }}</dd>
      </div>
      <div>
        <dt>経路</dt>
        <dd>{{ result?.found ? `${result.path.length} マス` : '—' }}</dd>
      </div>
      <div>
        <dt>推定時間</dt>
        <dd>{{ estimatedSeconds }}</dd>
      </div>
      <div>
        <dt>探索ノード</dt>
        <dd>{{ result ? result.visitedCount : '—' }}</dd>
      </div>
      <div>
        <dt>計算時間</dt>
        <dd>{{ elapsedTime }}</dd>
      </div>
    </dl>

    <div
      class="legend"
      aria-label="3Dマップの凡例"
    >
      <span><i class="legend__swatch legend__swatch--start" />スタート</span>
      <span><i class="legend__swatch legend__swatch--exit" />出口</span>
      <span><i class="legend__swatch legend__swatch--wall" />壁</span>
      <span><i class="legend__swatch legend__swatch--danger" />危険</span>
      <span><i class="legend__swatch legend__swatch--route" />経路</span>
    </div>

    <p
      v-if="errorMessage"
      class="error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SCENARIO_OPTIONS,
  type PathResult,
  type ScenarioId,
  type SimulationStatus,
} from '../types/evacuation.types'

const props = defineProps<{
  scenarioId: ScenarioId
  status: SimulationStatus
  statusMessage: string
  result: PathResult | null
  errorMessage: string
  rendererUnavailable: boolean
}>()

const emit = defineEmits<{
  calculate: []
  start: []
  reset: []
  changeScenario: [scenarioId: ScenarioId]
}>()

const controlsLocked = computed(() =>
  props.rendererUnavailable
  || props.status === 'calculating'
  || props.status === 'running',
)
const canStart = computed(() =>
  Boolean(props.result?.found)
  && !props.rendererUnavailable
  && (props.status === 'ready' || props.status === 'completed'),
)
const estimatedSeconds = computed(() => props.result?.found
  ? `${(Math.max(0, props.result.path.length - 1) / 2).toFixed(1)} 秒`
  : '—')
const elapsedTime = computed(() => props.result
  ? `${props.result.elapsedMs.toFixed(2)} ms`
  : '—')

const handleScenarioChange = (event: Event): void => {
  const value = (event.target as HTMLSelectElement).value

  if (value === 'normal' || value === 'fire') {
    emit('changeScenario', value)
  }
}
</script>

<style scoped>
.evacuation-panel {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #24445e;
  border-radius: 1rem;
  color: #eaf6ff;
  background: #071526;
}

.evacuation-panel h2,
.evacuation-panel p {
  margin: 0;
}

.eyebrow {
  color: #52d5ff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.description {
  color: #9db3c8;
  line-height: 1.6;
}

.field {
  display: grid;
  gap: 0.5rem;
  color: #bad2e8;
  font-weight: 700;
}

.field select {
  padding: 0.7rem;
  border: 1px solid #315473;
  border-radius: 0.5rem;
  color: #f4fbff;
  background: #0b2138;
}

.actions {
  display: grid;
  gap: 0.6rem;
}

.actions button {
  padding: 0.75rem 1rem;
  border: 1px solid #315473;
  border-radius: 0.5rem;
  color: #eaf6ff;
  background: #102c49;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.actions button:first-child {
  color: #03101e;
  background: #58d7ff;
}

.actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.metrics {
  display: grid;
  gap: 0.6rem;
  margin: 0;
}

.metrics div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid #18344c;
}

.metrics dt {
  color: #86a1bb;
}

.metrics dd {
  margin: 0;
  text-align: right;
  font-weight: 700;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 0.8rem;
  color: #bad2e8;
  font-size: 0.78rem;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.legend__swatch {
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 0.18rem;
  background: #fff;
}

.legend__swatch--start {
  background: #0d61eb;
}

.legend__swatch--exit {
  background: #0db342;
}

.legend__swatch--wall {
  background: #2e333a;
}

.legend__swatch--danger {
  background: #e03314;
}

.legend__swatch--route {
  background: #ffc705;
}

.error {
  padding: 0.8rem;
  border: 1px solid #8d3a48;
  border-radius: 0.5rem;
  color: #ffd5d9;
  background: #3a1420;
}
</style>
