<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  Activity,
  BrainCircuit,
  CalendarDays,
  CircleDotDashed,
  DoorOpen,
  GitFork,
  History,
  Layers3,
  MessageCircle,
  NotebookText,
  Radio,
  ShieldCheck,
  Sparkles,
  Wrench,
} from '@lucide/vue'
import type { GatewayNodeDetails } from '../types'

const props = defineProps<{
  data: GatewayNodeDetails
  selected?: boolean
}>()

const icons = {
  activity: Activity,
  brain: BrainCircuit,
  calendar: CalendarDays,
  door: DoorOpen,
  history: History,
  island: CircleDotDashed,
  layers: Layers3,
  message: MessageCircle,
  notebook: NotebookText,
  radio: Radio,
  shield: ShieldCheck,
  sparkles: Sparkles,
  waves: Radio,
  workflow: GitFork,
  wrench: Wrench,
}

const iconComponent = computed(() => icons[props.data.icon as keyof typeof icons] ?? CircleDotDashed)
</script>

<template>
  <div
    class="gateway-node"
    :class="[
      `tone-${data.accent}`,
      `status-${data.status ?? 'idle'}`,
      { 'is-selected': selected },
    ]"
  >
    <Handle class="node-handle" type="target" :position="Position.Left" />
    <div class="node-icon" aria-hidden="true">
      <component :is="iconComponent" :size="18" :stroke-width="1.8" />
    </div>
    <div class="node-copy">
      <span class="node-zone">{{ data.zone }}</span>
      <strong>{{ data.label }}</strong>
      <span>{{ data.subtitle }}</span>
    </div>
    <span v-if="data.stepNumber" class="node-step">{{ data.stepNumber }}</span>
    <Handle class="node-handle" type="source" :position="Position.Right" />
  </div>
</template>
