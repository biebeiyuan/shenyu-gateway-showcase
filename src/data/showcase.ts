import type {
  Accent,
  CollaborationCase,
  ContextLayerBlock,
  FlowNode,
  RequestVariant,
  ToolScenario,
  ToolTranscriptSnapshot,
  TranscriptItem,
} from '../types'

const layer = (
  id: string,
  label: string,
  technical: string,
  content: string,
  placement: string,
  cache: string,
  accent: Accent,
): ContextLayerBlock => ({ id, label, technical, content, placement, cache, accent })

const fixedLayers: ContextLayerBlock[] = [
  layer('stable', '一直在的设定', 'stable', '相处设定、长期身份与稳定规则', 'system prefix 最前面', 'system.end', 'coral'),
  layer('slow', '慢慢变化的背景', 'slow', 'Calendar + Bookshelf / Notebook / 上次醒来', 'stable 后面', 'system.end', 'gold'),
  layer('heartbeat', '独立的心跳摘要', 'heartbeat', '最近几条内部状态摘要', 'slow 后面', 'system.end', 'mint'),
  layer('tool-policy', '工具边界', 'tool_policy', '哪些工具由网关做，哪些交给客户端', 'heartbeat 后面', 'system.end', 'violet'),
  layer('format', '输出格式提醒', 'format', 'Heartbeat 等私有格式规则', 'system prefix 末尾', 'system.end', 'ink'),
]

const finalMessages = (islandContent: string): ContextLayerBlock[] => [
  ...fixedLayers,
  layer('older-history', '较早的对话', 'client history', '窗口中被保留的较早消息', '固定前缀之后', 'history.before_island', 'gold'),
  layer('memory-island', '这一轮的动态岛', 'mem / Memory Island', islandContent, '较早历史与最近对话之间', 'memory_island.end', 'violet'),
  layer('recent-history', '最近的对话尾部', 'recent client tail', '最近几轮完整对话与工具边界', '动态岛之后', 'rolling tail', 'mint'),
  layer('current-user', '你刚刚说的话', 'current user', '当前用户消息', 'messages 最后', 'current_user.end', 'coral'),
]

export const requestFlowNodes: FlowNode[] = [
  { id: 'ingress', label: '收到原始请求', subtitle: '历史 · 当前消息 · Client tools', accent: 'coral' },
  { id: 'window', label: '选择对话窗口', subtitle: 'event · epoch · trim', accent: 'gold' },
  { id: 'pending', label: '补回未完成工具轮', subtitle: '先保存 snapshot，再匹配 pending', accent: 'violet' },
  { id: 'fixed', label: '摆好稳定背景', subtitle: 'Stable · Slow · Heartbeat', accent: 'gold' },
  { id: 'recall', label: '寻找浮现候选', subtitle: '只有 Mem / Stars', accent: 'mint' },
  { id: 'island', label: '动态岛做决定', subtitle: '复用或更新', accent: 'violet' },
  { id: 'assembly', label: '拼成真正的 Messages', subtitle: '每层放在自己的位置', accent: 'coral' },
  { id: 'model', label: '模型 Round 1', subtitle: '回答或调用工具', accent: 'ink' },
  { id: 'response', label: '返回并确认状态', subtitle: '成功后才 consume', accent: 'coral' },
]

export const requestVariants: RequestVariant[] = [
  {
    id: 'no-surface',
    label: '这轮没有新浮现',
    message: '“今天状态不太好，完全没心思学习。”',
    summary: '稳定背景照常摆好，Mem / Stars 也认真找过；没有新的东西需要进入动态岛。',
    result: '上一版动态岛整段复用，Memory Island 缓存前缀保持稳定。',
    event: '已检索 · 没有新浮现',
    memoryOutcome: 'retained',
    fixedLayers,
    memorySources: [
      { name: 'Mem', kind: '事实与小便签', status: '已查询 · 没有新内容', detail: '没有新的事实、承诺或具体锚点适合进入这一轮动态岛。', accent: 'mint' },
      { name: 'Stars', kind: '经历与关系片段', status: '已查询 · 没有新星浮现', detail: '没有新的经历片段需要改变上一版稳定内容。', accent: 'violet' },
    ],
    island: [
      { label: '上一轮动态岛', stars: '城市骑行 · 读书会 · 去年的旅行', mem: '本周学习计划', state: 'previous' },
      { label: '本轮浮现候选', stars: '没有新的内容通过判断', mem: '没有新的便签进入', state: 'proposal' },
      { label: '本轮实际使用', stars: '城市骑行 · 读书会 · 去年的旅行', mem: '本周学习计划', state: 'final' },
    ],
    finalMessages: finalMessages('复用上一版：城市骑行 · 读书会 · 去年的旅行 / 本周学习计划'),
    cacheResult: '上一版动态岛整段复用；字节不变，memory_island.end 指纹保持稳定。',
    steps: [
      { id: 'received', flowNode: 'ingress', label: '收到请求', time: '+0ms', title: '先保留客户端真正发来的内容', experience: '你只是随口说今天没状态，当前这句话仍然是整轮对话的中心。', systemAction: '接收客户端历史、当前消息与 Client tool schemas，并建立 request id。', systemResult: '原始请求进入 ChatPipeline；尚未添加任何网关上下文。', evidence: 'raw messages + current user + client tools', accent: 'coral' },
      { id: 'history', flowNode: 'window', label: '整理窗口', time: '+4ms', title: '决定哪些最近对话继续保留', experience: '系统不会因为附件变化或客户端表示差异突然失忆。', systemAction: '保存 raw window，判断 new_user / retry / branch，处理 cold start 与高水位裁剪。', systemResult: '得到本轮 client window 和固定 epoch。', evidence: 'raw_request_windows → event → chunked window', accent: 'gold' },
      { id: 'pending', flowNode: 'pending', label: '检查续接', time: '+8ms', title: '看看有没有上一轮未完成的工具对话', experience: '如果上一轮客户端工具还没做完，网关会在这里把断开的部分接回来。', systemAction: '先写 request_context_snapshot，再按 session、call ids 与消息指纹匹配 pending transcript。', systemResult: '本轮 pending=0，客户端实际历史保持原样。', evidence: 'snapshot stored before pending injection', accent: 'violet' },
      { id: 'fixed', flowNode: 'fixed', label: '摆好背景', time: '+54ms', title: '稳定层、慢速层和 Heartbeat 各回到自己的位置', experience: 'Calendar、书架和 Heartbeat 是一直在的背景，不是被这句话触发出来的旧事。', systemAction: '渲染 stable、slow、heartbeat、tool_policy、format 五个 system-prefix 层。', systemResult: 'Calendar + Bookshelf 进入 slow；Heartbeat 保持独立。', evidence: 'stable → slow → heartbeat → tool_policy → format', accent: 'gold' },
      { id: 'recall', flowNode: 'recall', label: '寻找浮现', time: '+82ms', title: '只有 Mem 和 Stars 进入浮现判断', experience: '系统认真找过，但这轮没有新的记忆需要浮上来。', systemAction: 'Mem 与 Stars 的专用 ranker 并行形成完整候选；其他固定层不进入 Island。', systemResult: 'mem_new=0；stars_new=0。', evidence: 'ContextBuilder: notes_task + stars_task', accent: 'mint' },
      { id: 'island', flowNode: 'island', label: '岛的决定', time: '+85ms', title: '继续使用之前的动态岛', experience: '模型仍带着之前少量背景理解你，但不会为这一句话重新换一批记忆。', systemAction: 'Memory Island 复用上一版完整 rendered_text，不重新拼接内容。', systemResult: 'Stars lane 与 Mem lane 均 retained；缓存边界不移动。', evidence: 'decision=retained · fingerprint=same', accent: 'violet' },
      { id: 'assembly', flowNode: 'assembly', label: '拼装 Messages', time: '+91ms', title: '把不同层放进模型真正会看到的位置', experience: '固定背景、动态记忆、最近对话和当前消息都有自己的位置，不会混成一段资料。', systemAction: '前缀层插在 messages 最前；Memory Island 锚定在较早历史和 recent tail 之间；当前消息保持最后。', systemResult: 'prepared_messages 完成，tools schemas 作为独立请求字段携带。', evidence: 'assemble_layered_messages()', accent: 'coral' },
      { id: 'model', flowNode: 'model', label: '模型处理', time: '+124ms', title: '模型看到完整上下文后决定直接回答', experience: '现有背景已经够了，不需要主动回旧资料里翻找。', systemAction: '合并 Gateway / Client tools，构建当前 provider payload 和 cache breakpoints。', systemResult: 'Round 1 没有 tool call，进入自然语言流。', evidence: 'tools offered · recall_called=false', accent: 'ink' },
      { id: 'response', flowNode: 'response', label: '确认完成', time: '+0.9s', title: '完整回答后才确认这轮状态', experience: '你只看到自然回答；内部层级和检索过程不会泄露出来。', systemAction: '流式返回、过滤私有内容；成功后标记 Heartbeat / pending consumed，并保存安全日志。', systemResult: 'status=ok；动态岛保持；完整正文不进入持久安全历史。', evidence: 'stream complete → mark_context_consumed()', accent: 'coral' },
    ],
  },
  {
    id: 'surface',
    label: '有东西自然浮现',
    message: '“整理房间时翻出了之前去新疆旅行买的小吊坠。”',
    summary: '固定与慢速层照常摆好；只有 Mem / Stars 因具体地点和物件形成了新的浮现候选。',
    result: '新疆旅行与小吊坠进入动态岛；island 更新，但更早的稳定前缀仍可复用。',
    event: '已检索 · 有新内容浮现',
    memoryOutcome: 'surfaced',
    fixedLayers,
    memorySources: [
      { name: 'Mem', kind: '事实与小便签', status: '找到 · 新疆的小吊坠', detail: '“新疆”和“吊坠”形成地点与物件的窄锚点。', accent: 'mint' },
      { name: 'Stars', kind: '经历与关系片段', status: '连上 · 那次新疆旅行', detail: '相关旅行片段进入本轮完整候选，不依赖“还记得吗”。', accent: 'violet' },
    ],
    island: [
      { label: '上一轮动态岛', stars: '城市骑行 · 读书会 · 去年的旅行', mem: '本周学习计划', state: 'previous' },
      { label: '本轮浮现候选', stars: '新疆旅行的太阳 · 小吊坠', mem: '在新疆买回的小吊坠', state: 'proposal' },
      { label: '本轮实际使用', stars: '新疆旅行 · 城市骑行 · 读书会', mem: '新疆的小吊坠', state: 'final' },
    ],
    finalMessages: finalMessages('更新为：新疆旅行 · 城市骑行 · 读书会 / 新疆的小吊坠'),
    cacheResult: 'Memory Island 更新；memory_island.end 重建，但 system.end 与 history.before_island 仍可继续复用。',
    steps: [
      { id: 'received', flowNode: 'ingress', label: '收到请求', time: '+0ms', title: '先保留“小吊坠”和“新疆旅行”这两个具体锚点', experience: '你只是顺口提到翻出了吊坠，并没有要求系统证明自己记得过去。', systemAction: '接收原始历史、当前消息与 Client tools，不提前下回忆结论。', systemResult: '消息进入与普通日常聊天相同的请求链。', evidence: 'raw messages + current user + client tools', accent: 'coral' },
      { id: 'history', flowNode: 'window', label: '整理窗口', time: '+4ms', title: '提到过去不等于修改历史', experience: '当前聊天仍然连续，不会因为“以前去新疆”就开启另一条线程。', systemAction: '保存 raw window，完成 history event、cold start 和窗口选择。', systemResult: 'event=new_user；epoch 保持。', evidence: 'raw_request_windows → new_user → window', accent: 'gold' },
      { id: 'pending', flowNode: 'pending', label: '检查续接', time: '+8ms', title: '确认没有未完成的客户端工具轮', experience: '这是一条新的日常消息，不需要补回上一轮隐藏工具上下文。', systemAction: '先写 snapshot，再尝试匹配 pending transcript。', systemResult: 'pending=0；继续普通上下文路径。', evidence: 'snapshot stored · pending miss', accent: 'violet' },
      { id: 'fixed', flowNode: 'fixed', label: '摆好背景', time: '+55ms', title: 'Calendar、Bookshelf 和 Heartbeat 仍是各自独立的层', experience: '这些背景一直在自己的位置，不是因为吊坠才突然被召回。', systemAction: '渲染 stable、slow、heartbeat、tool_policy、format。', systemResult: '固定前缀与上一轮保持高度稳定。', evidence: 'system prefix layers', accent: 'gold' },
      { id: 'recall', flowNode: 'recall', label: '寻找浮现', time: '+96ms', title: 'Mem 和 Stars 找到了与当前物件真正相关的内容', experience: '不是因为你说了“还记得吗”，而是新疆和小吊坠确实连上了一段经历。', systemAction: 'Mem 用地点/物件锚点命中；Stars ranker 找到相关旅行片段。', systemResult: '形成一份新的 Stars / Mem 完整提案。', evidence: 'mem_match=entity · stars_match=related', accent: 'mint' },
      { id: 'island', flowNode: 'island', label: '岛的决定', time: '+101ms', title: '新的内容值得进入这一轮动态岛', experience: '新疆旅行自然回到当前对话，但眼前的小吊坠仍是主角。', systemAction: 'Stars 与 Mem 分 lane 选择最终提案，并生成新的 rendered_text。', systemResult: '相关性优先；Memory Island 更新。', evidence: 'decision=rewritten · fingerprint=changed', accent: 'violet' },
      { id: 'assembly', flowNode: 'assembly', label: '拼装 Messages', time: '+108ms', title: '新动态岛被放到历史中的固定锚点', experience: '新的记忆没有被塞进最前面的设定，也没有盖住你刚说的话。', systemAction: '固定前缀先插入；新 island 插在 older history 与 recent tail 之间；current user 保持最后。', systemResult: 'prepared_messages 与 cache breakpoint 路径确定。', evidence: 'history.before_island → island → recent tail', accent: 'coral' },
      { id: 'model', flowNode: 'model', label: '模型处理', time: '+142ms', title: '模型获得了刚好相关的背景', experience: '它可以自然接住这个话题，而不需要再主动翻更多旧资料。', systemAction: '构建 provider payload；合并 tools；保留更早稳定前缀缓存。', systemResult: 'Round 1 直接回答，主动 Recall 未调用。', evidence: 'island changed · stable prefix reused', accent: 'ink' },
      { id: 'response', flowNode: 'response', label: '确认完成', time: '+1.0s', title: '完整回答后提交新的动态岛版本', experience: '你看到自然回应，不会看到系统把检索列表倒出来。', systemAction: '流式完成后提交 Island，记录 added / removed 与新缓存指纹。', systemResult: 'status=ok；新 Island 成为下一轮可复用版本。', evidence: 'stream complete → island committed', accent: 'coral' },
    ],
  },
]

const item = (role: TranscriptItem['role'], label: string, content: string, accent: Accent): TranscriptItem => ({ role, label, content, accent })
const snapshot = (
  round: string,
  working: TranscriptItem[],
  pending: TranscriptItem[] = [],
  clientVisible: TranscriptItem[] = [],
): ToolTranscriptSnapshot => ({ round, working, pending, clientVisible })

const clientBase = [
  item('system', 'Prepared context', '分层上下文 + 历史窗口', 'coral'),
  item('user', 'User', '把这份文件打开给我看看。', 'gold'),
]
const clientCall = item('assistant', 'Assistant tool call', 'read_file(path="...")', 'violet')
const clientResult = item('tool', 'Client result', '文件已打开', 'mint')

const recallBase = [
  item('system', 'Prepared context', '固定前缀 + 动态岛 + 最近历史', 'coral'),
  item('user', 'User', '我以前也有过这种完全不想学习的时候吗？', 'gold'),
]
const recallCall = item('assistant', 'Assistant tool call', 'shenyu_recall(query="不想学习", mode="mood")', 'violet')
const recallResult = item('tool', 'Gateway result', '3 个旧片段 + source_type / source_id', 'mint')
const recallFinal = item('assistant', 'Final answer', '带着真正找到的旧内容继续回答', 'coral')

const mixedBase = [
  item('system', 'Prepared context', '分层上下文 + 工具定义', 'coral'),
  item('user', 'User', '找找以前写新疆旅行的东西，再打开找到的文件。', 'gold'),
]
const mixedAssistant = item('assistant', 'Original mixed assistant', 'shenyu_recall(...) + read_file(...)', 'violet')
const mixedGatewayResult = item('tool', 'Hidden Gateway result', 'Recall 找到新疆旅行片段', 'mint')
const mixedClientCall = item('assistant', 'Client-visible assistant', 'read_file(path="xinjiang-note")', 'violet')
const mixedClientResult = item('tool', 'Client result', '文件已打开', 'gold')
const mixedFinal = item('assistant', 'Final answer', 'Recall 与文件结果汇合后的回答', 'coral')

export const toolScenarios: ToolScenario[] = [
  {
    id: 'client', label: '客户端来做', shortLabel: '打开本地文件', message: '“把这份文件打开给我看看。”',
    summary: '文件在用户设备上；网关转交标准调用，但不会冒充客户端执行。',
    outcome: '客户端结果在下一次请求回来，模型继续回答。',
    metrics: [{ label: '真正执行者', value: 'Client' }, { label: 'Gateway 执行', value: '0 次' }, { label: 'HTTP 请求', value: '2 次' }],
    events: [
      { from: 'client', to: 'gateway', title: '收到消息与 Client tool', experience: '你只需要说想打开文件。', detail: '请求携带 read_file schema。', result: '保留客户端工具定义。', transcript: snapshot('准备 Round 1', clientBase) },
      { from: 'gateway', to: 'model', title: '模型产生 read_file 调用', experience: '模型把意图变成可执行动作。', detail: 'Round 1 返回 Client tool call。', result: '执行责任仍属于客户端。', transcript: snapshot('Round 1 返回 tool call', [...clientBase, clientCall]) },
      { from: 'model', to: 'gateway', title: '网关识别执行域', experience: '网关知道自己不能读你设备上的文件。', detail: '工具名不属于 gateway-native namespace。', result: '不执行、不伪造。', transcript: snapshot('准备返回客户端', [...clientBase, clientCall], [], [clientCall]) },
      { from: 'gateway', to: 'client', title: '只把调用交给客户端', experience: '真正的文件操作回到客户端。', detail: '返回标准 assistant tool call。', result: '第一次请求结束。', transcript: snapshot('Client 正在执行', [...clientBase, clientCall], [], [clientCall]) },
      { phase: '第二次 HTTP 请求', from: 'client', to: 'gateway', title: 'Client result 回来', experience: '文件打开后，对话继续。', detail: '客户端历史带回 tool result。', result: '工具轮重新完整。', transcript: snapshot('第二次请求输入', [...clientBase, clientCall, clientResult], [], [clientCall, clientResult]) },
      { from: 'gateway', to: 'model', title: '模型继续回答', experience: '你看到操作完成后的自然回答。', detail: '完整 client tool transcript 进入新 Round。', result: '最终正文返回。', transcript: snapshot('最终回答', [...clientBase, clientCall, clientResult, item('assistant', 'Final answer', '文件已经打开，我们继续看。', 'coral')]) },
    ],
    truth: 'Client tool 的核心边界：网关负责协议，但不抢执行权。',
  },
  {
    id: 'gateway', label: '网关主动翻找', shortLabel: '主动 Recall', message: '“我以前也有过这种完全不想学习的时候吗？”',
    summary: '模型看完当前动态岛仍觉得背景不足，于是在同一次请求内主动调用 Recall。',
    outcome: 'assistant tool call 与 Gateway result 追加进 working_messages，Round 2 继续生成。',
    metrics: [{ label: '真正执行者', value: 'Gateway' }, { label: '跨请求 Pending', value: '不需要' }, { label: 'Transcript', value: '内存增长' }],
    events: [
      { from: 'client', to: 'gateway', title: '收到需要认真回忆的问题', experience: '这次不能只靠眼前背景猜。', detail: '普通准备链先生成 prepared_messages。', result: 'working_messages 从 prepared context 开始。', transcript: snapshot('准备 Round 1', recallBase) },
      { from: 'gateway', to: 'model', title: '模型先看当前上下文', experience: '模型自己判断是否需要回去翻。', detail: 'Round 1 获得动态岛与 Recall 工具。', result: '选择 shenyu_recall。', transcript: snapshot('Round 1 生成调用', [...recallBase, recallCall]) },
      { from: 'model', to: 'gateway', title: 'Recall call 追加进 working_messages', experience: '“我想回去找找类似的心情。”', detail: '原 assistant tool-call message 进入本次请求内存列表。', result: '开始执行 Gateway tool。', transcript: snapshot('本次请求内存工作区', [...recallBase, recallCall]) },
      { from: 'gateway', to: 'store', title: '网关检索旧资料', experience: 'Recall 从多类旧资料中找少量片段。', detail: '主索引与 Stars / Mem / Heartbeat companion 并行。', result: '得到结构化 Gateway result。', transcript: snapshot('工具执行中', [...recallBase, recallCall]) },
      { from: 'store', to: 'gateway', title: 'Tool result 追加进 working_messages', experience: '真正找到的旧片段回到当前思考。', detail: 'role=tool、tool_call_id 与 name 对应原调用。', result: '同时写 gateway_messages 日志，但 Round 2 直接使用内存 working_messages。', transcript: snapshot('working_messages 已增长', [...recallBase, recallCall, recallResult]) },
      { from: 'gateway', to: 'model', title: '用增长后的 transcript 发起 Round 2', experience: '模型带着找到的片段重新回答。', detail: 'build_upstream_request(messages_override=working_messages)。', result: '不需要 pending SQLite。', transcript: snapshot('Round 2', [...recallBase, recallCall, recallResult]) },
      { from: 'model', to: 'client', title: '最终回答加入 transcript', experience: '你能感觉到它真的回去找过。', detail: '模型输出最终正文并完成本次工具循环。', result: '成功后提交本轮上下文。', transcript: snapshot('Round 2 完成', [...recallBase, recallCall, recallResult, recallFinal]) },
    ],
    truth: 'Gateway-only 工具轮真正靠本次请求内的 working_messages 续接；SQLite message log 是记录，不是 Round 2 的拼接来源。',
  },
  {
    id: 'mixed', label: '两边一起做', shortLabel: 'Recall + 打开文件', message: '“找找以前写新疆旅行的东西，再把找到的文件打开。”',
    summary: '同一 assistant 消息同时包含 Gateway 与 Client calls；必须跨请求保存协议现场。',
    outcome: '原 mixed assistant、Gateway result 与 Client result 重建后，模型才继续回答。',
    metrics: [{ label: '执行域', value: 'Gateway + Client' }, { label: 'Gateway 节奏', value: '逐个 await' }, { label: '跨请求存根', value: 'SQLite pending' }],
    events: [
      { from: 'gateway', to: 'model', title: 'Round 1 产生 mixed calls', experience: '一个完整任务被模型拆成“找旧资料”和“打开文件”。', detail: '同一 assistant message 包含 shenyu_recall + read_file。', result: '网关获得原始 mixed assistant。', transcript: snapshot('Round 1 返回 mixed assistant', [...mixedBase, mixedAssistant]) },
      { from: 'model', to: 'gateway', title: '按工具名拆成两个执行域', experience: '系统判断哪一步自己做，哪一步交给客户端。', detail: 'Gateway calls 与 Client calls 分组。', result: '原始 mixed assistant 暂时保持完整。', transcript: snapshot('拆分但尚未返回', [...mixedBase, mixedAssistant]) },
      { from: 'gateway', to: 'store', title: '先执行 Gateway Recall', experience: '新疆旅行片段已经找到。', detail: 'Gateway call 逐个 await，并生成 role=tool result。', result: '同时写普通 gateway_messages 日志。', transcript: snapshot('Gateway 部分已完成', [...mixedBase, mixedAssistant, mixedGatewayResult]) },
      { from: 'gateway', to: 'store', title: '把跨请求现场放进 pending', experience: '系统先保存已经完成的一半。', detail: 'pending 保存 original mixed assistant + Gateway results + Client call ids。', result: '这是第二次请求重建协议的事实来源。', transcript: snapshot('等待 Client', mixedBase, [mixedAssistant, mixedGatewayResult], [mixedClientCall]) },
      { from: 'gateway', to: 'client', title: '客户端只看见自己的调用', experience: '打开本地文件仍由客户端完成。', detail: '返回 assistant message 时只保留 read_file。', result: '第一次 HTTP 请求结束。', transcript: snapshot('Client 正在执行', mixedBase, [mixedAssistant, mixedGatewayResult], [mixedClientCall]) },
      { phase: '第二次 HTTP 请求', from: 'client', to: 'gateway', title: '先保存客户端真实窗口', experience: '客户端把 read_file 结果带回来。', detail: 'raw window 与 context snapshot 在 pending 注入前保存。', result: '日志仍能区分客户端实际回传与网关后来补回。', transcript: snapshot('客户端实际回传', [...mixedBase, mixedClientCall, mixedClientResult], [mixedAssistant, mixedGatewayResult], [mixedClientCall, mixedClientResult]) },
      { from: 'store', to: 'gateway', title: '匹配 pending 并重建完整 transcript', experience: '两边完成的结果重新汇合成同一个任务。', detail: '匹配 session、call ids、可见文本、工具名和参数。', result: '重建 original mixed assistant + Gateway result + Client result。', transcript: snapshot('Rebuilt transcript', [...mixedBase, mixedAssistant, mixedGatewayResult, mixedClientResult], [mixedAssistant, mixedGatewayResult], [mixedClientCall, mixedClientResult]) },
      { from: 'gateway', to: 'model', title: '完整 transcript 进入 Round 2', experience: '模型终于同时看到 Recall 和文件结果。', detail: '重建消息先参与 context assembly，再构造 upstream payload。', result: 'pending 暂时仍未 consumed。', transcript: snapshot('Round 2 请求', [...mixedBase, mixedAssistant, mixedGatewayResult, mixedClientResult], [mixedAssistant, mixedGatewayResult]) },
      { from: 'model', to: 'client', title: '上游成功后才消费 pending', experience: '最终回答完成后，这次跨请求工具轮才真正结束。', detail: 'mark_context_consumed() 标记 pending ids consumed。', result: '失败时 pending 仍可用于重试。', transcript: snapshot('Round 2 完成 · pending consumed', [...mixedBase, mixedAssistant, mixedGatewayResult, mixedClientResult, mixedFinal]) },
    ],
    truth: 'Mixed tool 的核心是两份不同的数据产品：客户端真实窗口先保存，隐藏 pending 再补回；只有重建后的 transcript 才发给模型。',
  },
]

export const collaborationCase: CollaborationCase = {
  eyebrow: '一个真实协作案例',
  title: '界面看得见，Agent 工具却打不开',
  summary: '我先说清“明明看得到却用不了”的真实体验，Agent 再沿请求、工具和数据边界找到证据。我们不把模型当成答案，也不为了闭环盲目改地图。',
  rootCause: '页面使用标题，工具契约只接受内部 ID',
  result: '标题和 ID 都可定位；重复项拒绝猜测；旧内容保持不变',
  definition: [
    '标题和 ID 都能定位',
    '重复项不自动猜测',
    '已有正文和历史不被改写',
  ],
  steps: [
    {
      id: 'listen',
      label: '听懂问题',
      title: '先保留用户真正看见的现象',
      summary: '不要求产品感受先变成代码术语。一句“明明看得到”，已经给出了展示面与执行面的线索。',
      exchanges: [
        { speaker: 'owner', label: '我说的使用感受', text: '“后台里明明能看到这条资料，Agent 换了几个参数还是打不开。”' },
        { speaker: 'agent', label: 'Agent 的技术翻译', text: '“我先区分模型没有调用、调用失败，还是界面展示字段与工具参数不一致。”' },
        { speaker: 'shared', label: '我们先达成的共识', text: '先找到真实调用证据，不把“模型不会用”当成根因。' },
      ],
      route: ['使用症状', '三个可验证假设', '真实调用证据'],
      evidence: [
        { label: '已知', value: '页面确实展示了可识别标题' },
        { label: '待查', value: '工具是否被调用，以及失败在哪一层' },
      ],
      outcome: '一个模糊的挫败感，变成三个可被日志和代码排除的假设。',
      accent: 'coral',
    },
    {
      id: 'evidence',
      label: '找到证据',
      title: '把“感觉不对”接到真实请求链',
      summary: 'Agent 用项目地图进入正确的日志、工具契约和数据边界，但地图不替证据做结论。',
      exchanges: [
        { speaker: 'owner', label: '我关心的问题', text: '“我不是想让它多试几次，我想知道为什么看得见却用不了。”' },
        { speaker: 'agent', label: 'Agent 拿到的证据', text: '工具调用已经进入 Gateway，但返回 validation；界面给的是标题，工具当时只接受内部 ID。' },
        { speaker: 'shared', label: '我们共同判断', text: '这不是模型没伸手，而是展示契约与执行契约没有说同一种语言。' },
      ],
      route: ['项目入口', '工具日志', 'Schema', 'Handler'],
      evidence: [
        { label: '工具日志', value: '调用到达 Gateway，error_kind = validation' },
        { label: '契约对照', value: '界面暴露 title，schema 仅承诺 UUID' },
        { label: '尚未证实', value: '不猜测上游节点，不重写数据层' },
      ],
      outcome: '根因从“AI 不稳定”收窄为一个可修复的跨层契约错位。',
      accent: 'gold',
    },
    {
      id: 'align',
      label: '共同定边界',
      title: '修复什么，与绝对不动什么',
      summary: '代码之前的对齐不是仪式，而是把使用者在意的结果变成可测试边界。',
      exchanges: [
        { speaker: 'owner', label: '我给出的产品边界', text: '“我希望看得到就能拿得到，但重复的不要瞎猜，以前的内容也不能因修复被改掉。”' },
        { speaker: 'agent', label: 'Agent 给出的最小方案', text: '让读取与批注同时接受精确标题或 ID；重复标题返回歧义；保留原文冻结和批注追加。' },
        { speaker: 'shared', label: '修改前的完成标准', text: '解决“看得到却用不了”，但不扩大删除、覆盖或自动猜测权限。' },
      ],
      route: ['产品边界', '工具契约', '数据不变量', '回归清单'],
      evidence: [
        { label: '改动', value: 'schema、broker 描述和 handler 使用同一定位契约' },
        { label: '不改', value: '原文、历史批注、写入权限和数据所有权' },
      ],
      outcome: '产品感受、工程方案和回归测试共用同一个“做成了”定义。',
      accent: 'violet',
    },
    {
      id: 'deliver',
      label: '验证与留路',
      title: '交付不只是代码通过，还要让下次少走弯路',
      summary: '测试证明当前改动，文档只保留未来真的会重用的事实。地图是可维护性的支撑，不是每次都必须出场的主角。',
      exchanges: [
        { speaker: 'owner', label: '我最后确认的事', text: '真实使用路径恢复，而且原本珍贵的内容和边界都没有被顺手改掉。' },
        { speaker: 'agent', label: 'Agent 交付的证据', text: '精确标题可用、重复标题拒绝猜测、原文冻结和追加批注回归全部通过。' },
        { speaker: 'shared', label: '我们留给项目的结果', text: '公开契约和一条已确认排查经验被更新；未变的架构地图不制造额外改动。' },
      ],
      route: ['代码行为', '自动测试', '现行文档', '地图复核'],
      evidence: [
        { label: '行为回归', value: '标题 / ID / 重复项 / 写入保护' },
        { label: '知识保留', value: '只更新改变的契约和已确认故障教训' },
        { label: '地图判断', value: '路径与跨区责任未变，不为了闭环而改图' },
      ],
      outcome: '这次修复不仅解决了问题，也让下一个 Agent 能更快识别同类契约错位。',
      accent: 'mint',
    },
  ],
  handoff: [
    { label: '代码行为', value: '标题与 ID 使用同一套定位契约' },
    { label: '回归测试', value: '定位、歧义、冻结与追加都有验证' },
    { label: '知识写回', value: '只更新改变的契约和已确认教训' },
    { label: '地图复核', value: '跨区责任未变，不为了闭环制造改动' },
  ],
}
