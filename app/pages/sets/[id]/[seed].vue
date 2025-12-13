<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

interface Card {
  id: string
  uniqueId: string
  name: string
  title?: string
  art: string
  aspects: string[]
  cost?: number
  number: number
  type: string
  rarity: string
  arena?: string
  [key: string]: any
}
const route = useRoute()
const router = useRouter()
const setId = computed(() => (route.params.id as string).toUpperCase())

// 1. Determine the seed from the route param
// This computed property automatically updates when the route param changes
const seed = computed(() => route.params.seed as string)

useSeoMeta({
  robots: () => ['SEC', 'LOF'].includes(setId.value) ? 'noindex, nofollow' : 'index, follow'
})

const { data: rawCards, error, status } = await useAsyncData(
  `sealed-pool-${setId.value}-${seed.value}`,
  () => generateSealedPool(setId.value, seed.value),
  {
    lazy: true,
    watch: [seed]
  }
)

const regeneratePool = () => {
  const newSeed = Math.random().toString(36).substring(7)
  router.push(`/sets/${setId.value}/${newSeed}`)
  resetOptions()
}

const processedCards = computed<Card[]>(() => {
  return (rawCards.value || []).map((card: any, index: number) => ({
    ...card,
    uniqueId: `${card.id}-${index}`
  }))
})

const sortBy = ref<'number' | 'cost'>('number')

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

const selectedLeader = computed(() => leaders.value.find(l => l.uniqueId === selectedLeaderId.value))
const selectedBase = computed(() => bases.value.find(b => b.uniqueId === selectedBaseId.value))

const cards = computed(() => {
  // Show all cards by default if neither leader nor base is selected
  if (!selectedLeader.value && !selectedBase.value) {
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


const hoveredCard = ref<Card | null>(null)
const popupPosition = ref({ top: 0, left: 0, width: 300, height: 420 })
let hoverTimeout: any

const hidePopup = () => {
  clearTimeout(hoverTimeout)
  hoveredCard.value = null
}

const showPopup = (card: any, event: MouseEvent) => {
  if (window.matchMedia('(hover: none)').matches) return

  clearTimeout(hoverTimeout)
  const target = event.currentTarget as HTMLElement

  hoverTimeout = setTimeout(() => {
    hoveredCard.value = card
    const rect = target.getBoundingClientRect()

    const isLandscape = card.type === 'leader' || card.type === 'base'
    // Standard card aspect ratio is 2.5:3.5 (width:height). So height = width * (3.5/2.5).
    // Landscape card aspect ratio is 3.5:2.5 (width:height). So height = width * (2.5/3.5).
    const ratio = isLandscape ? (2.5 / 3.5) : (3.5 / 2.5) // height / width
    // Popup width is consistent, height varies
    const popupWidth = isLandscape ? 450 : 300
    const popupHeight = popupWidth * ratio

    let left = rect.right + 20
    // Center vertically relative to the card/list item
    let top = rect.top + (rect.height / 2) - (popupHeight / 2)

    // Flip to left if not enough space on right
    if (left + popupWidth > window.innerWidth) {
      left = rect.left - (popupWidth + 20)
    }

    // Keep within vertical viewport bounds
    if (top < 10) top = 10
    if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 10

    // Ensure we don't cover the cursor/element if flipped
    if (left < 0) left = 20;

    popupPosition.value = { top, left, width: popupWidth, height: popupHeight }
  }, 50)

}



const selectedCardIds = ref<Set<string>>(new Set())

const toggleCard = (uniqueId: string) => {
  if (!selectedLeaderId.value || !selectedBaseId.value) return

  const newSet = new Set(selectedCardIds.value)
  if (newSet.has(uniqueId)) {
    newSet.delete(uniqueId)
  } else {
    newSet.add(uniqueId)
  }
  selectedCardIds.value = newSet
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

const resetOptions = () => {
  selectedLeaderId.value = null
  selectedBaseId.value = null
  selectedCardIds.value = new Set()
  sortBy.value = 'number'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Automatically switch to sort by cost when both leader and base are selected
watch([selectedLeaderId, selectedBaseId], ([newLeader, newBase]) => {
  if (newLeader && newBase) {
    sortBy.value = 'cost'
  } else {
    sortBy.value = 'number'
  }
})

// Watch for changes in the displayed card list (initial load or filter change)
watch(cards, (newCards) => {
  const newSet = new Set<string>()
  newCards.forEach(card => newSet.add(card.uniqueId))
  selectedCardIds.value = newSet
}, { immediate: true })

const isCopied = ref(false)

const copyDeck = async () => {
  if (!selectedLeader.value || !selectedBase.value) return

  const deckName = `${selectedLeader.value.name} - ${selectedBase.value.name}`
  const leaderId = selectedLeader.value.id.replace('-', '_')
  const baseId = selectedBase.value.id.replace('-', '_')

  // Get selected cards
  const deckList = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))

  // Group by ID to get counts
  const cardCounts = new Map<string, number>()
  for (const card of deckList) {
    const id = card.id.replace('-', '_')
    cardCounts.set(id, (cardCounts.get(id) || 0) + 1)
  }

  const deck = []
  for (const [id, count] of cardCounts) {
    deck.push({ id, count })
  }

  const exportData = {
    metadata: {
      name: deckName
    },
    leader: {
      id: leaderId,
      count: 1
    },
    base: {
      id: baseId,
      count: 1
    },
    deck: deck
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    isCopied.value = true
    setTimeout(() => isCopied.value = false, 2000)
  } catch (e) {
    console.error('Clipboard failed', e)
  }
}

const isPoolLinkCopied = ref(false)

const copyPoolLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    isPoolLinkCopied.value = true
    setTimeout(() => isPoolLinkCopied.value = false, 2000)
  } catch (e) {
    console.error('Failed to copy pool link', e)
  }
}

const showStats = ref(false)

const statsByCostAndType = computed(() => {
  const selected = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))
  const data = {
    unit: Array(8).fill(0),
    event: Array(8).fill(0),
    upgrade: Array(8).fill(0)
  }

  selected.forEach(card => {
    let cost = card.cost ?? 0
    if (cost > 7) cost = 7

    if (card.type === 'unit') {
      data.unit[cost]++
    } else if (card.type === 'event') {
      data.event[cost]++
    } else if (card.type === 'upgrade') {
      data.upgrade[cost]++
    }
  })

  return data
})

const arenaStats = computed(() => {
  const selected = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))
  const units = selected.filter(c => c.type === 'unit')

  const space = units.filter(u => u.arena === 'space').length
  const ground = units.filter(u => u.arena === 'ground').length

  return { space, ground }
})

const traitStats = computed(() => {
  const selected = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))
  const traits = new Map<string, number>()

  selected.forEach(card => {
    if (card.traits) {
      card.traits.forEach((trait: string) => {
        traits.set(trait, (traits.get(trait) || 0) + 1)
      })
    }
  })

  // Sort by count descending and take top 10
  return Array.from(traits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
})

const aspectStats = computed(() => {
  const selected = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))
  const aspects = new Map<string, number>()

  selected.forEach(card => {
    if (card.aspects) {
      card.aspects.forEach((aspect: string) => {
        aspects.set(aspect, (aspects.get(aspect) || 0) + 1)
      })
    }
  })

  return Array.from(aspects.entries()).sort((a, b) => b[1] - a[1])
})

const chartData = computed(() => {
  return {
    labels: ['Cost 0', 'Cost 1', 'Cost 2', 'Cost 3', 'Cost 4', 'Cost 5', 'Cost 6', 'Cost 7+'],
    datasets: [
      {
        label: 'Units',
        backgroundColor: '#60a5fa',
        data: statsByCostAndType.value.unit,
        stack: 'total'
      },
      {
        label: 'Events',
        backgroundColor: '#2563eb',
        data: statsByCostAndType.value.event,
        stack: 'total'
      },
      {
        label: 'Upgrades',
        backgroundColor: '#1e3a8a',
        data: statsByCostAndType.value.upgrade,
        stack: 'total'
      }
    ]
  }
})

const arenaChartData = computed(() => {
  return {
    labels: ['Ground', 'Space'],
    datasets: [
      {
        backgroundColor: ['#60a5fa', '#1e3a8a'],
        borderColor: ['#3b82f6', '#172554'],
        borderWidth: 1,
        data: [arenaStats.value.ground, arenaStats.value.space]
      }
    ]
  }
})

const traitChartData = computed(() => {
  return {
    labels: traitStats.value.map(s => s[0]),
    datasets: [
      {
        label: 'Count',
        backgroundColor: '#6694ce',
        borderColor: '#6694ce',
        borderWidth: 1,
        borderRadius: 4,
        data: traitStats.value.map(s => s[1])
      }
    ]
  }
})


const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#9ca3af',
        usePointStyle: true,
        boxWidth: 8
      }
    },
    tooltip: {
      titleColor: '#fff',
      bodyColor: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context: any) => ` ${context.raw}`
      }
    }
  },
  scales: {
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        color: '#9ca3af',
        font: {
          family: 'monospace'
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    x: {
      stacked: true,
      ticks: {
        color: '#e5e7eb',
        font: {
          weight: 'bold' as const
        }
      },
      grid: {
        display: false
      }
    }
  }
}

const arenaChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        color: '#9ca3af',
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      titleColor: '#fff',
      bodyColor: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context: any) => ` ${context.raw}`
      }
    }
  }
}

const traitChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      titleColor: '#fff',
      bodyColor: '#fff',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context: any) => ` ${context.raw}`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        color: '#9ca3af',
        font: {
          family: 'monospace'
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    y: {
      ticks: {
        color: '#e5e7eb',
        autoSkip: false,
        font: {
          size: 10,
          weight: 'bold' as const
        }
      },
      grid: {
        display: false
      }
    }
  }
}



const mouseX = ref(0)
const mouseY = ref(0)
const updateMousePos = (e: MouseEvent) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
}

let scrollTimeout: any
const handleScroll = () => {
  if (hoveredCard.value) {
    hoveredCard.value = null
  }

  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const el = document.elementFromPoint(mouseX.value, mouseY.value)
    if (!el) return

    const cardEl = el.closest('[data-unique-id]') as HTMLElement
    if (cardEl) {
      const uniqueId = cardEl.getAttribute('data-unique-id')
      const card = processedCards.value.find(c => c.uniqueId === uniqueId)
      if (card) {
        showPopup(card, { currentTarget: cardEl } as any)
      }
    }
  }, 100)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showStats.value) {
    showStats.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('mousemove', updateMousePos, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('mousemove', updateMousePos)
  clearTimeout(scrollTimeout)
})

</script>

<template>
  <div class="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)] -mt-8 pt-1">

    <!-- Permanent Sidebar: Leaders & Bases -->
    <aside class="md:w-80 flex-shrink-0 relative mt-5">
      <div @scroll.passive="handleScroll"
        class="sticky top-[5.5rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-swu-900/50 backdrop-blur-sm rounded-xl border border-swu-primary/20 p-4 shadow-lg custom-scrollbar">


        <!-- Reroll & Copy Section -->
        <div class="mb-6 flex gap-2">
          <button @click="regeneratePool"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span class="text-xs tracking-wide">New Pool</span>
          </button>

          <button @click="copyPoolLink"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative"
            :title="isPoolLinkCopied ? 'Link Copied!' : 'Copy Pool Link'">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <svg v-if="!isPoolLinkCopied" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              stroke-width="1.5" stroke="currentColor"
              class="w-4 h-4 group-hover:scale-110 transition-transform duration-500">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-4 h-4 animate-bounce text-emerald-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span class="text-xs tracking-wide">{{ isPoolLinkCopied ? 'Copied!' : 'Copy Pool' }}</span>
          </button>
        </div>

        <!-- Leaders Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">Leaders</h3>
          </div>

          <div v-if="leaders && leaders.length > 0" class="space-y-1">
            <div v-for="card in leaders" :key="card.uniqueId" :data-unique-id="card.uniqueId"
              class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
              :class="[
                selectedLeaderId === card.uniqueId
                  ? 'bg-swu-primary/20 text-white border-swu-primary/50 shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/10'
              ]" @click="toggleLeader(card.uniqueId)" @mouseenter="showPopup(card, $event)" @mouseleave="hidePopup">
              <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <span class="truncate text-sm font-medium">{{ card.name }}</span>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                <div v-for="aspect in card.aspects" :key="aspect" :title="aspect">
                  <img :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 py-4 text-center">No leaders found</div>
        </div>

        <!-- Bases Section -->
        <div>
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">Bases</h3>
          </div>

          <div v-if="bases && bases.length > 0" class="space-y-1">
            <div v-for="card in bases" :key="card.uniqueId" :data-unique-id="card.uniqueId"
              class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
              :class="[
                selectedBaseId === card.uniqueId
                  ? 'bg-swu-primary/20 text-white border-swu-primary/50 shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/10'
              ]" @click="toggleBase(card.uniqueId)" @mouseenter="showPopup(card, $event)" @mouseleave="hidePopup">
              <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <span class="truncate text-sm font-medium">{{ card.name }}</span>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                <div v-for="aspect in card.aspects" :key="aspect" :title="aspect">
                  <img :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 py-4 text-center">No bases found</div>
        </div>

      </div>
    </aside>

    <!-- Main Content Area: Deck Building -->
    <div class="flex-1 min-w-0">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-8">
        <div class="animate-pulse flex flex-col gap-4">
          <div class="h-8 bg-swu-800 rounded w-1/3"></div>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            <div v-for="n in 12" :key="n" class="aspect-[2.5/3.5] bg-swu-800 rounded-lg"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-8 h-8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Failed to load cards</h3>
        <p class="text-gray-400">Unable to generate the sealed pool for this set.</p>
      </div>

      <!-- Cards Deck -->
      <div v-else>
        <div
          class="flex flex-wrap items-center justify-end mb-2 gap-4 sticky top-[5rem] z-30 pointer-events-none -mx-2 px-2 md:pt-2 pt-0 md:pb-5 pb-4">

          <div
            class="flex flex-wrap items-center gap-2 pointer-events-auto bg-swu-900/80 backdrop-blur rounded-xl p-2 border border-white/5 shadow-2xl">
            <!-- Copy Deck Button -->
            <Transition name="horizontal-slide">
              <button v-if="selectedLeaderId && selectedBaseId && selectedCardIds.size >= 30" @click="copyDeck"
                class="h-8 flex items-center gap-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95">
                <svg v-if="!isCopied" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="w-4 h-4 animate-bounce">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {{ isCopied ? 'Copied!' : '.json' }}
              </button>
            </Transition>

            <Transition name="horizontal-slide">
              <div v-if="selectedLeaderId && selectedBaseId" class="flex items-center gap-2">
                <div class="font-mono font-bold text-xs text-white flex items-center h-8">
                  {{ selectedCardIds.size }} / {{ cards.length }}
                </div>

                <button @click="showStats = !showStats"
                  class="h-8 w-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  :class="{ 'text-swu-primary bg-white/10': showStats }" title="Deck Statistics">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </button>
              </div>
            </Transition>

            <div class="flex items-center bg-swu-900 rounded-lg border border-swu-800 p-0.5 h-8">
              <button @click="sortBy = 'number'"
                class="h-full px-2 rounded-md text-[10px] font-medium transition-colors flex items-center"
                :class="sortBy === 'number' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'">
                NUM
              </button>
              <button @click="sortBy = 'cost'"
                class="h-full px-2 rounded-md text-[10px] font-medium transition-colors flex items-center"
                :class="sortBy === 'cost' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'">
                COST
              </button>
            </div>

            <button @click="resetOptions" :disabled="!selectedLeaderId && !selectedBaseId"
              class="h-8 flex items-center px-2 rounded-lg text-xs font-medium transition-colors border" :class="(!selectedLeaderId && !selectedBaseId)
                ? 'opacity-50 cursor-not-allowed border-white/5 text-gray-500 bg-white/5'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border-red-500/20'"
              title="Reset Selection">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>

          </div>
        </div>

        <div v-if="cards && cards.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 pb-20">
          <div v-for="card in cards" :key="card.uniqueId" :data-unique-id="card.uniqueId"
            class="relative group rounded-2xl overflow-hidden border border-white/10 shadow-md transition-transform duration-200 deck-card-hover-scale aspect-[2.5/3.5] bg-swu-900"
            :class="[
              selectedCardIds.has(card.uniqueId)
                ? 'opacity-100 shadow-lg scale-[1.02]'
                : 'opacity-40 grayscale',
              (selectedLeaderId && selectedBaseId) ? 'cursor-pointer' : 'cursor-not-allowed'
            ]" @mouseenter="showPopup(card, $event)" @mouseleave="hidePopup" @click="toggleCard(card.uniqueId)">
            <img :src="card.art" :alt="card.name" loading="lazy" class="w-full h-full object-cover" />
          </div>
        </div>
        <div v-else class="text-center text-slate-400 py-20 flex flex-col items-center">
          <div class="mb-4 text-4xl opacity-50">🃏</div>
          <p class="text-lg">No compatible cards available.</p>
        </div>
      </div>
    </div>

    <!-- Hover Popup -->
    <div v-if="hoveredCard" class="fixed z-50 pointer-events-none transition-all duration-150 ease-out"
      :style="{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }">
      <div
        class="relative shadow-2xl rounded-2xl overflow-hidden border border-swu-primary/30 bg-swu-900 elevation-high">
        <img :src="hoveredCard.art" :alt="hoveredCard.name" class="object-contain"
          :style="{ width: `${popupPosition.width}px`, height: `${popupPosition.height}px` }" />
      </div>
    </div>

    <!-- Stats Overlay -->
    <Transition name="fade">
      <div v-if="showStats"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showStats = false">
        <div
          class="bg-swu-900 border border-swu-primary/30 rounded-2xl p-6 shadow-2xl w-full max-w-4xl flex flex-col relative elevation-high max-h-[90vh] overflow-y-auto">
          <button @click="showStats = false"
            class="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6 text-swu-primary">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            Deck Statistics
          </h3>
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 flex flex-col min-h-[300px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                Cost Curve</h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <div class="flex-1 flex flex-col min-h-[300px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                Top Traits
              </h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Bar :data="traitChartData" :options="traitChartOptions" />
              </div>
            </div>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[200px]">
            <div class="flex flex-col h-[200px] md:h-full max-h-[200px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                Arena Breakdown
              </h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Pie :data="arenaChartData" :options="arenaChartOptions" />
              </div>
            </div>

            <div class="flex flex-col h-[200px] md:h-full">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                Aspects
              </h4>
              <div class="flex-1 relative min-h-0 w-full flex justify-center overflow-y-auto custom-scrollbar">
                <div class="w-full max-w-xs space-y-2">
                  <div v-for="[aspect, count] in aspectStats" :key="aspect"
                    class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors select-none cursor-default">
                    <div class="flex items-center gap-3">
                      <img :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-6 h-6 object-contain" />
                      <span class="text-sm font-medium capitalize text-gray-200">{{ aspect }}</span>
                    </div>
                    <span class="text-sm font-bold text-swu-primary">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.elevation-high {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}



@media (hover: hover) {


  .deck-card-hover-scale:hover {
    transform: scale(1.05);
  }
}

.horizontal-slide-enter-active,
.horizontal-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 300px;
  opacity: 1;
  overflow: hidden;
}

.horizontal-slide-enter-from,
.horizontal-slide-leave-to {
  opacity: 0;
  max-width: 0;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  transform: translateX(-10px);
}
</style>
