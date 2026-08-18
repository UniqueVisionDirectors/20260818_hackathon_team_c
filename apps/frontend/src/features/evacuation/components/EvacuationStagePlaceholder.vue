<template>
  <section
    class="evacuation-stage-placeholder"
    aria-label="3D描画領域の仮表示"
  >
    <div
      class="evacuation-stage-placeholder__grid"
      aria-hidden="true"
    >
      <span
        v-for="index in 48"
        :key="index"
      />
    </div>
    <div class="evacuation-stage-placeholder__message">
      <p>3D SCENE CONTRACT READY</p>
      <strong>{{ result?.found ? '経路計算結果を受け取りました' : '3D担当のCanvas統合待ち' }}</strong>
      <small>最終統合時に EvacuationCanvas.vue へ差し替えます。</small>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import type { PathResult } from '../types/evacuation.types'

defineProps<{ result: PathResult | null }>()

let completionTimer: number | null = null

const startAnimation = (onCompleted: () => void): void => {
  if (completionTimer !== null) {
    window.clearTimeout(completionTimer)
  }
  completionTimer = window.setTimeout(() => {
    completionTimer = null
    onCompleted()
  }, 700)
}

const reset = (): void => {
  if (completionTimer !== null) {
    window.clearTimeout(completionTimer)
    completionTimer = null
  }
}

onUnmounted(reset)
defineExpose({ startAnimation, reset })
</script>

<style scoped>
.evacuation-stage-placeholder {
  position: relative;
  min-height: 34rem;
  overflow: hidden;
  border: 1px solid rgba(137, 196, 255, 0.18);
  border-radius: 1.25rem;
  background: radial-gradient(circle at 50% 15%, #12375c, #040c18 68%);
}

.evacuation-stage-placeholder__grid {
  position: absolute;
  inset: 12% 8%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  transform: perspective(35rem) rotateX(58deg);
  transform-origin: center bottom;
}

.evacuation-stage-placeholder__grid span {
  aspect-ratio: 1;
  border: 1px solid rgba(82, 213, 255, 0.18);
  background: rgba(6, 26, 48, 0.62);
}

.evacuation-stage-placeholder__message {
  position: absolute;
  inset: auto 1.25rem 1.25rem;
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
  border: 1px solid rgba(137, 196, 255, 0.2);
  border-radius: 0.8rem;
  color: #e7f6ff;
  background: rgba(3, 12, 24, 0.78);
  backdrop-filter: blur(0.7rem);
}

.evacuation-stage-placeholder__message p,
.evacuation-stage-placeholder__message strong,
.evacuation-stage-placeholder__message small {
  margin: 0;
}

.evacuation-stage-placeholder__message p {
  color: #52d5ff;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.evacuation-stage-placeholder__message small {
  color: #8fa8bf;
}
</style>
