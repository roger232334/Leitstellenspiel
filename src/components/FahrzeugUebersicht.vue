<script setup>
defineProps({
  fahrzeuge: {
    type: Array,
    required: true,
  },
})

function statusText(status) {
  switch (status) {
    case 1:
      return 'Einsatzbereit über Funk'

    case 2:
      return 'Einsatzbereit auf Wache'

    case 3:
      return 'Einsatz übernommen / Anfahrt'

    case 4:
      return 'Am Einsatzort'

    case 7:
      return 'Patient aufgenommen / Transport'

    case 8:
      return 'Am Transportziel'

    default:
      return 'Unbekannt'
  }
}
</script>

<template>
  <section class="panel">
    <div class="panel-kopf">
      <h2>Fahrzeugübersicht</h2>
    </div>

    <div class="fahrzeugliste">
      <div
        v-for="fahrzeug in fahrzeuge"
        :key="fahrzeug.id"
        class="fahrzeugkarte"
      >
        <div>
          <strong>
            {{ fahrzeug.funkrufname }}
          </strong>

          <span>
            {{ fahrzeug.typ }}
          </span>
        </div>

        <div class="fahrzeugstatus">
          <span
            class="statusnummer"
            :class="'status-' + fahrzeug.status"
          >
            {{ fahrzeug.status }}
          </span>

          <div class="fahrzeugstatus-text">
            <span>
              {{ statusText(fahrzeug.status) }}
            </span>

            <small
              v-if="
                fahrzeug.einsatzId !== null &&
                fahrzeug.naechsterStatusIn > 0
              "
            >
              Nächste Meldung in
              {{ fahrzeug.naechsterStatusIn }} s
            </small>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>