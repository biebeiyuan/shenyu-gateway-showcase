<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow, useVueFlow, type NodeMouseEvent } from '@vue-flow/core'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  CircleHelp,
  Eye,
  ExternalLink,
  Gauge,
  Heart,
  Info,
  MessageCircle,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from '@lucide/vue'
import GatewayNode from './components/GatewayNode.vue'
import { gatewayEdges, gatewayNodes, scenarios } from './data/gateway'
import type { GatewayNodeDetails, ScenarioStep, ViewMode } from './types'

const currentScenarioId = ref(scenarios[0].id)
const currentStepIndex = ref(-1)
const selectedNodeId = ref('client')
const isPlaying = ref(false)
const viewMode = ref<ViewMode>('experience')
const playbackSpeed = ref<1 | 2>(1)
let timer: ReturnType<typeof setTimeout> | null = null

const MessagePreview = defineComponent({
  name: 'MessagePreview',
  props: { message: { type: String, required: true } },
  setup(props) {
    return () =>
      h('div', { class: 'message-preview' }, [
        h(MessageCircle, { size: 16, 'aria-hidden': true }),
        h('span', props.message),
      ])
  },
})

const { fitView, setCenter } = useVueFlow()

const currentScenario = computed(
  () => scenarios.find((scenario) => scenario.id === currentScenarioId.value) ?? scenarios[0],
)

const currentStep = computed<ScenarioStep | null>(() => {
  if (currentStepIndex.value < 0) return null
  return currentScenario.value.steps[currentStepIndex.value] ?? null
})

const visitedNodeIds = computed(() =>
  currentScenario.value.steps.slice(0, currentStepIndex.value + 1).map((step) => step.nodeId),
)

const nodes = computed(() =>
  gatewayNodes.map((node) => {
    const visitIndex = visitedNodeIds.value.lastIndexOf(node.id)
    const active = currentStep.value?.nodeId === node.id
    const skipped =
      !active &&
      currentStepIndex.value >= 0 &&
      currentScenario.value.skippedNodeIds.includes(node.id)

    return {
      ...node,
      selected: selectedNodeId.value === node.id,
      data: {
        ...node.data,
        status: active ? 'active' : visitIndex >= 0 ? 'complete' : skipped ? 'skipped' : 'idle',
        stepNumber: visitIndex >= 0 ? visitIndex + 1 : undefined,
      },
    }
  }),
)

const edges = computed(() => {
  const visited = new Set(visitedNodeIds.value)
  return gatewayEdges.map((edge) => {
    const reached = visited.has(edge.source) && visited.has(edge.target)
    const active = currentStep.value?.nodeId === edge.target
    return {
      ...edge,
      animated: active,
      class: active ? 'edge-active' : reached ? 'edge-complete' : 'edge-idle',
    }
  })
})

const selectedNode = computed(() =>
  gatewayNodes.find((node) => node.id === selectedNodeId.value),
)

const selectedDetails = computed<GatewayNodeDetails>(() =>
  selectedNode.value?.data ?? gatewayNodes[0]!.data!,
)

const selectedStep = computed(() => {
  if (currentStep.value?.nodeId === selectedNodeId.value) return currentStep.value
  const steps = currentScenario.value.steps.slice(0, currentStepIndex.value + 1)
  return [...steps].reverse().find((step) => step.nodeId === selectedNodeId.value) ?? null
})

const progress = computed(() => {
  if (currentStepIndex.value < 0) return 0
  return ((currentStepIndex.value + 1) / currentScenario.value.steps.length) * 100
})

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}

function focusNode(nodeId: string, duration = 420) {
  const node = gatewayNodes.find((item) => item.id === nodeId)
  if (!node) return

  nextTick(() => {
    setCenter(node.position.x + 95, node.position.y + 39, { zoom: 0.85, duration })
  })
}

function scheduleNextStep() {
  clearTimer()
  if (!isPlaying.value) return

  timer = setTimeout(() => {
    if (currentStepIndex.value >= currentScenario.value.steps.length - 1) {
      isPlaying.value = false
      return
    }
    currentStepIndex.value += 1
    selectedNodeId.value = currentScenario.value.steps[currentStepIndex.value].nodeId
    focusNode(selectedNodeId.value)
    scheduleNextStep()
  }, playbackSpeed.value === 2 ? 650 : 1150)
}

function togglePlayback() {
  if (currentStepIndex.value >= currentScenario.value.steps.length - 1) {
    currentStepIndex.value = -1
  }
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (currentStepIndex.value < 0) {
      currentStepIndex.value = 0
      selectedNodeId.value = currentScenario.value.steps[0].nodeId
      focusNode(selectedNodeId.value)
    }
    scheduleNextStep()
  } else {
    clearTimer()
  }
}

function moveStep(direction: -1 | 1) {
  isPlaying.value = false
  clearTimer()
  const next = Math.min(
    currentScenario.value.steps.length - 1,
    Math.max(-1, currentStepIndex.value + direction),
  )
  currentStepIndex.value = next
  selectedNodeId.value = next >= 0 ? currentScenario.value.steps[next].nodeId : 'client'
  if (next >= 0) focusNode(selectedNodeId.value)
}

function jumpToStep(index: number) {
  isPlaying.value = false
  clearTimer()
  currentStepIndex.value = index
  selectedNodeId.value = currentScenario.value.steps[index].nodeId
  focusNode(selectedNodeId.value)
}

function resetScenario() {
  isPlaying.value = false
  clearTimer()
  currentStepIndex.value = -1
  selectedNodeId.value = 'client'
  nextTick(() => fitView({ padding: 0.18, duration: 450 }))
}

function selectScenario(id: string) {
  currentScenarioId.value = id
  resetScenario()
}

function onNodeClick(event: NodeMouseEvent) {
  selectedNodeId.value = event.node.id
}

watch(playbackSpeed, () => {
  if (isPlaying.value) scheduleNextStep()
})

onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="showcase-shell">
    <header class="topbar">
      <div class="brand-block">
        <span class="brand-mark" aria-hidden="true"><Sparkles :size="20" /></span>
        <div>
          <div class="brand-line">
            <strong>Shenyu Gateway</strong>
            <span>交互逻辑地图</span>
          </div>
          <p>长期 AI 交互系统 · 脱敏前端展示</p>
        </div>
      </div>

      <div class="privacy-strip" aria-label="演示数据说明">
        <span><ShieldCheck :size="15" /> 全合成数据</span>
        <span><WifiOff :size="15" /> 无 API</span>
        <a href="https://github.com/biebeiyuan" target="_blank" rel="noreferrer">
          <ExternalLink :size="15" /> GitHub
        </a>
      </div>
    </header>

    <section class="scenario-band" aria-label="演示场景">
      <div class="scenario-intro">
        <span class="eyebrow">选择一条请求</span>
        <strong>{{ currentScenario.name }}</strong>
        <p>{{ currentScenario.summary }}</p>
      </div>

      <div class="scenario-tabs" role="tablist" aria-label="请求场景">
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          type="button"
          role="tab"
          :aria-selected="scenario.id === currentScenario.id"
          :class="{ active: scenario.id === currentScenario.id }"
          @click="selectScenario(scenario.id)"
        >
          {{ scenario.shortName }}
        </button>
      </div>

      <div class="scenario-message">
        <MessagePreview :message="currentScenario.userMessage" />
      </div>
    </section>

    <main class="workbench">
      <section class="map-panel" aria-label="网关流程地图">
        <div class="map-toolbar">
          <div class="playback-controls">
            <button
              class="primary-command"
              type="button"
              :aria-label="isPlaying ? '暂停流程' : '播放流程'"
              @click="togglePlayback"
            >
              <Pause v-if="isPlaying" :size="17" />
              <Play v-else :size="17" fill="currentColor" />
              {{ isPlaying ? '暂停' : currentStepIndex < 0 ? '运行请求' : '继续' }}
            </button>
            <button
              class="icon-button"
              type="button"
              aria-label="上一步"
              data-tooltip="上一步"
              :disabled="currentStepIndex < 0"
              @click="moveStep(-1)"
            >
              <ArrowLeft :size="17" />
            </button>
            <button
              class="icon-button"
              type="button"
              aria-label="下一步"
              data-tooltip="下一步"
              :disabled="currentStepIndex >= currentScenario.steps.length - 1"
              @click="moveStep(1)"
            >
              <ArrowRight :size="17" />
            </button>
            <button
              class="icon-button"
              type="button"
              aria-label="重置流程"
              data-tooltip="重置"
              @click="resetScenario"
            >
              <RefreshCcw :size="16" />
            </button>
            <button
              class="speed-control"
              type="button"
              :aria-label="`播放速度 ${playbackSpeed} 倍`"
              @click="playbackSpeed = playbackSpeed === 1 ? 2 : 1"
            >
              <Gauge :size="16" /> {{ playbackSpeed }}x
            </button>
          </div>

          <div class="map-status">
            <span>{{ currentStepIndex < 0 ? '等待运行' : `第 ${currentStepIndex + 1} / ${currentScenario.steps.length} 步` }}</span>
            <div class="progress-track" aria-hidden="true">
              <span :style="{ width: `${progress}%` }" />
            </div>
          </div>
        </div>

        <div class="flow-stage">
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :min-zoom="0.35"
            :max-zoom="1.6"
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="true"
            fit-view-on-init
            :fit-view-on-init-options="{ padding: 0.18 }"
            @node-click="onNodeClick"
          >
            <Background pattern-color="#ead9df" :gap="22" :size="1.2" />
            <Controls position="bottom-left" :show-interactive="false" />
            <template #node-gateway="nodeProps">
              <GatewayNode v-bind="nodeProps" />
            </template>
          </VueFlow>

          <div class="map-legend" aria-label="地图状态图例">
            <span><i class="legend-dot active" />正在处理</span>
            <span><i class="legend-dot complete" />已经完成</span>
            <span><i class="legend-dot skipped" />本场景跳过</span>
          </div>
        </div>
      </section>

      <aside class="inspector" aria-label="节点说明">
        <div class="mode-switch" role="group" aria-label="说明视角">
          <button
            type="button"
            :class="{ active: viewMode === 'experience' }"
            @click="viewMode = 'experience'"
          >
            <Eye :size="15" /> 体验视角
          </button>
          <button
            type="button"
            :class="{ active: viewMode === 'system' }"
            @click="viewMode = 'system'"
          >
            <Braces :size="15" /> 系统视角
          </button>
        </div>

        <div class="inspector-heading">
          <span>{{ selectedDetails.zone }}</span>
          <h2>{{ selectedDetails.label }}</h2>
          <p>{{ selectedDetails.subtitle }}</p>
        </div>

        <div v-if="selectedStep" class="current-event" :class="`tone-${selectedStep.tone}`">
          <span>本场景发生</span>
          <strong>{{ selectedStep.title }}</strong>
          <p>{{ selectedStep.detail }}</p>
          <div><Check :size="15" /> {{ selectedStep.result }}</div>
        </div>

        <div v-if="viewMode === 'experience'" class="detail-sections">
          <section>
            <span class="section-label"><CircleHelp :size="15" /> 用户问题</span>
            <p>{{ selectedDetails.experienceQuestion }}</p>
          </section>
          <section>
            <span class="section-label"><Heart :size="15" /> 产品判断</span>
            <p>{{ selectedDetails.productDecision }}</p>
          </section>
          <section>
            <span class="section-label"><ShieldCheck :size="15" /> 不可破坏的边界</span>
            <p>{{ selectedDetails.boundary }}</p>
          </section>
        </div>

        <div v-else class="detail-sections">
          <section>
            <span class="section-label"><ArrowRight :size="15" /> 输入</span>
            <p>{{ selectedDetails.systemInput }}</p>
          </section>
          <section>
            <span class="section-label"><Activity :size="15" /> 输出</span>
            <p>{{ selectedDetails.systemOutput }}</p>
          </section>
          <section>
            <span class="section-label"><Info :size="15" /> 验证证据</span>
            <p>{{ selectedDetails.evidence }}</p>
          </section>
        </div>
      </aside>
    </main>

    <section class="timeline-band" aria-label="请求时间线">
      <div class="timeline-title">
        <span class="eyebrow">本轮时间线</span>
        <strong>{{ currentScenario.outcome }}</strong>
      </div>
      <div class="timeline-scroll">
        <button
          v-for="(step, index) in currentScenario.steps"
          :key="`${step.nodeId}-${index}`"
          type="button"
          :class="{
            active: index === currentStepIndex,
            complete: index < currentStepIndex,
          }"
          @click="jumpToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.title }}</strong>
        </button>
      </div>
    </section>

    <section class="case-notes" aria-label="项目说明">
      <div>
        <span class="note-icon rose"><Heart :size="17" /></span>
        <strong>从真实体验出发</strong>
        <p>先定义“用户应该感受到什么”，再把遗忘、工具续接和错误解释拆成可验证行为。</p>
      </div>
      <div>
        <span class="note-icon sage"><ShieldCheck :size="17" /></span>
        <strong>展示逻辑，不展示隐私</strong>
        <p>页面只编码已确认的产品规则；示例、日志和记忆全部为合成内容，不连接真实系统。</p>
      </div>
      <div>
        <span class="note-icon amber"><Sparkles :size="17" /></span>
        <strong>AI Coding 协作作品</strong>
        <p>由产品行为、验收边界和项目地图驱动实现，前端本身也是一个可操作的高保真 Demo。</p>
      </div>
    </section>

    <footer class="footer-band">
      <div>
        <strong>Vue 3 · TypeScript · Vite · Vue Flow</strong>
        <span>纯前端静态演示，可部署到 Vercel / GitHub Pages</span>
      </div>
      <span class="footer-proof"><ShieldCheck :size="15" /> No API · No private data · No production code</span>
    </footer>
  </div>
</template>
