<template>
  <main class="preview-shell">
    <header class="preview-header">
      <div>
        <p class="preview-eyebrow">
          DEVELOPMENT PREVIEW
        </p>
        <h1>避難経路3D表示</h1>
        <p>
          統合前の描画確認用に、固定された12×8マップと仮経路を使用しています。
        </p>
      </div>

      <p
        class="preview-status"
        :class="`preview-status--${status}`"
        role="status"
        aria-live="polite"
      >
        {{ statusMessage }}
      </p>
    </header>

    <section class="preview-layout">
      <EvacuationCanvas
        ref="canvasRef"
        class="preview-canvas"
        @ready="handleReady"
        @error="handleError"
        @simulation-complete="handleSimulationComplete"
      />

      <aside
        class="preview-panel"
        aria-labelledby="preview-controls-title"
      >
        <div>
          <p class="preview-eyebrow">
            CONTROLS
          </p>
          <h2 id="preview-controls-title">
            表示確認
          </h2>
        </div>

        <dl class="preview-facts">
          <div>
            <dt>マップ</dt>
            <dd>12 × 8</dd>
          </div>
          <div>
            <dt>仮経路</dt>
            <dd>{{ previewPath.length }}マス</dd>
          </div>
        </dl>

        <div class="preview-actions">
          <button
            type="button"
            :disabled="!isReady || status === 'running'"
            @click="handleRenderPath"
          >
            経路を表示
          </button>
          <button
            type="button"
            class="preview-button--primary"
            :disabled="!isReady || !pathVisible || status === 'running'"
            @click="handleStart"
          >
            シミュレーション開始
          </button>
          <button
            type="button"
            :disabled="!isReady"
            @click="handleReset"
          >
            リセット
          </button>
        </div>

        <ul
          class="preview-legend"
          aria-label="凡例"
        >
          <li><span class="preview-swatch preview-swatch--start" />スタート</li>
          <li><span class="preview-swatch preview-swatch--exit" />出口</li>
          <li><span class="preview-swatch preview-swatch--danger" />危険マス</li>
          <li><span class="preview-swatch preview-swatch--route" />仮経路</li>
        </ul>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import EvacuationCanvas from '../components/EvacuationCanvas.vue'
import type {
  GridPoint,
  MapDefinition,
  SimulationStatus,
} from '../types/evacuation.types'
import { previewMap, previewPath } from './previewData'

type PreviewStatus = SimulationStatus | 'initializing'

interface EvacuationCanvasApi {
  renderMap(map: MapDefinition): void
  renderPath(path: readonly GridPoint[]): void
  startSimulation(path: readonly GridPoint[]): void
  reset(): void
}

const canvasRef = useTemplateRef<EvacuationCanvasApi>('canvasRef')
const status = ref<PreviewStatus>('initializing')
const pathVisible = ref(false)
const isReady = computed(() => status.value !== 'initializing' && status.value !== 'error')

const statusMessage = computed(() => {
  switch (status.value) {
    case 'initializing':
      return '3Dマップを準備しています…'
    case 'idle':
      return '経路を表示してください。'
    case 'calculating':
      return '経路を計算しています…'
    case 'ready':
      return '仮経路を表示しました。'
    case 'running':
      return '避難者が移動しています…'
    case 'completed':
      return '出口までの移動が完了しました。'
    case 'error':
      return '3D表示の初期化に失敗しました。'
  }
})

const handleReady = (): void => {
  canvasRef.value?.renderMap(previewMap)
  status.value = 'idle'
}

const handleError = (): void => {
  status.value = 'error'
}

const handleRenderPath = (): void => {
  canvasRef.value?.renderPath(previewPath)
  pathVisible.value = true
  status.value = 'ready'
}

const handleStart = (): void => {
  status.value = 'running'
  canvasRef.value?.startSimulation(previewPath)
}

const handleSimulationComplete = (): void => {
  status.value = 'completed'
}

const handleReset = (): void => {
  canvasRef.value?.reset()
  pathVisible.value = false
  status.value = 'idle'
}
</script>

<style scoped>
.preview-shell {
  width: min(92rem, 100%);
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 3rem);
}

.preview-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.preview-header h1,
.preview-panel h2,
.preview-header p {
  margin: 0;
}

.preview-header h1 {
  margin-bottom: 0.5rem;
  color: #12283a;
  font-size: clamp(2rem, 5vw, 3.75rem);
  line-height: 1;
}

.preview-header > div > p:last-child {
  max-width: 42rem;
  color: #526779;
}

.preview-eyebrow {
  margin: 0 0 0.5rem;
  color: #0969da;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}

.preview-status {
  flex: 0 0 auto;
  margin: 0;
  padding: 0.65rem 0.9rem;
  border: 1px solid #b7c7d4;
  border-radius: 999px;
  color: #28445b;
  background: #f7fafc;
  font-size: 0.85rem;
  font-weight: 700;
}

.preview-status--completed {
  border-color: #69a978;
  color: #175c2b;
  background: #eaf8ee;
}

.preview-status--error {
  border-color: #d67b82;
  color: #8f1320;
  background: #fff0f1;
}

.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(15rem, 20rem);
  gap: 1.5rem;
  align-items: start;
}

.preview-canvas {
  min-width: 0;
}

.preview-panel {
  display: grid;
  gap: 1.4rem;
  padding: 1.35rem;
  border: 1px solid #c7d0d8;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 1rem 2.5rem rgb(24 39 52 / 10%);
}

.preview-panel h2 {
  color: #18324a;
  font-size: 1.35rem;
}

.preview-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 0;
}

.preview-facts div {
  padding: 0.8rem;
  border-radius: 0.7rem;
  background: #f0f4f7;
}

.preview-facts dt {
  color: #667d90;
  font-size: 0.75rem;
}

.preview-facts dd {
  margin: 0.2rem 0 0;
  color: #18324a;
  font-weight: 800;
}

.preview-actions {
  display: grid;
  gap: 0.65rem;
}

.preview-actions button {
  min-height: 2.8rem;
  border: 1px solid #9eafbd;
  border-radius: 0.65rem;
  color: #18324a;
  background: #fff;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}

.preview-actions button:hover:not(:disabled) {
  border-color: #0969da;
}

.preview-actions button:focus-visible {
  outline: 3px solid rgb(9 105 218 / 35%);
  outline-offset: 2px;
}

.preview-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.preview-actions .preview-button--primary {
  border-color: #0969da;
  color: #fff;
  background: #0969da;
}

.preview-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  color: #526779;
  font-size: 0.78rem;
  list-style: none;
}

.preview-legend li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.preview-swatch {
  width: 0.7rem;
  height: 0.7rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #778794;
}

.preview-swatch--start {
  background: #0969da;
}

.preview-swatch--exit {
  background: #20a446;
}

.preview-swatch--danger {
  background: #df3e19;
}

.preview-swatch--route {
  background: #f2bd05;
}

@media (max-width: 820px) {
  .preview-header {
    display: grid;
  }

  .preview-layout {
    grid-template-columns: 1fr;
  }
}
</style>
