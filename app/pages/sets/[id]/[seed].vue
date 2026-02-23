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
import {
  ArrowPathIcon,
  LinkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  ChartBarIcon,
  TrashIcon,
  XMarkIcon,
  HandRaisedIcon,
  FunnelIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'



import type { Card as BoosterCard } from '~/utils/booster'

interface Card extends BoosterCard {
  uniqueId: string
}
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { $trackEvent } = useNuxtApp()

const isSidebarOpen = ref(true)

const getLocalValue = (card: Card | BoosterCard, key: keyof BoosterCard) => {
  if (card.localization) {
    const loc = card.localization.find((l: any) => l.locale === locale.value)
    if (loc && (loc as any)[key] !== undefined) return (loc as any)[key]
  }
  return (card as any)[key]
}

const getCardArt = (card: Card | BoosterCard) => getLocalValue(card, 'art') as string
const getCardName = (card: Card | BoosterCard) => getLocalValue(card, 'name') as string
const getCardTraits = (card: Card | BoosterCard) => getLocalValue(card, 'traits') as string[]
const getCardKeywords = (card: Card | BoosterCard) => getLocalValue(card, 'keywords') as string[]
const packConfig = computed(() => (route.params.id as string).toUpperCase())

// 1. Determine the seed from the route param
// This computed property automatically updates when the route param changes
const seed = computed(() => route.params.seed as string)

const setName = computed(() => {
  return packConfig.value
    .split('_')
    .filter(part => part !== 'SL')
    .map(part => part.split('-')[0])
    .join(' / ')
})

useSeoMeta({
  title: () => t('page_sealed', { set: setName.value }),
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
  $trackEvent('new_pool', { pool: 'reroll', set: packConfig.value })
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

const sortBy = ref<'number' | 'cost' | 'keyword'>('number')


const poolCards = computed(() => {
  const cards = processedCards.value
    .filter(card => card.type !== 'leader' && card.type !== 'base')

  return cards.sort((a, b) => {
    if (sortBy.value === 'cost') {
      const costA = a.cost ?? 0
      const costB = b.cost ?? 0
      if (costA !== costB) return costA - costB
    } else if (sortBy.value === 'keyword') {
      const kwA = (getCardKeywords(a) || [])[0] || 'zzzzzz'
      const kwB = (getCardKeywords(b) || [])[0] || 'zzzzzz'
      if (kwA !== kwB) return kwA.localeCompare(kwB)

      const aspectOrder = ['vigilance', 'command', 'aggression', 'cunning', 'villainy', 'heroism', 'neutral']
      const getAspectScore = (cardAspects: string[]) => {
          if (!cardAspects || cardAspects.length === 0) return '99'
          return cardAspects
            .map(a => {
              const idx = aspectOrder.indexOf(a)
              return idx === -1 ? 99 : idx
            })
            .sort((x, y) => x - y)
            .map(idx => idx.toString().padStart(2, '0'))
            .join(',')
      }
      const aspectA = getAspectScore(a.aspects || [])
      const aspectB = getAspectScore(b.aspects || [])
      if (aspectA !== aspectB) return aspectA.localeCompare(aspectB)

      const costA = a.cost ?? 0
      const costB = b.cost ?? 0
      if (costA !== costB) return costA - costB
    }
    return a.number - b.number
  })
})

const selectedLeader = computed(() => leaders.value.find(l => l.uniqueId === selectedLeaderId.value))
const selectedBase = computed(() => bases.value.find(b => b.uniqueId === selectedBaseId.value))



const getFilteredCards = (mode: 'auto' | 'custom', filterState: { aspects: Set<string>, traits: Set<string> }, currentLeader: any, currentBase: any) => {
  if (mode === 'custom') {
    return poolCards.value.filter(card => {
      let aspectMatch = false
      if (filterState.aspects.size > 0) {
        const isNeutral = !card.aspects || card.aspects.length === 0
        if (isNeutral) {
          aspectMatch = filterState.aspects.has('neutral')
        } else {
          aspectMatch = card.aspects.every(a => filterState.aspects.has((a || '').toLowerCase().trim()))
        }
      }

      let traitMatch = false
      if (filterState.traits.size > 0) {
        const cTraits = getCardTraits(card) || []
        traitMatch = cTraits.some((t: string) => filterState.traits.has(t))
      }

      if (filterState.aspects.size === 0 && filterState.traits.size === 0) return false
      return aspectMatch || traitMatch
    })
  }

  // Auto mode logic
  // If nothing is selected, show every card in the pool
  if (!currentLeader && !currentBase) return poolCards.value

  // Gather all aspects from selections
  const availableSet = new Map<string, number>()
  if (currentLeader && currentLeader.aspects) {
    currentLeader.aspects.forEach((a: string) => {
      const key = (a || '').toLowerCase().trim()
      if (key) availableSet.set(key, (availableSet.get(key) || 0) + 1)
    })
  }
  if (currentBase && currentBase.aspects) {
    currentBase.aspects.forEach((a: string) => {
      const key = (a || '').toLowerCase().trim()
      if (key) availableSet.set(key, (availableSet.get(key) || 0) + 1)
    })
  }

  return poolCards.value.filter(card => {
    // Neutral cards are always compatible
    const cardAspects = card.aspects || []
    if (cardAspects.length === 0) return true

    // Count required aspects for the card
    const needed = new Map<string, number>()
    cardAspects.forEach((a: string) => {
      const key = (a || '').toLowerCase().trim()
      if (key) needed.set(key, (needed.get(key) || 0) + 1)
    })

    // Case 1: Both leader and base are selected - strict "no penalty" matching
    if (currentLeader && currentBase) {
      for (const [aspect, count] of needed) {
        if ((availableSet.get(aspect) || 0) < count) return false
      }
      return true
    }

    // Case 2: Only one is selected - filter only what's definitely incompatible
    for (const [aspect, count] of needed) {
      const isAffiliation = aspect === 'villainy' || aspect === 'heroism'
      
      if (currentLeader) {
        // Leader check: Affiliation MUST match if present. 
        if (isAffiliation && (availableSet.get(aspect) || 0) < count) return false
      } else if (currentBase) {
        // Base check: Color MUST match if present.
        if (!isAffiliation && availableSet.has(aspect) && (availableSet.get(aspect) || 0) < count) return false
      }
    }

    return true
  })
}

const cards = computed(() => {
  return getFilteredCards(filterMode.value, customFilter, selectedLeader.value, selectedBase.value)
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
const selectedCards = computed(() => processedCards.value.filter(c => selectedCardIds.value.has(c.uniqueId)))

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
  selectedLeaderId.value = selectedLeaderId.value === uniqueId ? null : uniqueId
  filterMode.value = 'auto'
}

const selectedBaseId = ref<string | null>(null)

const toggleBase = (uniqueId: string) => {
  selectedBaseId.value = selectedBaseId.value === uniqueId ? null : uniqueId
  filterMode.value = 'auto'
}

// Filter State
const showFilterDialog = ref(false)
const filterMode = ref<'auto' | 'custom'>('auto')

const customFilter = reactive({
  aspects: new Set<string>(),
  traits: new Set<string>()
})

// Draft state for data entry in dialog
const draftFilterMode = ref<'auto' | 'custom'>('auto')
const draftCustomFilter = reactive({
  aspects: new Set<string>(),
  traits: new Set<string>()
})

const aspectOptions = ['vigilance', 'command', 'aggression', 'cunning', 'villainy', 'heroism', 'neutral']

const sortedSelectedAspects = computed(() => {
  if (!selectedLeader.value && !selectedBase.value) return []
  const aspects = [
    ...(selectedLeader.value?.aspects || []),
    ...(selectedBase.value?.aspects || [])
  ]
  return aspects.sort((a, b) => {
    const indexA = aspectOptions.indexOf(a)
    const indexB = aspectOptions.indexOf(b)
    return indexA - indexB
  })
})



const openFilterDialog = () => {
  // Init draft with current state
  draftFilterMode.value = filterMode.value
  draftCustomFilter.aspects = new Set(customFilter.aspects)
  draftCustomFilter.traits = new Set(customFilter.traits)
  showFilterDialog.value = true
}

const switchToAutoMode = () => {
  $trackEvent('filter_type_selected', { type: 'auto' })
  draftFilterMode.value = 'auto'
}

const switchToCustomMode = () => {
  $trackEvent('filter_type_selected', { type: 'custom' })
  draftFilterMode.value = 'custom'
  
  if (filterMode.value === 'auto') {
      const newAspects = new Set<string>(['neutral'])
      
      if (selectedLeader.value?.aspects) {
        selectedLeader.value.aspects.forEach((a: string) => newAspects.add(a))
      }
      if (selectedBase.value?.aspects) {
        selectedBase.value.aspects.forEach((a: string) => newAspects.add(a))
      }
      
      draftCustomFilter.aspects = newAspects
  }
}


const applyFilter = () => {
  let filterChanged = filterMode.value !== draftFilterMode.value;

  if (!filterChanged && filterMode.value === 'custom') {
    const areSetsEqual = (a: Set<any>, b: Set<any>) => a.size === b.size && Array.from(a).every(value => b.has(value));
    filterChanged = 
      !areSetsEqual(customFilter.aspects, draftCustomFilter.aspects) ||
      !areSetsEqual(customFilter.traits, draftCustomFilter.traits);
  }

  if (!filterChanged) {
      showFilterDialog.value = false;
      return;
  }

  // Only ask for confirmation if the user has started manually unchecking cards from their current view.
  // If their selected cards length is equal to all currently displayed cards, they haven't customized the deck.
  const isDeckStarted = selectedCardIds.value.size > 0 && selectedCardIds.value.size < cards.value.length;

  if (isDeckStarted) {
      // Native window.confirm is prone to being permanently disabled by users via browser settings
      // (e.g. "Prevent this page from creating dialogs"). To avoid a silent deadlock where false is returned 
      // instantly forever, we use a time-check. If it returns false instantly (e.g. <50ms), it means it was blocked.
      const startTime = Date.now();
      const res = window.confirm(t('filter_change_confirmation'));
      const isAutoBlocked = !res && (Date.now() - startTime) < 50;

      if (res || isAutoBlocked) {
          selectedCardIds.value = new Set();
      } else {
          return; // Stay open, user aborted the wipe manually
      }
  } else {
      selectedCardIds.value = new Set(); // Reset silently 
  }

  filterMode.value = draftFilterMode.value;
  customFilter.aspects = new Set(draftCustomFilter.aspects);
  customFilter.traits = new Set(draftCustomFilter.traits);
  showFilterDialog.value = false;
}

// Helpers for draft manipulation
const toggleDraftAspect = (aspect: string) => {
  if (draftCustomFilter.aspects.has(aspect)) {
    draftCustomFilter.aspects.delete(aspect)
  } else {
    draftCustomFilter.aspects.add(aspect)
  }
}

const toggleDraftTrait = (trait: string) => {
  if (draftCustomFilter.traits.has(trait)) {
    draftCustomFilter.traits.delete(trait)
  } else {
    draftCustomFilter.traits.add(trait)
  }
}

const availableTraits = computed(() => {
  const traits = new Set<string>()
  poolCards.value.forEach(card => {
    const cardTraits = getCardTraits(card)
    if (cardTraits) {
      cardTraits.forEach((t: string) => traits.add(t))
    }
  })
  return Array.from(traits).sort()
})



const draftFilteredCardsCount = computed(() => {
  if (!selectedLeader.value && !selectedBase.value) {
     return poolCards.value.length
  }

  return getFilteredCards(draftFilterMode.value, draftCustomFilter, selectedLeader.value, selectedBase.value).length
})

function resetOptions() {
  selectedLeaderId.value = null
  selectedBaseId.value = null
  selectedCardIds.value = new Set()
  sortBy.value = 'number'
  filterMode.value = 'auto'
  customFilter.aspects.clear()
  customFilter.traits.clear()
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
  selectedCardIds.value = new Set(newCards.map(c => c.uniqueId))
}, { immediate: true })

const isCopied = ref(false)

const copyDeck = async () => {
  $trackEvent('copy_deck')
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

  const deck = Array.from(cardCounts, ([id, count]) => ({ id, count }))

  const sideboardList = processedCards.value.filter(c =>
    !selectedCardIds.value.has(c.uniqueId) &&
    c.type !== 'leader' &&
    c.type !== 'base'
  )

  const sideboardCounts = new Map<string, number>()
  for (const card of sideboardList) {
    const id = card.id.replace('-', '_')
    sideboardCounts.set(id, (sideboardCounts.get(id) || 0) + 1)
  }

  const sideboard = Array.from(sideboardCounts, ([id, count]) => ({ id, count }))

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
    deck: deck,
    sideboard: sideboard
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
  $trackEvent('copy_pool')
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

  const shuffled = [...selectedCards.value].sort(() => 0.5 - Math.random())
  const hand = shuffled.slice(0, 6)

  drawnHand.value = hand
  revealedCount.value = 0
  showDrawDialog.value = true

  revealInterval = setInterval(() => {
    if (revealedCount.value < hand.length) revealedCount.value++
    else clearInterval(revealInterval)
  }, 20)
}

const statsByCostAndType = computed(() => {
  const data = {
    unit: Array(8).fill(0),
    event: Array(8).fill(0),
    upgrade: Array(8).fill(0)
  }

  selectedCards.value.forEach(card => {
    const cost = Math.min(card.cost ?? 0, 7)

    if (card.type === 'unit') data.unit[cost]++
    else if (card.type === 'event') data.event[cost]++
    else if (card.type === 'upgrade') data.upgrade[cost]++
  })

  return data
})

const arenaStats = computed(() => {
  const units = selectedCards.value.filter(c => c.type === 'unit')

  const space = units.filter(u => u.arena === 'space').length
  const ground = units.filter(u => u.arena === 'ground').length

  return { space, ground }
})

const traitStats = computed(() => {
  const traits = new Map<string, number>()

  selectedCards.value.forEach(card => {
    const cardTraits = getCardTraits(card)
    if (cardTraits) {
      cardTraits.forEach((trait: string) => {
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
  const aspects = new Map<string, number>()

  selectedCards.value.forEach(card => {
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
    labels: Array.from({ length: 8 }, (_, i) => t('cost_x', { cost: i === 7 ? '7+' : i })),
    datasets: [
      {
        label: t('units'),
        backgroundColor: '#60a5fa',
        data: statsByCostAndType.value.unit,
        stack: 'total'
      },
      {
        label: t('events'),
        backgroundColor: '#2563eb',
        data: statsByCostAndType.value.event,
        stack: 'total'
      },
      {
        label: t('upgrades'),
        backgroundColor: '#1e3a8a',
        data: statsByCostAndType.value.upgrade,
        stack: 'total'
      }
    ]
  }
})

const arenaChartData = computed(() => {
  return {
    labels: [t('ground'), t('space')],
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
        label: t('count'),
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
    showStats.value = false
    showDrawDialog.value = false
    showFilterDialog.value = false
  }
}

watch([showStats, showDrawDialog, showFilterDialog], ([statsOpen, drawOpen, filterOpen]) => {
  if (typeof document !== 'undefined') {
    if (statsOpen || drawOpen || filterOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = 'hidden'
      document.body.style.backgroundColor = '#020617' // swu-950
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.style.backgroundColor = ''
    }
  }
})

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
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.body.style.backgroundColor = ''
  }
})

</script>

<template>
  <div class="flex flex-col md:flex-row min-h-[calc(100vh-8rem)] -mt-8 pt-1 transition-[gap] duration-300" :class="isSidebarOpen ? 'gap-6' : 'gap-0'">

    <!-- Permanent Sidebar: Leaders & Bases -->
    <aside 
      class="flex-shrink-0 relative transition-[width,height,margin] duration-300 z-40"
      :class="isSidebarOpen ? 'md:w-80 w-full mt-5' : 'w-0 h-0 md:h-auto overflow-visible'"
    >
      <div v-show="isSidebarOpen" @scroll.passive="handleScroll"
        class="md:sticky md:top-[5.5rem] md:max-h-[calc(100vh-5.5rem)] md:overflow-y-auto bg-swu-900/50 backdrop-blur-sm rounded-xl border border-swu-primary/20 p-4 shadow-lg custom-scrollbar">

        <!-- Close button inside the sidebar container at top right -->
        <button 
          @click="isSidebarOpen = false"
          :title="$t('hide_sidebar')"
          class="hidden md:block absolute top-2 right-2 bg-swu-900 border border-swu-primary/50 text-swu-primary hover:text-white hover:bg-swu-primary p-1 rounded-full shadow z-10 transition-colors"
        >
          <ChevronLeftIcon class="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <!-- Reroll & Copy Section -->
        <div class="mb-3 md:mt-10 flex gap-2">
          <button @click="regeneratePool"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span class="text-xs tracking-wide">{{ $t('new_pool') }}</span>
          </button>

          <button @click="copyPoolLink"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-4 bg-white/5 hover:bg-swu-primary hover:shadow-lg hover:shadow-swu-primary/30 text-gray-300 hover:text-white border border-white/10 hover:border-swu-primary/50 rounded-xl transition-all duration-300 group overflow-hidden relative"
            :title="isPoolLinkCopied ? $t('link_copied') : $t('copy_pool_link')">
            <span
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <LinkIcon v-if="!isPoolLinkCopied"
              class="w-4 h-4 group-hover:scale-110 transition-transform duration-500" />
            <CheckIcon v-else class="w-4 h-4 animate-bounce text-emerald-400" />
            <span class="text-xs tracking-wide">{{ isPoolLinkCopied ? $t('copied') : $t('copy_pool') }}</span>
          </button>
        </div>

        <!-- Selected Leader & Base Display -->
        <div class="grid grid-cols-2 gap-2 md:h-28 mb-2">
          <div class="relative group flex justify-center items-center h-full">
            <Transition name="pop-in" mode="out-in">
              <div v-if="selectedLeader" key="leader-img"
                class="cursor-pointer w-full h-full flex justify-center items-center"
                @mouseenter="showPopup(selectedLeader, $event)" @mouseleave="hidePopup">
                <img :src="getCardArt(selectedLeader)" :alt="getCardName(selectedLeader)"
                  class="w-full h-auto max-h-full object-contain rounded-lg shadow-md border border-swu-primary/30" />
              </div>
              <div v-else key="leader-placeholder"
                class="w-full h-auto aspect-[3.5/2.5] max-h-full rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs hover:border-white/20 transition-colors">
                {{ $t('select_leader') }}
              </div>
            </Transition>
          </div>

          <div class="relative group flex justify-center items-center h-full">
            <Transition name="pop-in" mode="out-in">
              <div v-if="selectedBase" key="base-img"
                class="cursor-pointer w-full h-full flex justify-center items-center"
                @mouseenter="showPopup(selectedBase, $event)" @mouseleave="hidePopup">
                <img :src="getCardArt(selectedBase)" :alt="getCardName(selectedBase)"
                  class="w-full h-auto max-h-full object-contain rounded-lg shadow-md border border-swu-primary/30" />
              </div>
              <div v-else key="base-placeholder"
                class="w-full h-auto aspect-[3.5/2.5] max-h-full rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs hover:border-white/20 transition-colors">
                {{ $t('select_base') }}
              </div>
            </Transition>
          </div>
        </div>

        <!-- Leaders Section -->
        <div class="mb-3 mt-5 md:mt-3">
          <div class="flex items-center justify-between mb-1 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">{{ $t('leaders') }}</h3>
          </div>


          <div v-if="groupedLeaders.length > 0" class="space-y-1">
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
                  {{ getCardName(group.card) }} <span v-if="group.count > 1" class="text-gray-500 ml-1">x{{ group.count
                  }}</span>
                </span>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                <div v-for="aspect in group.card.aspects" :key="aspect" :title="$t(`aspect_${aspect}`)">
                  <img :src="`/images/aspect-${aspect}.png`" :alt="$t(`aspect_${aspect}`)"
                    class="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 py-4 text-center">{{ $t('no_leaders') }}</div>
        </div>

        <!-- Bases Section -->
        <div>
          <div class="flex items-center justify-between mb-1 px-1">
            <h3 class="text-xs font-semibold text-swu-primary uppercase tracking-wider">{{ $t('bases') }}</h3>
          </div>


          <div v-if="bases.length > 0" class="space-y-1">
            <div v-for="card in bases" :key="card.uniqueId" :data-unique-id="card.uniqueId"
              class="flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent"
              :class="[
                selectedBaseId === card.uniqueId
                  ? 'bg-swu-primary/20 text-white border-swu-primary/50 shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white hover:border-white/10'
              ]" @click="toggleBase(card.uniqueId)" @mouseenter="showPopup(card, $event)" @mouseleave="hidePopup">
              <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <span class="truncate text-sm font-medium">{{ getCardName(card) }}</span>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                <div v-for="aspect in card.aspects" :key="aspect" :title="$t(`aspect_${aspect}`)">
                  <img :src="`/images/aspect-${aspect}.png`" :alt="$t(`aspect_${aspect}`)"
                    class="w-6 h-6 object-contain" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500 py-4 text-center">{{ $t('no_bases') }}</div>
        </div>

      </div>
    </aside>

    <!-- Main Content Area: Deck Building -->
    <div class="flex-1 min-w-0">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-8">
        <div class="animate-pulse flex flex-col gap-4">
          <div class="h-16 w-full"></div>
          <div class="mt-1 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            <div v-for="n in 12" :key="n" class="aspect-[2.5/3.5] bg-swu-800 rounded-2xl"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
          <ExclamationCircleIcon class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-white mb-2">{{ $t('failed_load') }}</h3>
        <p class="text-gray-400">{{ $t('failed_load_text') }}</p>
      </div>

      <!-- Cards Deck -->
      <div v-else>
        <div
          class="flex flex-wrap items-center justify-between mb-2 gap-4 sticky top-[5rem] z-30 pointer-events-none -mx-2 px-2 md:pt-2 pt-0 md:pb-5 pb-4">

          <!-- Collapsed Toggle Button & Leader/Base -->
          <Transition name="slide-right">
            <div v-show="!isSidebarOpen" class="flex items-center gap-3 w-max select-none pointer-events-auto">
              <button 
                @click="isSidebarOpen = true"
                :title="$t('show_sidebar')"
                class="flex bg-swu-900 border border-swu-primary/50 text-swu-primary hover:text-white hover:bg-swu-primary p-2 rounded-full shadow-lg transition-all items-center justify-center hover:scale-110 flex-shrink-0"
              >
                <ChevronRightIcon class="w-5 h-5" />
              </button>
              <div v-if="selectedLeader && selectedBase" class="bg-swu-900/80 backdrop-blur-sm border border-white/5 shadow-2xl rounded-xl h-[50px] px-4 flex items-center gap-2 text-sm font-bold text-gray-300">
                 <span class="cursor-pointer hover:text-white transition-colors" @mouseenter="showPopup(selectedLeader, $event)" @mouseleave="hidePopup">{{ getCardName(selectedLeader) }}</span>
                 <span class="text-white/20">|</span>
                 <span class="cursor-pointer hover:text-white transition-colors" @mouseenter="showPopup(selectedBase, $event)" @mouseleave="hidePopup">{{ getCardName(selectedBase) }}</span>
                 <span v-if="sortedSelectedAspects.length > 0" class="text-white/20">|</span>
                 <div v-if="sortedSelectedAspects.length > 0" class="flex items-center gap-1">
                   <div v-for="(aspect, index) in sortedSelectedAspects" :key="`${aspect}-${index}`" :title="$t(`aspect_${aspect}`)">
                     <img :src="`/images/aspect-${aspect}.png`" :alt="$t(`aspect_${aspect}`)" class="w-5 h-5 object-contain" />
                   </div>
                 </div>
              </div>
            </div>
          </Transition>

          <div
            class="flex flex-nowrap overflow-x-auto items-center gap-1 pointer-events-auto bg-swu-900/80 backdrop-blur rounded-xl p-2 border border-white/5 shadow-2xl max-w-full custom-scrollbar ml-auto">
            <!-- Copy Deck Button -->
            <Transition name="horizontal-slide">
              <button v-if="selectedLeaderId && selectedBaseId && selectedCardIds.size >= 30" @click="copyDeck"
                class="h-8 flex items-center gap-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 mr-2">
                <ClipboardDocumentIcon v-if="!isCopied" class="w-4 h-4" />
                <CheckIcon v-else class="w-4 h-4 animate-bounce" />
                {{ isCopied ? $t('copied') : '.json' }}
              </button>
            </Transition>

            <Transition name="horizontal-slide">
              <div v-if="selectedLeaderId && selectedBaseId" class="flex items-center gap-1 h-8">

                <div class="font-mono font-bold text-xs text-white flex items-center h-8 flex-shrink-0">
                  {{ selectedCardIds.size }}&nbsp;/&nbsp;{{ cards.length }}
                </div>

                <button @click="showStats = !showStats" :disabled="selectedCardIds.size < 30"
                  class="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded transition-colors" :class="[
                    selectedCardIds.size < 30
                      ? 'text-gray-600 opacity-50 cursor-not-allowed'
                      : (showStats ? 'text-swu-primary bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/10')
                  ]" :title="$t('deck_stats')">
                  <ChartBarIcon class="w-5 h-5" />
                </button>

                <button @click="drawHand" :disabled="selectedCardIds.size < 30"
                  class="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded transition-colors"
                  :class="selectedCardIds.size < 30 ? 'text-gray-600 opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10'"
                  :title="$t('test_hand')">
                  <HandRaisedIcon class="w-5 h-5" />
                </button>

                <button @click="openFilterDialog"
                  class="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded transition-colors mr-2 text-gray-400 hover:text-white hover:bg-white/10"
                  :title="$t('filter_title')">
                  <FunnelIcon class="w-5 h-5" />
                </button>
              </div>
            </Transition>

            <div class="flex items-center bg-swu-900 rounded-lg border border-swu-800 p-0.5 h-8">
              <button @click="sortBy = 'number'"
                class="h-full px-2 rounded-md text-[10px] font-medium transition-colors flex items-center"
                :class="sortBy === 'number' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'">
                {{ $t('sort_num') }}
              </button>
              <button @click="sortBy = 'cost'"
                class="h-full px-2 rounded-md text-[10px] font-medium transition-colors flex items-center"
                :class="sortBy === 'cost' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'">
                {{ $t('sort_cost') }}
              </button>
              <button @click="sortBy = 'keyword'"
                class="h-full px-2 rounded-md text-[10px] font-medium transition-colors flex items-center"
                :class="sortBy === 'keyword' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-gray-300'">
                {{ $t('sort_keyword') }}
              </button>
            </div>

            <button @click="resetOptions" :disabled="!selectedLeaderId && !selectedBaseId"
              class="h-8 flex items-center px-2 rounded-lg text-xs font-medium transition-colors border" :class="(!selectedLeaderId && !selectedBaseId)
                ? 'opacity-50 cursor-not-allowed border-white/5 text-gray-500 bg-white/5'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border-red-500/20'"
              :title="$t('reset_selection')">
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
            <img :src="getCardArt(card)" :alt="getCardName(card)" loading="lazy" class="w-full h-full object-cover" />
          </div>
        </div>
        <div v-else class="text-center text-slate-400 py-20 flex flex-col items-center">
          <div class="mb-4 text-4xl opacity-50">🃏</div>
          <p class="text-lg">{{ $t('no_compatible_cards') }}</p>
        </div>
      </div>
    </div>

    <!-- Hover Popup -->
    <div v-if="hoveredCard" class="fixed z-[100] pointer-events-none transition-all duration-150 ease-out"
      :style="{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }">
      <div
        class="relative shadow-2xl rounded-2xl overflow-hidden border border-swu-primary/30 bg-swu-900 elevation-high">
        <img :src="getCardArt(hoveredCard)" :alt="getCardName(hoveredCard)" class="object-contain"
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
            {{ $t('deck_stats') }}
          </h3>
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 flex flex-col min-h-[300px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                {{ $t('cost_curve') }}</h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Bar :data="chartData" :options="chartOptions" />
              </div>
            </div>

            <div class="flex-1 flex flex-col min-h-[300px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                {{ $t('top_traits') }}
              </h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Bar :data="traitChartData" :options="traitChartOptions" />
              </div>
            </div>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:h-[200px]">
            <div class="flex flex-col h-[200px] md:h-full max-h-[200px]">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                {{ $t('arena_breakdown') }}
              </h4>
              <div class="flex-1 relative min-h-0 w-full">
                <Pie :data="arenaChartData" :options="arenaChartOptions" />
              </div>
            </div>

            <div class="flex flex-col h-[200px] md:h-full">
              <h4 class="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide text-center flex-shrink-0">
                {{ $t('aspects') }}
              </h4>
              <div class="flex-1 relative min-h-0 w-full flex justify-center">
                <div class="w-full max-w-xs space-y-2 max-h-[142px] overflow-y-auto custom-scrollbar pr-2">
                  <div v-for="[aspect, count] in aspectStats" :key="aspect"
                    class="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors select-none cursor-default">
                    <div class="flex items-center gap-3">
                      <img :src="`/images/aspect-${aspect}.png`" :alt="$t(`aspect_${aspect}`)"
                        class="w-6 h-6 object-contain" />
                      <span class="text-sm font-medium capitalize text-gray-200">{{ $t(`aspect_${aspect}`) }}</span>
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
          class="draw-dialog-content bg-swu-900 border border-swu-primary/30 rounded-2xl p-4 shadow-2xl w-fit max-w-[95vw] flex flex-col relative elevation-high max-h-[90vh] overflow-y-auto">
          <div class="absolute top-4 right-4 flex items-center gap-2">
            <button @click="drawHand" :title="$t('redraw_hand')"
              class="h-8 w-8 flex items-center justify-center rounded transition-colors text-gray-400 hover:text-white hover:bg-white/10 group">
              <ArrowPathIcon class="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button @click="showDrawDialog = false"
              class="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <HandRaisedIcon class="w-6 h-6 text-swu-primary" />
            {{ $t('opening_hand') }}
          </h3>

          <div v-if="drawnHand.length > 0"
            class="grid grid-cols-2 md:grid-cols-3 justify-items-center gap-4 mt-4 mb-4 min-h-[300px] mx-auto w-fit">
            <div v-for="(card, index) in drawnHand" :key="card.uniqueId"
              class="relative rounded-xl overflow-hidden border border-white/10 shadow-md aspect-[2.5/3.5] bg-swu-900 w-32 md:w-48 flex-shrink-0">

              <Transition name="fade">
                <div v-if="index < revealedCount" key="image"
                  class="absolute inset-0 w-full h-full group cursor-pointer" @mouseenter="showPopup(card, $event)"
                  @mouseleave="hidePopup">
                  <img :src="getCardArt(card)" :alt="getCardName(card)" class="w-full h-full object-cover" />
                </div>
                <div v-else key="skeleton" class="absolute inset-0 w-full h-full bg-swu-800/50 animate-pulse"></div>
              </Transition>
            </div>
          </div>


        </div>
      </div>
    </Transition>
    <!-- Filter Dialog -->
    <Transition name="fade">
      <div v-if="showFilterDialog"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showFilterDialog = false">
        <div
          class="bg-swu-900 border border-swu-primary/30 rounded-2xl p-6 shadow-2xl w-full max-w-lg md:max-w-xl flex flex-col relative elevation-high max-h-[90vh]">
          
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <FunnelIcon class="w-6 h-6 text-swu-primary" />
              {{ $t('filter_title') }}
            </h3>
            <button @click="showFilterDialog = false"
              class="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col custom-scrollbar pr-2 space-y-6">
            <!-- Mode Switcher -->
            <div class="flex items-center bg-white/5 rounded-lg p-1">
              <button class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
                :class="draftFilterMode === 'auto' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-white'"
                @click="switchToAutoMode">
                {{ $t('filter_mode_auto') }}
              </button>
              <button class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all"
                :class="draftFilterMode === 'custom' ? 'bg-swu-primary text-white shadow' : 'text-gray-400 hover:text-white'"
                @click="switchToCustomMode">
                {{ $t('filter_mode_custom') }}
              </button>
            </div>

            <!-- Custom Filters -->
            <div v-if="draftFilterMode === 'custom'" class="flex flex-col flex-1 min-h-0 space-y-6 animate-pulse-fade">
              
              <!-- Aspects -->
              <div class="flex-shrink-0">
                <h4 class="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{{ $t('filter_aspects') }}</h4>
                <div class="grid grid-cols-4 lg:flex lg:flex-wrap gap-3">
                    <div v-for="aspect in aspectOptions" :key="aspect"
                        class="cursor-pointer p-2 rounded-lg border transition-all duration-200 flex justify-center items-center"
                        :class="draftCustomFilter.aspects.has(aspect) ? 'bg-swu-primary/20 border-swu-primary' : 'bg-transparent border-white/10 hover:border-white/30'"
                        @click="toggleDraftAspect(aspect)">
                        <img v-if="aspect !== 'neutral'" :src="`/images/aspect-${aspect}.png`" :alt="aspect" class="w-8 h-8 opacity-90" :class="{ 'grayscale opacity-50': !draftCustomFilter.aspects.has(aspect) }" />
                        <span v-else class="w-8 h-8 flex items-center justify-center font-bold text-gray-400 bg-white/10 rounded-full text-xs transition-colors" :class="{ 'text-white bg-swu-primary': draftCustomFilter.aspects.has(aspect) }">
                          N
                        </span>
                    </div>
                </div>
              </div>



              <!-- Traits -->
              <div v-if="availableTraits.length > 0" class="flex-shrink-0">
                <h4 class="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{{ $t('filter_additional_traits') }}</h4>
                <div class="flex flex-wrap gap-2">
                    <button v-for="trait in availableTraits" :key="trait"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                        :class="draftCustomFilter.traits.has(trait) 
                            ? 'bg-swu-primary text-white border-swu-primary shadow-md' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'"
                        @click="toggleDraftTrait(trait)">
                        {{ trait }}
                    </button>
                </div>
              </div>

            </div>
            
            <div v-else class="py-8 text-center text-gray-400 bg-white/5 rounded-xl border border-dashed border-white/10 px-4">
                <p class="flex items-start justify-center gap-2">
                    <InformationCircleIcon class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <span class="text-left">{{ $t('filter_auto_desc') }}</span>
                </p>
            </div>

          </div>

          <div class="mt-6 pt-4 border-t border-white/10 flex justify-between items-center gap-4">
             <div class="text-sm text-gray-400 font-medium">
               {{ $t('cards_count', { count: draftFilteredCardsCount }) }}
             </div>
             <button @click="applyFilter"
                class="bg-swu-primary hover:bg-swu-primary/90 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-swu-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100">
                {{ $t('apply_filter') }}
             </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pop-in-enter-active {
  transition: all 0.2s ease-out;
}
.pop-in-leave-active {
  transition: all 0.15s ease-in;
}
.pop-in-enter-from,
.pop-in-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.pop-in-enter-to,
.pop-in-leave-from {
  opacity: 1;
  transform: scale(1);
}

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

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

</style>
