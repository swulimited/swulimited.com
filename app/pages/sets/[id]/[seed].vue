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
import {
  ArrowPathIcon,
  LinkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  RectangleStackIcon,
  TrashIcon,
  XMarkIcon,
  HandRaisedIcon
} from '@heroicons/vue/24/outline'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

import type { Card as BoosterCard } from '~/utils/booster'

interface Card extends BoosterCard {
  uniqueId: string
}
const route = useRoute()
const router = useRouter()
const packConfig = computed(() => (route.params.id as string).toUpperCase())

// 1. Determine the seed from the route param
// This computed property automatically updates when the route param changes
const seed = computed(() => route.params.seed as string)

useSeoMeta({
  robots: 'noindex, nofollow'
})

const { data: rawCards, error, status } = await useAsyncData(
  `sealed-pool-${packConfig.value}-${seed.value}`,
  () => generateSealedPool(packConfig.value, seed.value),
  {
    lazy: true,
    watch: [seed]
  }
)

const regeneratePool = () => {
  const newSeed = Math.random().toString(36).substring(7)
  router.push(`/sets/${packConfig.value}/${newSeed}`)
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

const groupedLeaders = computed(() => {
  const map = new Map<string, { card: Card, count: number }>()
  for (const card of leaders.value) {
    const key = card.id
    if (!map.has(key)) {
      map.set(key, { card, count: 0 })
    }
    const entry = map.get(key)!
    entry.count++
  }
  return Array.from(map.values())
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
  if (window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches) return

  if (showDrawDialog.value) {
    const target = event.currentTarget as HTMLElement
    if (!target.closest('.draw-dialog-content')) return
  }

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
    await navigator.clipboard.writeText(JSON.stringify(exportData))
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
const showDrawDialog = ref(false)
const drawnHand = ref<Card[]>([])
const revealedCount = ref(0)

let revealInterval: any

const drawHand = () => {
  clearInterval(revealInterval)

  const deckList = processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId))
  const shuffled = [...deckList].sort(() => 0.5 - Math.random())
  const hand = shuffled.slice(0, 6)

  drawnHand.value = hand
  revealedCount.value = 0
  showDrawDialog.value = true

  const tick = () => {
    if (revealedCount.value < hand.length) {
      revealedCount.value++
    } else {
      clearInterval(revealInterval)
    }
  }

  tick()
  revealInterval = setInterval(tick, 20)
}

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



const mouseX = ref(-1000)
const mouseY = ref(-1000)
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
  if (e.key === 'Escape') {
    if (showStats.value) showStats.value = false
    if (showDrawDialog.value) showDrawDialog.value = false
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
        <div class="mb-3 flex gap-2">
          <button @click="regeneratePool"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span class="text-xs tracking-wide">New Pool</span>
          </button>

          <button @click="copyPoolLink"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative"
            :title="isPoolLinkCopied ? 'Link Copied!' : 'Copy Pool Link'">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <LinkIcon v-if="!isPoolLinkCopied"
              class="w-4 h-4 group-hover:scale-110 transition-transform duration-500" />
            <CheckIcon v-else class="w-4 h-4 animate-bounce text-emerald-400" />
            <span class="text-xs tracking-wide">{{ isPoolLinkCopied ? 'Copied!' : 'Copy Pool' }}</span>
          </button>
        </div>

        <!-- Selected Leader & Base Display -->
        <div class="grid grid-cols-2 gap-2 h-28 mb-2">
          <div class="relative group flex justify-center items-center h-full">
            <Transition mode="out-in" enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95">
              <div v-if="selectedLeader" key="leader-img"
                class="cursor-pointer w-full h-full flex justify-center items-center"
                @mouseenter="showPopup(selectedLeader, $event)" @mouseleave="hidePopup">
                <img :src="selectedLeader.art" :alt="selectedLeader.name"
                  class="w-full h-auto max-h-full object-contain rounded-lg shadow-md border border-swu-primary/30" />
              </div>
              <div v-else key="leader-placeholder"
                class="w-full h-auto aspect-[3.5/2.5] max-h-full rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs hover:border-white/20 transition-colors">
                Select Leader
              </div>
            </Transition>
          </div>

          <div class="relative group flex justify-center items-center h-full">
            <Transition mode="out-in" enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-150 ease-in" leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95">
              <div v-if="selectedBase" key="base-img"
                class="cursor-pointer w-full h-full flex justify-center items-center"
                @mouseenter="showPopup(selectedBase, $event)" @mouseleave="hidePopup">
                <img :src="selectedBase.art" :alt="selectedBase.name"
                  class="w-full h-auto max-h-full object-contain rounded-lg shadow-md border border-swu-primary/30" />
              </div>
              <div v-else key="base-placeholder"
                class="w-full h-auto aspect-[3.5/2.5] max-h-full rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs hover:border-white/20 transition-colors">
                Select Base
              </div>
            </Transition>
          </div>
        </div>

        <!-- Leaders Section -->
        <div class="mb-3 mt-5 md:mt-3">
          <div class="flex items-center justify-between mb-1 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">Leaders</h3>
          </div>



          <div v-if="groupedLeaders && groupedLeaders.length > 0" class="space-y-1">
            <div v-for="group in groupedLeaders" :key="group.card.uniqueId" :data-unique-id="group.card.uniqueId"
              class="flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
              :class="[
                selectedLeaderId === group.card.uniqueId
                  ? 'bg-swu-primary/20 text-white border-swu-primary/50 shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/10'
              ]" @click="toggleLeader(group.card.uniqueId)" @mouseenter="showPopup(group.card, $event)"
              @mouseleave="hidePopup">
              <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <span class="truncate text-sm font-medium">
                  {{ group.card.name }} <span v-if="group.count > 1" class="text-gray-500 ml-1">x{{ group.count
                  }}</span>
                </span>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                <div v-for="aspect in group.card.aspects" :key="aspect" :title="aspect">
                  <img :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 py-4 text-center">No leaders found</div>
        </div>

        <!-- Bases Section -->
        <div>
          <div class="flex items-center justify-between mb-1 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">Bases</h3>
          </div>



          <div v-if="bases && bases.length > 0" class="space-y-1">
            <div v-for="card in bases" :key="card.uniqueId" :data-unique-id="card.uniqueId"
              class="flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
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
          <ExclamationCircleIcon class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Failed to load cards</h3>
        <p class="text-gray-400">Unable to generate the sealed pool for this set.</p>
      </div>

      <!-- Cards Deck -->
      <div v-else>
        <div
          class="flex flex-wrap items-center justify-end mb-2 gap-4 sticky top-[5rem] z-30 pointer-events-none -mx-2 px-2 md:pt-2 pt-0 md:pb-5 pb-4">

          <div
            class="flex flex-nowrap overflow-x-auto items-center gap-1 pointer-events-auto bg-swu-900/80 backdrop-blur rounded-xl p-2 border border-white/5 shadow-2xl max-w-full custom-scrollbar">
            <!-- Copy Deck Button -->
            <Transition name="horizontal-slide">
              <button v-if="selectedLeaderId && selectedBaseId && selectedCardIds.size >= 30" @click="copyDeck"
                class="h-8 flex items-center gap-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 mr-2">
                <ClipboardDocumentIcon v-if="!isCopied" class="w-4 h-4" />
                <CheckIcon v-else class="w-4 h-4 animate-bounce" />
                {{ isCopied ? 'Copied!' : '.json' }}
              </button>
            </Transition>

            <Transition name="horizontal-slide">
              <div v-if="selectedLeaderId && selectedBaseId" class="flex items-center gap-1">
                <div class="font-mono font-bold text-xs text-white flex items-center h-8">
                  {{ selectedCardIds.size }}&nbsp;/&nbsp;{{ cards.length }}
                </div>

                <button @click="showStats = !showStats"
                  class="h-8 w-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  :class="{ 'text-swu-primary bg-white/10': showStats }" title="Deck Statistics">
                  <ChartBarIcon class="w-5 h-5" />
                </button>

                <button v-if="selectedCardIds.size >= 30" @click="drawHand"
                  class="h-8 w-8 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Test Opening Hand">
                  <HandRaisedIcon class="w-5 h-5" />
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
              <TrashIcon class="w-4 h-4" />
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
    <div v-if="hoveredCard" class="fixed z-[100] pointer-events-none transition-all duration-150 ease-out"
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
            <XMarkIcon class="w-6 h-6" />
          </button>
          <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ChartBarIcon class="w-6 h-6 text-swu-primary" />
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

    <!-- Draw Hand Dialog -->
    <Transition name="fade">
      <div v-if="showDrawDialog"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showDrawDialog = false">
        <div
          class="draw-dialog-content bg-swu-900 border border-swu-primary/30 rounded-2xl p-4 shadow-2xl w-full max-w-[900px] flex flex-col relative elevation-high max-h-[90vh] overflow-y-auto">
          <div class="absolute top-4 right-4 flex items-center gap-2">
            <button @click="drawHand" title="Redraw Hand"
              class="p-2 bg-swu-primary hover:bg-swu-primary-light text-white font-bold rounded-xl shadow-lg hover:shadow-swu-primary/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group">
              <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"
                stroke-width="2" />
            </button>
            <button @click="showDrawDialog = false"
              class="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HandRaisedIcon class="w-6 h-6 text-swu-primary" />
            Opening Hand
          </h3>

          <div v-if="drawnHand.length > 0" class="flex flex-wrap justify-center gap-2 mt-4 mb-4 min-h-[300px]">
            <div v-for="(card, index) in drawnHand" :key="card.uniqueId"
              class="relative rounded-xl overflow-hidden border border-white/10 shadow-md aspect-[2.5/3.5] bg-swu-900 w-32 md:w-56 flex-shrink-0">

              <Transition name="fade">
                <div v-if="index < revealedCount" key="image"
                  class="absolute inset-0 w-full h-full group cursor-pointer" @mouseenter="showPopup(card, $event)"
                  @mouseleave="hidePopup">
                  <img :src="card.art" :alt="card.name" class="w-full h-full object-cover" />
                </div>
                <div v-else key="skeleton" class="absolute inset-0 w-full h-full bg-swu-800/50 animate-pulse"></div>
              </Transition>
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
  height: 6px;
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

.card-reveal-enter-active,
.card-reveal-leave-active,
.card-reveal-move {
  transition: all 0.3s ease-out;
}

.card-reveal-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.card-reveal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Ensure leaving items are taken out of flow so move animation works correctly */
.card-reveal-leave-active {
  position: absolute;
}
</style>
