<script setup lang="ts">
const route = useRoute()
const setId = computed(() => (route.params.id as string).toUpperCase())





const { data: rawCards, error, status } = await useFetch<any[]>(() => `/sets/${setId.value}.json`, {
  lazy: true
})

const cards = computed(() => {
  return (rawCards.value || []).filter(card => {
    return card.type !== 'leader' && card.type !== 'base'
  })
})

interface Card {
  id: string
  name: string
  art: string
  [key: string]: any
}

const hoveredCard = ref<Card | null>(null)
const popupPosition = ref({ top: 0, left: 0 })

const showPopup = (card: any, event: MouseEvent) => {
  hoveredCard.value = card
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  
  // Card aspect ratio is roughly 2.5/3.5
  // Popup width 400px -> Height ~ 560px
  const popupHeight = 400 * (3.5/2.5)
  
  let left = rect.right + 20
  // Center vertically relative to the card
  let top = rect.top + (rect.height / 2) - (popupHeight / 2)
  
  // Flip to left if not enough space on right
  if (left + 400 > window.innerWidth) {
    left = rect.left - 420
  }
  
  // Keep within vertical viewport bounds
  if (top < 10) top = 10
  if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10
  
  popupPosition.value = { top, left }

}

const toggleCard = (event: MouseEvent) => {
  const el = event.currentTarget as HTMLElement
  el.classList.toggle('card-is-selected')
}
</script>

<template>
  <div class="space-y-8">


    <!-- Loading Skeleton -->
    <div v-if="status === 'pending'" class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8">
      <div
        v-for="n in 12"
        :key="n"
        class="rounded-lg overflow-hidden border border-swu-800 shadow-md bg-swu-800 animate-pulse w-full aspect-[2.5/3.5]"
      ></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500">
      Unable to load cards for this set.
    </div>

    <!-- Cards Layout -->
    <div v-else-if="cards && cards.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 transition-all duration-300">
      <div
        v-for="card in cards"
        :key="card.id"
        class="card relative group rounded-lg overflow-hidden border shadow-md transition-transform hover:scale-105 cursor-pointer w-full aspect-[2.5/3.5] bg-swu-900"
        @mouseenter="showPopup(card, $event)"
        @mouseleave="hoveredCard = null"
        @click="toggleCard($event)"
      >
        <img
          :src="card.art"
          :alt="card.name"
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-slate-400">
      No cards found for this set.
    </div>

    <!-- Hover Popup -->
    <div
      v-if="hoveredCard"
      class="fixed z-50 pointer-events-none transition-all duration-150 ease-out"
      :style="{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }"
    >
      <div class="relative shadow-2xl rounded-3xl overflow-hidden border-2 border-slate-700 bg-swu-900">
        <img
          :src="hoveredCard.art"
          :alt="hoveredCard.name"
          class="w-[400px] object-contain"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  @apply border-swu-800;
}

.card:hover {
  @apply border-swu-primary ring-2 ring-swu-primary/50;
}

.card-is-selected {
  @apply ring-4 ring-swu-accent border-swu-accent shadow-[0_0_15px_rgba(137,179,230,0.5)];
}

.card-is-selected:hover {
  @apply border-swu-accent ring-4 ring-swu-accent;
}
</style>
