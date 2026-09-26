<script setup>
const props = defineProps({
  einsatz: {
    type: Object,
    required: true,
  },

  fahrzeuge: {
    type: Array,
    required: true,
  },

  fahrzeugHinweis: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits([
  'bearbeiten',
  'fahrzeug-auswaehlen',
  'alarmieren',
])

function istAusgewaehlt(fahrzeugId) {
  return props.einsatz.fahrzeuge.includes(
    fahrzeugId,
  )
}

function hatFahrzeugeZumAlarmieren() {
  if (
    props.einsatz.status ===
    'abgeschlossen'
  ) {
    return false
  }

  return props.fahrzeuge.some(
    (fahrzeug) => {
      return (
        props.einsatz.fahrzeuge.includes(
          fahrzeug.id,
        ) &&
        fahrzeug.einsatzId !==
          props.einsatz.id
      )
    },
  )
}

function istFahrzeugFrei(fahrzeug) {
  return (
    fahrzeug.status === 1 ||
    fahrzeug.status === 2
  )
}

function istFahrzeugGesperrt(fahrzeug) {
  // Abgeschlossener Einsatz
  if (
    props.einsatz.status ===
    'abgeschlossen'
  ) {
    return true
  }

  // Fahrzeug wurde für diesen Einsatz
  // bereits alarmiert
  if (
    fahrzeug.einsatzId ===
    props.einsatz.id
  ) {
    return true
  }

  // Fahrzeug gehört zu einem anderen Einsatz
  if (
    fahrzeug.einsatzId !== null &&
    fahrzeug.einsatzId !==
      props.einsatz.id
  ) {
    return true
  }

  // Nur Status 1 und 2 neu disponierbar
  if (!istFahrzeugFrei(fahrzeug)) {
    return true
  }

  return false
}
</script>

<template>
  <section class="panel einsatzdetails">
    <div class="panel-kopf">
      <h2>
        Einsatz #{{ einsatz.id }}
      </h2>

      <span
        v-if="einsatz.stichwort"
        class="stichwort-badge"
      >
        {{ einsatz.stichwort }}
      </span>
    </div>

    <div class="detailblock">
      <label>Einsatzstichwort</label>

      <strong>
        {{
          einsatz.stichwort ||
          'Nicht vergeben'
        }}
      </strong>
    </div>

    <div class="detailblock">
      <label>Meldebild</label>

      <strong>
        {{ einsatz.meldung }}
      </strong>
    </div>

    <div class="detailblock">
      <label>Einsatzort</label>

      <strong>
        {{ einsatz.ort }}
      </strong>
    </div>

    <div class="detailblock">
      <label>Status</label>

      <strong>
        {{ einsatz.status }}
      </strong>
    </div>

    <div class="detailblock">
      <label>Bemerkung</label>

      <div class="detailtext">
        {{
          einsatz.bemerkung ||
          'Keine weiteren Informationen vorhanden.'
        }}
      </div>
    </div>

    <button
      class="bearbeitenbutton"
      @click="emit('bearbeiten', einsatz)"
    >
      ✎ Einsatz bearbeiten
    </button>

    <h3>Fahrzeuge disponieren</h3>

    <div class="fahrzeugauswahl">
      <button
        v-for="fahrzeug in fahrzeuge"
        :key="fahrzeug.id"
        class="fahrzeug"
        :class="{
          ausgewaehlt:
            istAusgewaehlt(fahrzeug.id),

          'nicht-verfuegbar':
            istFahrzeugGesperrt(fahrzeug),
        }"
        :disabled="
          istFahrzeugGesperrt(fahrzeug)
        "
        @click="
          emit(
            'fahrzeug-auswaehlen',
            fahrzeug,
          )
        "
      >
        <div>
          <strong>
            {{ fahrzeug.funkrufname }}
          </strong>

          <span>
            {{ fahrzeug.typ }}
          </span>
        </div>

        <div class="fahrzeug-rechts">
          <div class="status">
            Status {{ fahrzeug.status }}
          </div>

          <div
            class="verfuegbarkeit"
            :class="{
              verfuegbar:
                istFahrzeugFrei(
                  fahrzeug,
                ),
            }"
          >
            {{ fahrzeugHinweis(fahrzeug) }}
          </div>
        </div>
      </button>
    </div>

    <button
      class="alarmbutton"
      :disabled="
        !hatFahrzeugeZumAlarmieren()
      "
      @click="emit('alarmieren')"
    >
      {{
        einsatz.status === 'alarmiert'
          ? 'Weitere Fahrzeuge alarmieren'
          : 'Fahrzeuge alarmieren'
      }}
    </button>
  </section>
</template>