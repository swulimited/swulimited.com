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

const sortBy = ref<'number' | 'cost'>('cost')

const poolCards = computed(() => {
  const cards = processedCards.value
    .filter(card => card.type !== 'leader' && card.type !== 'base')
    
  return cards.sort((a, b) => {
    if (sortBy.value === 'cost') {
        const costA = a.cost ?? 0
        const costB = b.cost ?? 0
        if (costA !== costB) return costA - costB
    }
    return a.number - b.number
  })
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
  cost?: number
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
  
  // Ensure we don't cover the cursor/element if flipped
  if (left < 0) left = 20;

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

const selectAll = () => {
  const newSet = new Set(selectedCardIds.value)
  cards.value.forEach(card => newSet.add(card.uniqueId))
  selectedCardIds.value = newSet
}

const resetOptions = () => {
  selectedCardIds.value = new Set()
  sortBy.value = 'cost'
}

watch([selectedLeaderId, selectedBaseId], () => {
  showOutOfAspect.value = false
  selectedCardIds.value.clear()
})

// --- Navigation Logic ---
const currentStep = ref(1)
const steps = [
  { id: 1, label: 'Choose Leader', icon: '👑' },
  { id: 2, label: 'Choose Base', icon: '🏰' },
  { id: 3, label: 'Build Deck', icon: '🃏' }
]

const setStep = (stepId: number) => {
    currentStep.value = stepId
}

const LAYOUT_ORDER = ['vigilance', 'command', 'aggression', 'cunning', 'villainy', 'heroism'];

const combinedAspects = computed(() => {
    const aspects: string[] = [];
    
    if (selectedLeader.value?.aspects) {
        selectedLeader.value.aspects.forEach((a: string) => aspects.push(a));
    }
    
    if (selectedBase.value?.aspects) {
        selectedBase.value.aspects.forEach((a: string) => aspects.push(a));
    }
    
    return aspects.sort((a, b) => {
        return LAYOUT_ORDER.indexOf(a) - LAYOUT_ORDER.indexOf(b);
    });
});
</script>

<template>
  <div class="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-8rem)]">
    
    <!-- Sidebar Navigation -->
    <aside class="md:w-64 flex-shrink-0">
        <div class="sticky top-24 bg-swu-900/50 backdrop-blur-sm rounded-xl border border-swu-primary/20 p-4 shadow-lg">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Setup</h3>
            <nav class="space-y-2">
                <button 
                    v-for="step in steps" 
                    :key="step.id"
                    @click="setStep(step.id)"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left outline-none focus:ring-2 focus:ring-swu-primary/50"
                    :class="[
                        currentStep === step.id 
                            ? 'bg-swu-primary text-white shadow-md shadow-swu-primary/20 scale-[1.02]' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    ]"
                >
                    <span class="text-xl">{{ step.icon }}</span>
                    <span class="font-medium text-sm">{{ step.label }}</span>
                    
                    <!-- Status Indicators -->
                    <div class="ml-auto flex items-center" v-if="step.id === 1 && selectedLeaderId">
                        <span class="h-2 w-2 rounded-full bg-green-500 block shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                    </div>
                    <div class="ml-auto flex items-center" v-if="step.id === 2 && selectedBaseId">
                        <span class="h-2 w-2 rounded-full bg-green-500 block shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                    </div>
                     <div class="ml-auto text-xs font-mono text-gray-500" v-if="step.id === 3">
                        {{ selectedCardIds.size }}/30+
                    </div>
                </button>
            </nav>

            <div v-if="selectedLeader || selectedBase" class="mt-8 pt-6 border-t border-white/10 px-2 space-y-4">
                <div class="space-y-1" v-if="selectedLeader">
                    <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Leader</p>
                    <p class="text-sm font-medium text-white truncate" :title="selectedLeader.name">{{ selectedLeader.name }}</p>
                </div>
                <div class="space-y-1" v-if="selectedBase">
                     <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Base</p>
                    <p class="text-sm font-medium text-white truncate" :title="selectedBase.name">{{ selectedBase.name }}</p>
                </div>

                <div v-if="combinedAspects.length > 0" class="space-y-2">
                    <p class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Aspects</p>
                    <div class="flex flex-wrap gap-2">
                         <div 
                            v-for="(aspect, index) in combinedAspects" 
                            :key="`${aspect}-${index}`"
                            :title="aspect"
                         >
                            <img :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-8 h-8 object-contain" />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0">
        <!-- Loading Skeleton -->
        <div v-if="status === 'pending'" class="space-y-8">
            <div class="animate-pulse flex flex-col gap-4">
                <div class="h-8 bg-swu-800 rounded w-1/3"></div>
                <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
                    <div v-for="n in 6" :key="n" class="aspect-[2.5/3.5] bg-swu-800 rounded-lg"></div>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Failed to load cards</h3>
            <p class="text-gray-400">Unable to generate the sealed pool for this set.</p>
        </div>

        <!-- Content Steps -->
        <div v-else>
            
            <!-- Step 1: Leaders -->
            <div v-show="currentStep === 1">
                <header class="mb-6">
                    <h2 class="text-3xl font-bold text-white mb-2">Select your Leader</h2>
                    <p class="text-gray-400 text-sm">Choose the simulated leader for this sealed event.</p>
                </header>

                <div v-if="leaders && leaders.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
                    <div
                        v-for="card in leaders"
                        :key="card.uniqueId"
                        class="card relative group rounded-xl overflow-hidden border border-swu-800/50 shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer aspect-[3.5/2.5] bg-swu-900"
                        :class="{ 'card-is-selected ring-2 ring-swu-primary border-swu-primary shadow-swu-primary/20': selectedLeaderId === card.uniqueId }"
                        @click="toggleLeader(card.uniqueId)"
                    >
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        <img
                        :src="card.art"
                        :alt="card.name"
                        loading="lazy"
                        class="w-full h-full object-cover"
                        />

                    </div>
                </div>
                 <div v-else class="text-center text-slate-400 py-12 bg-white/5 rounded-xl border border-white/5">
                    No leaders found in your pool.
                </div>
            </div>

            <!-- Step 2: Bases -->
            <div v-show="currentStep === 2">
                <header class="mb-6">
                    <h2 class="text-3xl font-bold text-white mb-2">Select your Base</h2>
                    <p class="text-gray-400 text-sm">Choose the simulated base for this sealed event.</p>
                </header>

                <div v-if="bases && bases.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
                    <div
                        v-for="card in bases"
                        :key="card.uniqueId"
                         class="card relative group rounded-xl overflow-hidden border border-swu-800/50 shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer aspect-[3.5/2.5] bg-swu-900"
                        :class="{ 'card-is-selected ring-2 ring-swu-primary border-swu-primary shadow-swu-primary/20': selectedBaseId === card.uniqueId }"
                        @click="toggleBase(card.uniqueId)"
                    >
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        <img
                        :src="card.art"
                        :alt="card.name"
                        loading="lazy"
                        class="w-full h-full object-cover"
                        />

                    </div>
                </div>
                 <div v-else class="text-center text-slate-400 py-12 bg-white/5 rounded-xl border border-white/5">
                    No bases found in your pool.
                </div>
            </div>

            <!-- Step 3: Deck Building -->
            <div v-show="currentStep === 3">
                <div v-if="!selectedLeaderId || !selectedBaseId" class="flex flex-col items-center justify-center py-20 text-center bg-swu-900/50 rounded-2xl border border-dashed border-swu-700">
                    <div class="bg-swu-800 rounded-full p-4 mb-4">
                        <span class="text-4xl">🚧</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Setup Required</h3>
                    <p class="text-gray-400 max-w-md mb-6">Please select both a Leader and a Base to reveal your compatible card pool.</p>
                    <div class="flex gap-4">
                        <button @click="currentStep = 1" class="px-4 py-2 bg-swu-primary hover:bg-swu-primary/90 text-white rounded-lg transition-colors">
                            Select Leader
                        </button>
                        <button @click="currentStep = 2" class="px-4 py-2 bg-swu-800 hover:bg-swu-700 text-white rounded-lg transition-colors">
                            Select Base
                        </button>
                    </div>
                </div>

                <div v-else>
                    <div class="flex flex-wrap items-center justify-between mb-6 gap-4 sticky top-0 z-30 bg-swu-950/95 backdrop-blur -mx-2 px-2 border-b border-white/5">
                        <div>
                             <h2 class="text-3xl font-bold text-white mb-2">Build your Deck</h2>
                             <p class="text-gray-400 text-sm">Select at least 30 cards. Current: <span :class="selectedCardIds.size >= 30 ? 'text-green-400' : 'text-amber-400'">{{ selectedCardIds.size }}</span></p>
                        </div>
                        
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2 mr-2">
                                <button 
                                    @click="selectAll" 
                                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-swu-800 hover:bg-swu-700 text-white transition-colors border border-swu-700"
                                >
                                    Select All
                                </button>
                                <button 
                                    @click="resetOptions" 
                                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                                >
                                    Reset
                                </button>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400 font-medium">Sort by:</span>
                                <div class="flex items-center bg-swu-900 rounded-lg border border-swu-800 p-1">
                                    <button 
                                        @click="sortBy = 'number'"
                                        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        :class="sortBy === 'number' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'"
                                    >
                                        Card
                                    </button>
                                    <button 
                                        @click="sortBy = 'cost'"
                                        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        :class="sortBy === 'cost' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'"
                                    >
                                        Cost
                                    </button>
                                </div>
                            </div>

                            <label class="flex items-center space-x-3 cursor-pointer group select-none bg-swu-900 px-3 py-1.5 rounded-lg border border-swu-800 hover:border-swu-700 transition-colors">
                                <input 
                                type="checkbox" 
                                v-model="showOutOfAspect" 
                                class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-swu-primary focus:ring-swu-primary focus:ring-offset-gray-900"
                                >
                                <span class="text-gray-300 group-hover:text-white transition-colors text-xs font-medium">Show all cards</span>
                            </label>
                        </div>
                    </div>

                    <div v-if="cards && cards.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 pb-20">
                        <div
                            v-for="card in cards"
                            :key="card.uniqueId"
                            class="card relative group rounded-lg overflow-hidden border border-swu-800 shadow-md transition-all duration-200 hover:scale-105 cursor-pointer aspect-[2.5/3.5] bg-swu-900"
                            :class="{ 
                                'card-is-selected': selectedCardIds.has(card.uniqueId)
                            }"
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
                     <div v-else class="text-center text-slate-400 py-20">
                        No compatible cards found. Try enabling "Show all cards".
                    </div>
                </div>
            </div>

        </div>
    </div>
    
    <!-- Hover Popup -->
    <div
      v-if="hoveredCard"
      class="fixed z-50 pointer-events-none transition-all duration-150 ease-out"
      :style="{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }"
    >
      <div class="relative shadow-2xl rounded-2xl overflow-hidden border border-swu-primary/30 bg-swu-900 elevation-high">
        <img
          :src="hoveredCard.art"
          :alt="hoveredCard.name"
          class="w-[320px] object-contain"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.elevation-high {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Custom Scrollbar for sidebar if needed */
aside::-webkit-scrollbar {
    display: none;
}

.card-is-selected {
    @apply ring-2 ring-swu-primary border-swu-primary shadow-[0_0_15px_rgba(32,192,232,0.5)];
}
</style>
