<script setup lang="ts">
const route = useRoute()
const setId = computed(() => (route.params.id as string).toUpperCase())






const { data: rawCards, error, status } = await useAsyncData(
  `sealed-pool-${setId.value}`,
  () => generateSealedPool(setId.value),
  {
    lazy: true
  }
)

const processedCards = computed(() => {
  return (rawCards.value || []).map((card, index) => ({
    ...card,
    uniqueId: `${card.id}-${index}`
  }))
})

const poolCards = computed(() => {
  return processedCards.value
    .filter(card => card.type !== 'leader' && card.type !== 'base')
    .sort((a, b) => a.number - b.number)
})

const showOutOfAspect = ref(false)

const selectedLeader = computed(() => leaders.value.find(l => l.uniqueId === selectedLeaderId.value))
const selectedBase = computed(() => bases.value.find(b => b.uniqueId === selectedBaseId.value))

const cards = computed(() => {
  if (showOutOfAspect.value) {
    return poolCards.value
  }

  const allowedAspects = new Set<string>()
  if (selectedLeader.value?.aspects) {
    selectedLeader.value.aspects.forEach((a: string) => allowedAspects.add(a))
  }
  if (selectedBase.value?.aspects) {
    selectedBase.value.aspects.forEach((a: string) => allowedAspects.add(a))
  }

  return poolCards.value.filter(card => {
    // Neutral cards (no aspects) are always compatible
    if (!card.aspects || card.aspects.length === 0) return true
    
    // Check if we have enough aspect icons for the card
    // Clone the available aspects to consume them as we match
    // actually, we just need to check counts.
    const needed = new Map<string, number>()
    for (const a of card.aspects) {
      needed.set(a, (needed.get(a) || 0) + 1)
    }

    const available = new Map<string, number>()
    if (selectedLeader.value?.aspects) {
      selectedLeader.value.aspects.forEach((a: string) => available.set(a, (available.get(a) || 0) + 1))
    }
    if (selectedBase.value?.aspects) {
      selectedBase.value.aspects.forEach((a: string) => available.set(a, (available.get(a) || 0) + 1))
    }
    
    for (const [aspect, count] of needed) {
      if ((available.get(aspect) || 0) < count) {
        return false // Not enough icons of this aspect
      }
    }
    
    return true
  })
})

const leaders = computed(() => {
  return processedCards.value
    .filter(card => card.type === 'leader')
    .sort((a, b) => a.number - b.number)
})

const bases = computed(() => {
  return processedCards.value
    .filter(card => card.type === 'base')
    .sort((a, b) => a.number - b.number)
})

interface Card {
  id: string
  uniqueId: string
  name: string
  art: string
  aspects: string[]
  [key: string]: any
}

const hoveredCard = ref<Card | null>(null)
const popupPosition = ref({ top: 0, left: 0 })

const showPopup = (card: any, event: MouseEvent) => {
  hoveredCard.value = card
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  
  // Card aspect ratio is roughly 2.5/3.5
  // Popup width 300px -> Height ~ 420px
  const popupHeight = 300 * (3.5/2.5)
  
  let left = rect.right + 20
  // Center vertically relative to the card
  let top = rect.top + (rect.height / 2) - (popupHeight / 2)
  
  // Flip to left if not enough space on right
  if (left + 300 > window.innerWidth) {
    left = rect.left - 320
  }
  
  // Keep within vertical viewport bounds
  if (top < 10) top = 10
  if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10
  
  popupPosition.value = { top, left }

}

const selectedCardIds = ref<Set<string>>(new Set())

const toggleCard = (uniqueId: string) => {
  if (selectedCardIds.value.has(uniqueId)) {
    selectedCardIds.value.delete(uniqueId)
  } else {
    selectedCardIds.value.add(uniqueId)
  }
}

const selectedLeaderId = ref<string | null>(null)

const toggleLeader = (uniqueId: string) => {
  if (selectedLeaderId.value === uniqueId) {
    selectedLeaderId.value = null
  } else {
    selectedLeaderId.value = uniqueId
  }
}

const selectedBaseId = ref<string | null>(null)

const toggleBase = (uniqueId: string) => {
  if (selectedBaseId.value === uniqueId) {
    selectedBaseId.value = null
  } else {
    selectedBaseId.value = uniqueId
  }
}

watch([selectedLeaderId, selectedBaseId], () => {
  showOutOfAspect.value = false
  selectedCardIds.value.clear()
})
</script>

<template>
  <div class="space-y-8">


    <!-- Loading Skeleton -->
    <div v-if="status === 'pending'" class="space-y-8">
      <!-- Leaders Skeleton -->
      <div>
         <h2 class="text-2xl font-bold text-gray-100 mb-4">Select a Leader</h2>
         <div class="flex flex-wrap gap-8 justify-start">
            <div
              v-for="n in 6"
              :key="`leader-skeleton-${n}`"
              class="rounded-lg overflow-hidden border border-swu-800 shadow-md bg-swu-800 animate-pulse w-full max-w-[300px] aspect-[3.5/2.5]"
            ></div>
         </div>
      </div>

      <!-- Bases Skeleton -->
      <div>
         <h2 class="text-2xl font-bold text-gray-100 mb-4">Select a Base</h2>
         <div class="flex flex-wrap gap-8 justify-start">
            <div
              v-for="n in 6"
              :key="`base-skeleton-${n}`"
              class="rounded-lg overflow-hidden border border-swu-800 shadow-md bg-swu-800 animate-pulse w-full max-w-[300px] aspect-[3.5/2.5]"
            ></div>
         </div>
      </div>

      <!-- Cards Skeleton -->
      <div>
        <h2 class="text-2xl font-bold text-gray-100 mb-4">Select your Cards</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8">
          <div
            v-for="n in 12"
            :key="`card-skeleton-${n}`"
            class="rounded-lg overflow-hidden border border-swu-800 shadow-md bg-swu-800 animate-pulse w-full aspect-[2.5/3.5]"
          ></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-500">
      Unable to load cards for this set.
    </div>

    <div v-else class="space-y-8">
      <!-- Leaders Layout -->
      <div v-if="leaders && leaders.length > 0">
        <h2 class="text-2xl font-bold text-gray-100 mb-4">Select a Leader</h2>
        <div class="flex flex-wrap gap-8 justify-start">
          <div
            v-for="card in leaders"
            :key="card.uniqueId"
            class="card relative group rounded-lg overflow-hidden border shadow-md transition-transform hover:scale-105 cursor-pointer w-full max-w-[300px] aspect-[3.5/2.5] bg-swu-900"
            :class="{ 'card-is-selected': selectedLeaderId === card.uniqueId }"
            @click="toggleLeader(card.uniqueId)"
          >
            <img
              :src="card.art"
              :alt="card.name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Bases Layout -->
      <div v-if="bases && bases.length > 0">
        <h2 class="text-2xl font-bold text-gray-100 mb-4">Select a Base</h2>
        <div class="flex flex-wrap gap-8 justify-start">
          <div
            v-for="card in bases"
            :key="card.uniqueId"
            class="card relative group rounded-lg overflow-hidden border shadow-md transition-transform hover:scale-105 cursor-pointer w-full max-w-[300px] aspect-[3.5/2.5] bg-swu-900"
            :class="{ 'card-is-selected': selectedBaseId === card.uniqueId }"
            @click="toggleBase(card.uniqueId)"
          >
            <img
              :src="card.art"
              :alt="card.name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Other Cards Layout -->
      <div v-if="poolCards && poolCards.length > 0 && selectedLeaderId && selectedBaseId">
        <div class="flex flex-wrap items-center justify-between mb-4 gap-4">
          <h2 class="text-2xl font-bold text-gray-100">Select your Cards</h2>
          
          <label class="flex items-center space-x-2 cursor-pointer group select-none">
            <input 
              type="checkbox" 
              v-model="showOutOfAspect" 
              class="w-5 h-5 rounded border-gray-600 bg-gray-800 text-swu-primary focus:ring-swu-primary focus:ring-offset-gray-900"
            >
            <span class="text-gray-300 group-hover:text-white transition-colors">Show out of aspect cards</span>
          </label>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 transition-all duration-300">
          <div
            v-for="card in cards"
            :key="card.uniqueId"
            class="card relative group rounded-lg overflow-hidden border shadow-md transition-transform hover:scale-105 cursor-pointer w-full aspect-[2.5/3.5] bg-swu-900"
            :class="{ 'card-is-selected': selectedCardIds.has(card.uniqueId) }"
            @mouseenter="showPopup(card, $event)"
            @mouseleave="hoveredCard = null"
            @click="toggleCard(card.uniqueId)"
            >
            <img
              :src="card.art"
              :alt="card.name"
              loading="lazy"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="(!cards || cards.length === 0) && (!leaders || leaders.length === 0)" class="text-center text-slate-400">
        No cards found for this set.
      </div>
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
          class="w-[300px] object-contain"
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
