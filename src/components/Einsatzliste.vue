<script setup>
import { computed } from 'vue'
import { haupteinsaetze, haupteinsatzZu } from '../data/einsatzHierarchie.js'

const props = defineProps({
  einsaetze: {
    type: Array,
    required: true,
  },

  ausgewaehlterEinsatzId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits([
  'einsatz-auswaehlen',
  'neuer-einsatz',
])
const hauptliste = computed(() => haupteinsaetze(props.einsaetze))
const aktiveHauptId = computed(() => haupteinsatzZu(
  props.einsaetze,
  props.einsaetze.find(e => e.id === props.ausgewaehlterEinsatzId),
)?.id)
</script>

<template>
  <div class="einsatzlisten-bereich">
    <div class="einsatzliste">
      <button
        v-for="einsatz in hauptliste"
        :key="einsatz.id"
        class="einsatz"
        :class="{
          aktiv:
            einsatz.id ===
            aktiveHauptId,
        }"
        @click="
          emit(
            'einsatz-auswaehlen',
            einsatz.id,
          )
        "
      >
        <div class="einsatznummer">
          #{{ einsatz.id }}
        </div>

        <strong>
          {{ einsatz.meldung }}
        </strong>

        <span>
          {{ einsatz.ort }}
        </span>

        <span
          class="einsatzstatus"
          :class="einsatz.status"
        >
          {{ einsatz.status }}
        </span>
      </button>
    </div>

    <button
      class="hauptbutton"
      @click="emit('neuer-einsatz')"
    >
      + Manueller Einsatz
    </button>
  </div>
</template>
