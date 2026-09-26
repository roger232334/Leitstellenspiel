<script setup>
defineProps({
  ereignisse: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="ereignisprotokoll">
    <div class="ereignis-kopf">
      <h2>Systemchronik</h2>

      <span>
        {{ ereignisse.length }} Ereignisse
      </span>
    </div>

    <div class="ereignisliste">
      <div
        v-if="ereignisse.length === 0"
        class="keine-ereignisse"
      >
        Noch keine Ereignisse vorhanden.
      </div>

      <div
        v-for="ereignis in ereignisse"
        :key="ereignis.id"
        class="ereigniszeile"
        :class="ereignis.typ"
      >
        <span class="ereigniszeit">
          {{ ereignis.zeit }}
        </span>

        <span>
          {{ ereignis.text }}
        </span>
      </div>
    </div>
  </section>
</template>