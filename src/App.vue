<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Braces,
  Bug,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDotDashed,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSearch,
  GitBranch,
  HardDrive,
  History,
  Layers3,
  ListChecks,
  MessageCircle,
  MonitorCheck,
  Network,
  Pause,
  Play,
  RefreshCcw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wrench,
  Zap,
} from '@lucide/vue'
import {
  collaborationCase,
  requestFlowNodes,
  requestVariants,
  toolScenarios,
} from './data/showcase'
import type { Actor, ChapterId, ViewMode } from './types'

const activeChapter = ref<ChapterId>('request')
const requestVariantId = ref(requestVariants[0].id)
const requestStepIndex = ref(0)
const requestPlaying = ref(false)
const requestViewMode = ref<ViewMode>('experience')
const toolScenarioId = ref('mixed')
const toolStepIndex = ref(0)
const toolPlaying = ref(false)
const toolViewMode = ref<ViewMode>('experience')
const collaborationStepIndex = ref(0)
let requestTimer: ReturnType<typeof setTimeout> | null = null
let toolTimer: ReturnType<typeof setTimeout> | null = null

const chapters = [
  { id: 'request' as const, number: '01', label: '一条消息怎样穿过网关', short: '完整请求', icon: Network },
  { id: 'tools' as const, number: '02', label: '模型要行动时，谁来执行', short: '工具协作', icon: Wrench },
  { id: 'debug' as const, number: '03', label: '我怎样与 Agent 一起完成工程工作', short: '协作方法', icon: MessageCircle },
]

const flowIcons = {
  ingress: MessageCircle,
  window: History,
  pending: GitBranch,
  fixed: Layers3,
  recall: Search,
  island: CircleDotDashed,
  assembly: Braces,
  model: Bot,
  response: Zap,
}

const actorLabels: Record<Actor, string> = {
  model: '上游模型',
  gateway: 'Gateway',
  client: 'Client',
  store: '记忆资料库',
}

const actorIcons = {
  model: Bot,
  gateway: Server,
  client: MonitorCheck,
  store: Database,
}

const currentRequest = computed(
  () => requestVariants.find((variant) => variant.id === requestVariantId.value) ?? requestVariants[0],
)
const currentRequestStep = computed(
  () => currentRequest.value.steps[requestStepIndex.value] ?? currentRequest.value.steps[0],
)
const requestProgress = computed(
  () => ((requestStepIndex.value + 1) / currentRequest.value.steps.length) * 100,
)
const currentRequestFlowNode = computed(
  () => requestFlowNodes.find((node) => node.id === currentRequestStep.value.flowNode) ?? requestFlowNodes[0],
)
const currentToolScenario = computed(
  () => toolScenarios.find((scenario) => scenario.id === toolScenarioId.value) ?? toolScenarios[2],
)
const currentToolEvent = computed(
  () => currentToolScenario.value.events[toolStepIndex.value] ?? currentToolScenario.value.events[0],
)
const currentCollaborationStep = computed(
  () => collaborationCase.steps[collaborationStepIndex.value] ?? collaborationCase.steps[0],
)
const collaborationTrail = computed(() => collaborationCase.steps.slice(0, collaborationStepIndex.value + 1))

const transcriptColumns = [
  {
    key: 'working' as const,
    eyebrow: '模型续接现场',
    title: '本轮工作副本',
    technical: 'working_messages',
    empty: '这一阶段还没有可续接的消息。',
  },
  {
    key: 'pending' as const,
    eyebrow: '跨请求暂存',
    title: '等待另一边完成',
    technical: 'pending_gateway_tool_turns',
    empty: '不需要跨请求保存隐藏现场。',
  },
  {
    key: 'clientVisible' as const,
    eyebrow: '客户端此刻看见',
    title: '只交付它负责的部分',
    technical: 'client-visible transcript',
    empty: '这一阶段没有内容需要交给客户端。',
  },
]

function clearRequestTimer() {
  if (requestTimer) clearTimeout(requestTimer)
  requestTimer = null
}

function clearToolTimer() {
  if (toolTimer) clearTimeout(toolTimer)
  toolTimer = null
}

function clearAllTimers() {
  clearRequestTimer()
  clearToolTimer()
}

function scheduleRequestStep() {
  clearRequestTimer()
  if (!requestPlaying.value) return
  requestTimer = setTimeout(() => {
    if (requestStepIndex.value >= currentRequest.value.steps.length - 1) {
      requestPlaying.value = false
      return
    }
    requestStepIndex.value += 1
    scheduleRequestStep()
  }, 1050)
}

function toggleRequestPlayback() {
  if (requestStepIndex.value >= currentRequest.value.steps.length - 1) {
    requestStepIndex.value = 0
  }
  requestPlaying.value = !requestPlaying.value
  if (requestPlaying.value) scheduleRequestStep()
  else clearRequestTimer()
}

function moveRequestStep(direction: -1 | 1) {
  requestPlaying.value = false
  clearRequestTimer()
  requestStepIndex.value = Math.min(
    currentRequest.value.steps.length - 1,
    Math.max(0, requestStepIndex.value + direction),
  )
}

function resetRequest() {
  requestPlaying.value = false
  clearRequestTimer()
  requestStepIndex.value = 0
}

function jumpToRequestStep(index: number) {
  requestPlaying.value = false
  clearRequestTimer()
  requestStepIndex.value = index
}

function scheduleToolStep() {
  clearToolTimer()
  if (!toolPlaying.value) return
  toolTimer = setTimeout(() => {
    if (toolStepIndex.value >= currentToolScenario.value.events.length - 1) {
      toolPlaying.value = false
      return
    }
    toolStepIndex.value += 1
    scheduleToolStep()
  }, 1150)
}

function toggleToolPlayback() {
  if (toolStepIndex.value >= currentToolScenario.value.events.length - 1) toolStepIndex.value = 0
  toolPlaying.value = !toolPlaying.value
  if (toolPlaying.value) scheduleToolStep()
  else clearToolTimer()
}

function jumpToToolStep(index: number) {
  toolPlaying.value = false
  clearToolTimer()
  toolStepIndex.value = index
}

function resetTool() {
  toolPlaying.value = false
  clearToolTimer()
  toolStepIndex.value = 0
}

function jumpToCollaborationStep(index: number) {
  collaborationStepIndex.value = index
}

function moveCollaborationStep(direction: -1 | 1) {
  collaborationStepIndex.value = Math.min(
    collaborationCase.steps.length - 1,
    Math.max(0, collaborationStepIndex.value + direction),
  )
}

function selectChapter(chapter: ChapterId) {
  activeChapter.value = chapter
  requestPlaying.value = false
  toolPlaying.value = false
  clearAllTimers()
}

watch(requestVariantId, resetRequest)
watch(toolScenarioId, resetTool)
onBeforeUnmount(clearAllTimers)
</script>

<template>
  <div class="showcase-shell">
    <header class="topbar">
      <div class="brand-block">
        <span class="brand-mark" aria-hidden="true"><Sparkles :size="19" /></span>
        <div>
          <div class="brand-line">
            <strong>Shenyu Gateway</strong>
            <span>Vibe Coding Case Study</span>
          </div>
          <p>从长期真实使用中长出来的请求、工具与 Agent 协作实验</p>
        </div>
      </div>

      <div class="topbar-actions">
        <span class="data-badge"><ShieldCheck :size="14" /> 合成数据 · 无 API</span>
        <a class="icon-link" href="https://github.com/biebeiyuan" target="_blank" rel="noreferrer" aria-label="打开 GitHub" data-tooltip="GitHub">
          <ExternalLink :size="17" />
        </a>
      </div>
    </header>

    <section class="overview-band" aria-label="作品说明">
      <div class="overview-copy">
        <span class="eyebrow">这是什么</span>
        <h1>一个真实运行的长期记忆网关，和它背后的产品判断</h1>
        <p>
          长期使用 LLM 时，遗忘、上下文过载、角色漂移和工具链断裂会不断消耗信任。我为此自建并持续维护一个
          LLM 网关与记忆系统：分层上下文、可解释的记忆浮现、跨请求的工具协议续接，已部署在 Linux VPS
          上服务真实的长期对话。下面三章用合成数据还原其中我反复打磨过的产品逻辑与工程取舍。
        </p>
      </div>
      <aside class="overview-stats-block">
        <dl class="overview-stats">
          <div><dt>生产运行</dt><dd>3 个月 · 297 次提交</dd></div>
          <div><dt>前后端代码</dt><dd>约 5 万行</dd></div>
          <div><dt>自动化测试</dt><dd>537 个</dd></div>
          <div><dt>数据库演进</dt><dd>17 次迁移</dd></div>
        </dl>
        <p class="overview-note"><ShieldCheck :size="13" /> 数字来自真实仓库、测试与部署记录；页面演示数据均为合成</p>
      </aside>
    </section>

    <nav class="chapter-nav" aria-label="作品章节">
      <button
        v-for="chapter in chapters"
        :key="chapter.id"
        type="button"
        :class="{ active: activeChapter === chapter.id }"
        @click="selectChapter(chapter.id)"
      >
        <span class="chapter-number">{{ chapter.number }}</span>
        <component :is="chapter.icon" :size="18" />
        <span class="chapter-nav-copy">
          <strong>{{ chapter.short }}</strong>
          <small>{{ chapter.label }}</small>
        </span>
      </button>
    </nav>

    <main class="case-shell">
      <section v-if="activeChapter === 'request'" class="chapter chapter-request">
        <header class="chapter-heading">
          <div>
            <span class="eyebrow">Chapter 01 · End-to-end request</span>
            <h1>一条消息怎样穿过网关</h1>
            <p>每条普通消息都会看看有没有相关内容可以自然浮现；没有新的就复用动态岛，有真正相关的就放进来。</p>
          </div>
          <div class="chapter-proof" aria-label="本章证据范围">
            <span><Clock3 :size="14" /> 本轮走到哪里</span>
            <span><Eye :size="14" /> 用户感受到什么</span>
            <span><Braces :size="14" /> 网关实际做什么</span>
          </div>
        </header>

        <div class="request-command-band">
          <div class="message-modes" role="tablist" aria-label="消息输入">
            <button
              v-for="variant in requestVariants"
              :key="variant.id"
              type="button"
              role="tab"
              :aria-selected="requestVariantId === variant.id"
              :class="{ active: requestVariantId === variant.id }"
              @click="requestVariantId = variant.id"
            >
              <MessageCircle :size="15" />
              <span><strong>{{ variant.label }}</strong><small>{{ variant.event }}</small></span>
            </button>
          </div>

          <div class="playback-controls">
            <button class="primary-command" type="button" @click="toggleRequestPlayback">
              <Pause v-if="requestPlaying" :size="16" />
              <Play v-else :size="16" fill="currentColor" />
              {{ requestPlaying ? '暂停' : requestStepIndex === 0 ? '运行请求' : '继续' }}
            </button>
            <button class="icon-button" type="button" aria-label="上一步" data-tooltip="上一步" :disabled="requestStepIndex === 0" @click="moveRequestStep(-1)">
              <ArrowLeft :size="17" />
            </button>
            <button class="icon-button" type="button" aria-label="下一步" data-tooltip="下一步" :disabled="requestStepIndex === currentRequest.steps.length - 1" @click="moveRequestStep(1)">
              <ArrowRight :size="17" />
            </button>
            <button class="icon-button" type="button" aria-label="重置请求" data-tooltip="重置" @click="resetRequest">
              <RefreshCcw :size="16" />
            </button>
          </div>
        </div>

        <div class="request-message-band">
          <div class="request-message">
            <span>本轮输入</span>
            <strong>{{ currentRequest.message }}</strong>
            <p>{{ currentRequest.summary }}</p>
          </div>
          <div class="request-result">
            <span>{{ requestStepIndex === currentRequest.steps.length - 1 ? '本轮结果' : '正在处理' }}</span>
            <strong>{{ requestStepIndex === currentRequest.steps.length - 1 ? currentRequest.result : currentRequestStep.title }}</strong>
          </div>
        </div>

        <section class="request-process" aria-label="本轮真实加工线">
          <div class="process-line-head">
            <div>
              <span class="eyebrow">本轮真实加工线</span>
              <strong>一条消息从原始请求走到安全返回</strong>
            </div>
            <span>第 {{ requestStepIndex + 1 }} / {{ currentRequest.steps.length }} 段 · {{ currentRequestStep.time }}</span>
          </div>
          <div class="process-progress" aria-hidden="true"><span :style="{ width: `${requestProgress}%` }" /></div>
          <div class="process-strip">
            <button
              v-for="(step, index) in currentRequest.steps"
              :key="step.id"
              type="button"
              :class="[
                `tone-${requestFlowNodes[index]?.accent ?? 'coral'}`,
                { active: index === requestStepIndex, complete: index < requestStepIndex },
              ]"
              @click="jumpToRequestStep(index)"
            >
              <span class="process-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="process-icon"><component :is="flowIcons[step.flowNode as keyof typeof flowIcons]" :size="17" /></span>
              <strong>{{ requestFlowNodes[index]?.label ?? step.label }}</strong>
              <small>{{ requestFlowNodes[index]?.subtitle }}</small>
              <time>{{ step.time }}</time>
            </button>
          </div>
        </section>

        <div class="request-workbench">
          <section class="request-map" aria-label="网关请求地图">
            <div class="stage-canvas-head">
              <div>
                <span><component :is="flowIcons[currentRequestStep.flowNode as keyof typeof flowIcons]" :size="18" /></span>
                <div><small>现在打开第 {{ requestStepIndex + 1 }} 个加工台</small><strong>{{ currentRequestFlowNode.label }}</strong></div>
              </div>
              <p>{{ currentRequestFlowNode.subtitle }}</p>
            </div>

            <div class="recall-lanes" aria-label="自动浮现与主动 Recall 的区别">
              <div class="auto-lane"><Check :size="15" /><span><strong>自动浮现</strong><small>每次请求在模型回答前都会认真找一次；只有 Mem / Stars 能进入动态岛。</small></span></div>
              <div class="manual-lane" :class="{ considered: currentRequestStep.flowNode === 'model' }"><BookOpen :size="15" /><span><strong>主动 Recall</strong><small>模型看完当前上下文仍觉得不够，才会另行调用；本章两条消息都没有调用。</small></span></div>
            </div>

            <Transition name="stage-swap" mode="out-in">
              <div :key="currentRequestStep.flowNode" class="stage-surface">
                <div v-if="requestStepIndex <= 2" class="intake-stage">
                  <template v-if="currentRequestStep.flowNode === 'ingress'">
                    <div class="stage-explainer"><strong>这里还是客户端的原始请求</strong><span>网关没有提前把 Calendar、记忆或工具结果塞进去。</span></div>
                    <div class="request-packet-grid">
                      <article><span>当前消息</span><strong>{{ currentRequest.message }}</strong><small>整轮处理的中心</small></article>
                      <article><span>客户端历史</span><strong>raw messages[]</strong><small>保留真实窗口形状</small></article>
                      <article><span>客户端工具</span><strong>client tools[]</strong><small>只带 schema，不混进消息</small></article>
                      <article class="empty"><span>网关上下文</span><strong>尚未注入</strong><small>此刻仍为空</small></article>
                    </div>
                  </template>
                  <template v-else-if="currentRequestStep.flowNode === 'window'">
                    <div class="stage-explainer"><strong>先判断这是不是同一段连续对话</strong><span>“提到以前”不等于另开旧事线程；窗口按事件、epoch 与滚动裁剪决定。</span></div>
                    <div class="mini-pipeline">
                      <article><span>01</span><strong>保存 raw window</strong><small>客户端实际发来什么</small></article><ChevronRight :size="18" />
                      <article><span>02</span><strong>识别 history event</strong><small>new user / retry / branch</small></article><ChevronRight :size="18" />
                      <article><span>03</span><strong>得到本轮窗口</strong><small>older history + recent tail</small></article>
                    </div>
                  </template>
                  <template v-else>
                    <div class="stage-explainer"><strong>任何隐藏补回，都发生在证据快照之后</strong><span>这样 Debug 时能分清“客户端真的发了什么”和“网关后来补回了什么”。</span></div>
                    <div class="mini-pipeline pending-pipeline">
                      <article><span>01</span><strong>存 request snapshot</strong><small>先封存真实输入</small></article><ChevronRight :size="18" />
                      <article><span>02</span><strong>匹配 pending</strong><small>session + call ids + 指纹</small></article><ChevronRight :size="18" />
                      <article class="success"><span>本轮</span><strong>pending = 0</strong><small>保持客户端原始历史</small></article>
                    </div>
                    <p class="chapter-crosslink"><GitBranch :size="15" /> 混合工具真的需要补回时，会在第二章看到完整的保存与重建。</p>
                  </template>
                </div>

                <div v-else-if="currentRequestStep.flowNode === 'fixed'" class="fixed-layer-stage">
                  <div class="stage-explainer"><strong>固定注入区：它们各有位置，但都不是“旧事浮现”</strong><span>Calendar 与 Bookshelf 在 slow；Heartbeat 是成功后才确认注入的独立层。</span></div>
                  <div class="system-prefix-label"><Layers3 :size="16" /><span><strong>System prefix</strong><small>稳定前缀 · 从上到下拼接</small></span></div>
                  <div class="layer-strip">
                    <article v-for="(layer, index) in currentRequest.fixedLayers" :key="layer.id" :class="[`tone-${layer.accent}`, `layer-${layer.id}`]">
                      <span>{{ String(index + 1).padStart(2, '0') }} · {{ layer.technical }}</span>
                      <strong>{{ layer.label }}</strong>
                      <p>{{ layer.content }}</p>
                      <small>{{ layer.placement }}</small>
                    </article>
                  </div>
                  <div class="fixed-layer-legend">
                    <span><CalendarDays :size="14" /> Calendar + Bookshelf / Notebook / recap = slow</span>
                    <span><Activity :size="14" /> Heartbeat = 独立层</span>
                    <span><CircleDotDashed :size="14" /> 两者都不进入 Memory Island</span>
                  </div>
                </div>

                <div v-else-if="currentRequestStep.flowNode === 'recall'" class="memory-stage">
                  <div class="fixed-layer-collapsed"><Layers3 :size="15" /><span>固定注入区已经摆好</span><small>stable → slow → heartbeat → tool policy → format</small></div>
                  <div class="stage-explainer"><strong>现在才轮到“有没有东西自然浮现”</strong><span>网关每轮都会查询，但不会为了显得记得很多而硬塞旧事。</span></div>
                  <div class="memory-source-grid">
                    <article v-for="source in currentRequest.memorySources" :key="source.name" :class="`tone-${source.accent}`">
                      <div><span>{{ source.kind }}</span><strong>{{ source.name }}</strong></div>
                      <b>{{ source.status }}</b>
                      <p>{{ source.detail }}</p>
                    </article>
                  </div>
                  <p class="memory-boundary"><ShieldCheck :size="15" /> 只有这两份候选会交给 Memory Island；Calendar、书架、Heartbeat 不参与竞争。</p>
                </div>

                <div v-else-if="currentRequestStep.flowNode === 'island'" class="island-stage">
                  <div class="stage-explainer"><strong>动态岛不是记忆仓库，而是本轮要带走的一小块稳定前缀</strong><span>没有真正相关的新内容就整段复用；有新内容才更新，换取更相关的回答。</span></div>
                  <div class="island-sequence">
                    <template v-for="(snapshot, index) in currentRequest.island" :key="snapshot.label">
                      <article :class="[`state-${snapshot.state}`, { chosen: snapshot.state === 'final' }]">
                        <span>{{ snapshot.label }}</span>
                        <strong>Stars · {{ snapshot.stars }}</strong>
                        <small>Mem · {{ snapshot.mem }}</small>
                      </article>
                      <ChevronRight v-if="index < currentRequest.island.length - 1" :size="18" />
                    </template>
                  </div>
                  <div class="cache-decision"><Zap :size="16" /><div><strong>为什么这样做</strong><span>{{ currentRequest.cacheResult }}</span></div></div>
                </div>

                <div v-else class="assembly-stage">
                  <div class="stage-explainer">
                    <strong v-if="currentRequestStep.flowNode === 'assembly'">现在才把前面的加工结果拼成模型真正收到的请求</strong>
                    <strong v-else-if="currentRequestStep.flowNode === 'model'">模型基于这份完整请求决定直接回答，还是主动 Recall</strong>
                    <strong v-else>回答完整结束后，网关才提交本轮状态</strong>
                    <span>Messages 与 tools 是两个独立字段；Memory Island 位于较早历史和最近对话之间。</span>
                  </div>
                  <div class="final-request-shape">
                    <div class="messages-stack">
                      <div class="stack-heading"><Braces :size="16" /><span><strong>messages[]</strong><small>从上到下的真实排列</small></span></div>
                      <article v-for="(layer, index) in currentRequest.finalMessages" :key="layer.id" :class="[`tone-${layer.accent}`, `message-${layer.id}`]">
                        <span class="message-position">{{ String(index + 1).padStart(2, '0') }}</span>
                        <div><strong>{{ layer.label }}</strong><small>{{ layer.technical }}</small></div>
                        <p>{{ layer.id === 'current-user' ? currentRequest.message : layer.content }}</p>
                        <code>{{ layer.cache }}</code>
                      </article>
                    </div>
                    <aside class="tool-schema-field">
                      <div class="stack-heading"><Wrench :size="16" /><span><strong>tools[]</strong><small>独立请求字段</small></span></div>
                      <article><span>Gateway tools</span><strong>shenyu_* · room_* · supabase_*</strong><small>网关可以真正执行</small></article>
                      <article><span>Client tools</span><strong>read_file · open_url · …</strong><small>只转交，不冒充执行</small></article>
                      <p><ShieldCheck :size="14" /> schema 不会被塞进 messages 伪装成一段对话。</p>
                    </aside>
                  </div>
                  <div v-if="currentRequestStep.flowNode !== 'assembly'" class="round-status" :class="{ done: currentRequestStep.flowNode === 'response' }">
                    <Bot v-if="currentRequestStep.flowNode === 'model'" :size="17" />
                    <Check v-else :size="17" />
                    <div>
                      <strong>{{ currentRequestStep.flowNode === 'model' ? 'Round 1：直接回答，主动 Recall 未调用' : 'Stream 完成：提交 Island / Heartbeat / pending 状态' }}</strong>
                      <span>{{ currentRequestStep.systemResult }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </section>

          <aside class="evidence-panel" :class="`tone-${currentRequestStep.accent}`">
            <div class="view-switch" role="group" aria-label="当前环节说明视角">
              <button type="button" :class="{ active: requestViewMode === 'experience' }" @click="requestViewMode = 'experience'"><Eye :size="15" /> 用户感受到的</button>
              <button type="button" :class="{ active: requestViewMode === 'system' }" @click="requestViewMode = 'system'"><Braces :size="15" /> 网关正在做的</button>
            </div>
            <div class="evidence-kicker">
              <span>{{ currentRequestStep.time }}</span>
              <b>{{ currentRequestStep.label }}</b>
            </div>
            <h2>{{ currentRequestStep.title }}</h2>
            <p v-if="requestViewMode === 'experience'">{{ currentRequestStep.experience }}</p>
            <template v-else>
              <p>{{ currentRequestStep.systemAction }}</p>
              <div class="evidence-result"><Check :size="16" /><span>{{ currentRequestStep.systemResult }}</span></div>
            </template>
            <div v-if="requestViewMode === 'system'" class="evidence-code">
              <span><TerminalSquare :size="14" /> 可观察证据</span>
              <code>{{ currentRequestStep.evidence }}</code>
            </div>
            <div v-if="requestViewMode === 'system'" class="evidence-boundary">
              <ShieldCheck :size="16" />
              <span>完整正文、图片、原始 Thinking 和签名不进入持久安全历史。</span>
            </div>
          </aside>
        </div>
      </section>

      <section v-else-if="activeChapter === 'tools'" class="chapter chapter-tools">
        <header class="chapter-heading">
          <div>
            <span class="eyebrow">Chapter 02 · Cross-domain tool protocol</span>
            <h1>模型要行动时，谁来执行</h1>
            <p>不复用记忆流程图；用三条真实时序展示识别、执行、转交与跨请求续接。</p>
          </div>
          <div class="chapter-proof">
            <span><Code2 :size="14" /> 谁来执行</span>
            <span><GitBranch :size="14" /> 两边怎样协作</span>
            <span><HardDrive :size="14" /> 等待时结果不丢</span>
          </div>
        </header>

        <div class="tool-mode-switch" role="tablist" aria-label="工具执行模式">
          <button
            v-for="scenario in toolScenarios"
            :key="scenario.id"
            type="button"
            role="tab"
            :aria-selected="toolScenarioId === scenario.id"
            :class="{ active: toolScenarioId === scenario.id }"
            @click="toolScenarioId = scenario.id"
          >
            <span>{{ scenario.shortLabel }}</span>
            <strong>{{ scenario.label }}</strong>
          </button>
        </div>

        <div class="tool-summary-band">
          <div>
            <span class="eyebrow">当前路径</span>
            <h2>{{ currentToolScenario.label }}</h2>
            <p>{{ currentToolScenario.summary }}</p>
          </div>
          <dl>
            <div v-for="metric in currentToolScenario.metrics" :key="metric.label">
              <dt>{{ metric.label }}</dt>
              <dd>{{ metric.value }}</dd>
            </div>
          </dl>
        </div>

        <div class="tool-playback-band">
          <div class="tool-message"><MessageCircle :size="16" /><strong>{{ currentToolScenario.message }}</strong></div>
          <div class="playback-controls">
            <button class="primary-command" type="button" @click="toggleToolPlayback">
              <Pause v-if="toolPlaying" :size="16" />
              <Play v-else :size="16" fill="currentColor" />
              {{ toolPlaying ? '暂停' : toolStepIndex === 0 ? '运行工具' : '继续' }}
            </button>
            <button class="icon-button" type="button" aria-label="上一步" data-tooltip="上一步" :disabled="toolStepIndex === 0" @click="jumpToToolStep(toolStepIndex - 1)"><ArrowLeft :size="17" /></button>
            <button class="icon-button" type="button" aria-label="下一步" data-tooltip="下一步" :disabled="toolStepIndex === currentToolScenario.events.length - 1" @click="jumpToToolStep(toolStepIndex + 1)"><ArrowRight :size="17" /></button>
            <button class="icon-button" type="button" aria-label="重置工具流程" data-tooltip="重置" @click="resetTool"><RefreshCcw :size="16" /></button>
          </div>
        </div>

        <div class="recognition-rail" aria-label="工具识别顺序">
          <div><ListChecks :size="17" /><span><strong>模型先提出动作</strong><small>不是网关猜用户想做什么</small></span></div>
          <ChevronRight :size="18" />
          <div><Search :size="17" /><span><strong>网关判断谁负责</strong><small>自己做或交给客户端</small></span></div>
          <ChevronRight :size="18" />
          <div><GitBranch :size="17" /><span><strong>按真实节奏执行</strong><small>Gateway calls 当前逐个 await</small></span></div>
          <ChevronRight :size="18" />
          <div><Bot :size="17" /><span><strong>模型继续回答</strong><small>工具过程重新闭合</small></span></div>
        </div>

        <div class="tool-workbench">
          <section class="sequence-panel" aria-label="工具调用时序">
            <div class="sequence-heading">
              <span>调用时序</span>
              <strong>{{ toolStepIndex === currentToolScenario.events.length - 1 ? currentToolScenario.outcome : `正在：${currentToolEvent.title}` }}</strong>
            </div>
            <div class="sequence-list">
              <template v-for="(event, index) in currentToolScenario.events" :key="`${event.title}-${index}`">
                <div v-if="event.phase" class="sequence-divider"><span>{{ event.phase }}</span></div>
                <article
                  class="sequence-event"
                  :class="{ active: index === toolStepIndex, complete: index < toolStepIndex, future: index > toolStepIndex }"
                  @click="jumpToToolStep(index)"
                >
                  <span class="sequence-number">{{ String(index + 1).padStart(2, '0') }}</span>
                  <div class="actor" :class="`actor-${event.from}`">
                    <component :is="actorIcons[event.from]" :size="16" />
                    <span>{{ actorLabels[event.from] }}</span>
                  </div>
                  <ArrowRight class="sequence-arrow" :size="18" />
                  <div class="actor" :class="`actor-${event.to}`">
                    <component :is="actorIcons[event.to]" :size="16" />
                    <span>{{ actorLabels[event.to] }}</span>
                  </div>
                  <div class="sequence-copy">
                    <strong>{{ event.title }}</strong>
                    <p v-if="index === toolStepIndex">{{ event.experience }}</p>
                    <span v-if="index < toolStepIndex"><Check :size="14" /> {{ event.result }}</span>
                  </div>
                </article>
              </template>
            </div>
          </section>

          <section class="transcript-board" aria-label="工具 transcript 实时变化">
            <div class="transcript-board-head">
              <div>
                <span class="eyebrow">此刻真正保存和传递的内容</span>
                <strong>{{ currentToolEvent.transcript.round }}</strong>
              </div>
              <span class="live-indicator"><CircleDotDashed :size="14" /> step {{ toolStepIndex + 1 }} / {{ currentToolScenario.events.length }}</span>
            </div>

            <div class="execution-cadence" :class="`scenario-${currentToolScenario.id}`">
              <template v-if="currentToolScenario.id === 'gateway'">
                <span>prepared_messages</span><ChevronRight :size="15" /><span>assistant call</span><ChevronRight :size="15" /><span>Gateway result</span><ChevronRight :size="15" /><strong>working_messages → Round 2</strong>
              </template>
              <template v-else-if="currentToolScenario.id === 'mixed'">
                <span>Original mixed assistant</span><ChevronRight :size="15" /><span>Gateway 逐个 await</span><ChevronRight :size="15" /><span>Pending 等 Client</span><ChevronRight :size="15" /><strong>Rebuilt → Round 2</strong>
              </template>
              <template v-else>
                <span>Round 1 tool call</span><ChevronRight :size="15" /><span>交给 Client</span><ChevronRight :size="15" /><span>第二次请求带回 result</span><ChevronRight :size="15" /><strong>模型继续</strong>
              </template>
            </div>

            <div class="transcript-columns">
              <article v-for="column in transcriptColumns" :key="column.key" class="transcript-column" :class="[`column-${column.key}`, { populated: currentToolEvent.transcript[column.key].length > 0 }]">
                <header>
                  <div><span>{{ column.eyebrow }}</span><strong>{{ column.title }}</strong></div>
                  <b>{{ currentToolEvent.transcript[column.key].length }}</b>
                </header>
                <code>{{ column.technical }}</code>
                <TransitionGroup name="transcript" tag="div" class="transcript-items">
                  <div v-for="(entry, index) in currentToolEvent.transcript[column.key]" :key="`${entry.label}-${entry.content}-${index}`" class="transcript-entry" :class="[`role-${entry.role}`, `tone-${entry.accent}`]">
                    <span>{{ entry.role }}</span>
                    <strong>{{ entry.label }}</strong>
                    <p>{{ entry.content }}</p>
                  </div>
                </TransitionGroup>
                <div v-if="currentToolEvent.transcript[column.key].length === 0" class="transcript-empty">
                  <CircleDotDashed :size="17" />
                  <span>{{ column.empty }}</span>
                </div>
              </article>
            </div>

            <div class="transcript-reading-note">
              <ShieldCheck :size="15" />
              <span v-if="currentToolScenario.id === 'gateway'">Round 2 续接读取的是内存中的 working_messages；普通 SQLite message log 只是记录。</span>
              <span v-else-if="currentToolScenario.id === 'mixed'">先保存客户端真实窗口，再补回隐藏 pending；上游成功后才把 pending 标成 consumed。</span>
              <span v-else>客户端工具的 call 与 result 由客户端历史带回；网关不伪造本地执行结果。</span>
            </div>
          </section>

          <aside class="tool-truth-panel">
            <div class="view-switch" role="group" aria-label="工具步骤说明视角">
              <button type="button" :class="{ active: toolViewMode === 'experience' }" @click="toolViewMode = 'experience'"><Eye :size="15" /> 用户感受到的</button>
              <button type="button" :class="{ active: toolViewMode === 'system' }" @click="toolViewMode = 'system'"><Braces :size="15" /> 网关正在做的</button>
            </div>
            <div class="tool-inspector-step"><span>{{ String(toolStepIndex + 1).padStart(2, '0') }}</span><b>{{ currentToolEvent.title }}</b></div>
            <h2 v-if="toolViewMode === 'experience'">{{ currentToolEvent.experience }}</h2>
            <template v-else>
              <p class="tool-system-action">{{ currentToolEvent.detail }}</p>
              <div class="evidence-result"><Check :size="16" /><span>{{ currentToolEvent.result }}</span></div>
              <div class="name-contract">
                <div><code>shenyu_*</code><span>Gateway</span></div>
                <div><code>supabase_*</code><span>Gateway</span></div>
                <div><code>room_*</code><span>Gateway</span></div>
                <div><code>other names</code><span>Client</span></div>
              </div>
            </template>
            <div class="truth-note"><ShieldCheck :size="16" /><span>{{ currentToolScenario.truth }}</span></div>
          </aside>
        </div>
      </section>

      <section v-else class="chapter chapter-debug">
        <header class="chapter-heading">
          <div>
            <span class="eyebrow">Chapter 03 · Human-guided Agent engineering</span>
            <h1>一次真实协作，怎样变成可验证的交付</h1>
            <p>我不需要先把体验翻译成代码术语。我们从真实感受出发，在证据上共同决定改什么、保护什么，最后把结果留给下一次工作。</p>
          </div>
          <div class="chapter-proof">
            <span><Bug :size="14" /> 真实案例</span>
            <span><ShieldCheck :size="14" /> 边界未破坏</span>
            <span><FileCheck2 :size="14" /> 行为已验证</span>
          </div>
        </header>

        <section class="collaboration-brief">
          <div class="collaboration-brief-copy">
            <span><Bug :size="15" /> {{ collaborationCase.eyebrow }}</span>
            <h2>{{ collaborationCase.title }}</h2>
            <p>{{ collaborationCase.summary }}</p>
          </div>
          <div class="case-result-strip">
            <article>
              <span>使用症状</span>
              <strong>页面有资料，工具拿不到</strong>
            </article>
            <article>
              <span>确认根因</span>
              <strong>{{ collaborationCase.rootCause }}</strong>
            </article>
            <article>
              <span>最终结果</span>
              <strong>{{ collaborationCase.result }}</strong>
            </article>
          </div>
          <div class="shared-boundaries">
            <span>修改前先守住</span>
            <div>
              <span v-for="item in collaborationCase.definition" :key="item"><Check :size="14" />{{ item }}</span>
            </div>
          </div>
        </section>

        <section class="collaboration-desk">
          <nav class="collaboration-rail" aria-label="协作过程">
            <header>
              <span>协作进度</span>
              <strong>{{ collaborationStepIndex + 1 }} / {{ collaborationCase.steps.length }}</strong>
            </header>
            <button
              v-for="(step, index) in collaborationCase.steps"
              :key="step.id"
              type="button"
              :aria-current="collaborationStepIndex === index ? 'step' : undefined"
              :class="{ active: collaborationStepIndex === index, recorded: index <= collaborationStepIndex }"
              @click="jumpToCollaborationStep(index)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ step.label }}</strong>
                <small>{{ step.title }}</small>
              </div>
              <Check v-if="index < collaborationStepIndex" :size="14" />
            </button>
          </nav>

          <section class="collaboration-stage">
            <header class="collaboration-stage-head">
              <div>
                <span>{{ currentCollaborationStep.label }}</span>
                <strong>{{ currentCollaborationStep.title }}</strong>
                <p>{{ currentCollaborationStep.summary }}</p>
              </div>
              <div class="collaboration-controls">
                <button type="button" aria-label="上一步" data-tooltip="上一步" :disabled="collaborationStepIndex === 0" @click="moveCollaborationStep(-1)">
                  <ArrowLeft :size="17" />
                </button>
                <button type="button" aria-label="下一步" data-tooltip="下一步" :disabled="collaborationStepIndex === collaborationCase.steps.length - 1" @click="moveCollaborationStep(1)">
                  <ArrowRight :size="17" />
                </button>
              </div>
            </header>

            <Transition name="stage-swap" mode="out-in">
              <div :key="currentCollaborationStep.id" class="collaboration-stage-body">
                <div class="exchange-list">
                  <article v-for="exchange in currentCollaborationStep.exchanges" :key="`${currentCollaborationStep.id}-${exchange.speaker}`" class="exchange-row" :class="`speaker-${exchange.speaker}`">
                    <div class="exchange-speaker">
                      <MessageCircle v-if="exchange.speaker === 'owner'" :size="17" />
                      <Bot v-else-if="exchange.speaker === 'agent'" :size="17" />
                      <Check v-else :size="17" />
                      <span>{{ exchange.label }}</span>
                    </div>
                    <p>{{ exchange.text }}</p>
                  </article>
                </div>

                <div class="evidence-route">
                  <div><FileSearch :size="16" /><span>证据路径</span></div>
                  <div class="evidence-route-nodes">
                    <template v-for="(node, index) in currentCollaborationStep.route" :key="node">
                      <span>{{ node }}</span>
                      <ChevronRight v-if="index < currentCollaborationStep.route.length - 1" :size="14" />
                    </template>
                  </div>
                </div>

                <dl class="collaboration-evidence">
                  <div v-for="item in currentCollaborationStep.evidence" :key="item.label">
                    <dt>{{ item.label }}</dt>
                    <dd>{{ item.value }}</dd>
                  </div>
                </dl>
              </div>
            </Transition>
          </section>

          <aside class="decision-ledger">
            <header>
              <div><FileCheck2 :size="17" /><span>确定性在累积</span></div>
              <strong>{{ collaborationTrail.length }} / {{ collaborationCase.steps.length }}</strong>
            </header>
            <ol>
              <li
                v-for="(step, index) in collaborationCase.steps"
                :key="step.id"
                :class="{ recorded: index <= collaborationStepIndex, active: index === collaborationStepIndex }"
              >
                <span><Check v-if="index <= collaborationStepIndex" :size="12" /></span>
                <div>
                  <small>{{ step.label }}</small>
                  <strong>{{ index <= collaborationStepIndex ? step.outcome : '等待前一步证据' }}</strong>
                </div>
              </li>
            </ol>
          </aside>
        </section>

        <section class="collaboration-handoff">
          <header>
            <div>
              <span>任务完成后</span>
              <strong>结果回到项目，而不是留在这次聊天里</strong>
            </div>
            <p>地图负责带路，证据负责下结论；只有改变的事实才写回。</p>
          </header>
          <div class="handoff-grid">
            <article v-for="item in collaborationCase.handoff" :key="item.label">
              <Check :size="15" />
              <div><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
            </article>
          </div>
        </section>
      </section>
    </main>

    <footer class="footer-band">
      <div>
        <strong>Vue 3 · TypeScript · Vite · Static synthetic data</strong>
        <span>一个从长期使用、反复排障和 Agent 协作中逐步长出来的 Vibe Coding 作品。</span>
      </div>
      <span class="footer-proof"><ShieldCheck :size="15" /> No API · No private data · No production code</span>
    </footer>
  </div>
</template>
