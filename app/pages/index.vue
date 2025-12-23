<script setup lang="ts">
import { AdjustmentsHorizontalIcon, MinusIcon, PlusIcon, ArrowRightIcon, CheckIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

useSeoMeta({
  title: t('meta_title'),
  description: t('meta_desc'),
  ogTitle: t('meta_title'),
  ogDescription: t('meta_desc'),
})

const router = useRouter()

const availableSets = ref([
  { code: 'LOF', count: 0 },
  { code: 'SEC', count: 6 }
])

const includeSpotlightLeaders = ref(false)

const totalPacks = computed(() => availableSets.value.reduce((acc, s) => acc + s.count, 0))

const startCustomEvent = () => {
  const activeSets = availableSets.value.filter(s => s.count > 0)

  // If a single set is selected with exactly 6 boosters AND spotlight leaders are NOT included, redirect to the standard pool URL
  const firstSet = activeSets[0]
  if (activeSets.length === 1 && firstSet && firstSet.count === 6 && !includeSpotlightLeaders.value) {
    router.push(`/sets/${firstSet.code}`)
    return
  }

  let config = activeSets
    .map(s => `${s.code}-${s.count}`)
    .join('_')

  if (includeSpotlightLeaders.value) {
    config += '_SL'
  }

  if (config) {
    router.push(`/sets/${config}`)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center flex-grow py-6">

    <div class="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-16">

      <!-- Standard Sets Column -->
      <div class="flex flex-col items-center">
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">{{ $t('std_pool') }}</h2>
        <div class="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:gap-6 md:gap-8 items-center justify-center">
          <NuxtLink to="/sets/LOF"
            class="group relative block w-full sm:w-28 md:w-40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-swu-primary/50 rounded-xl">
            <div
              class="absolute -inset-0.5 bg-swu-primary rounded-xl opacity-0 group-hover:opacity-75 blur transition duration-300">
            </div>
            <img src="/images/LOF-cover.jpg" alt="Legends of the Force"
              class="relative w-full h-auto rounded-xl shadow-2xl border border-white/10" />
            <div
              class="absolute inset-x-0 -bottom-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span class="text-swu-primary font-bold text-sm tracking-widest uppercase">{{ $t('open_6_packs') }}</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/sets/SEC"
            class="group relative block w-full sm:w-28 md:w-40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-swu-accent/50 rounded-xl">
            <div
              class="absolute -inset-0.5 bg-swu-accent rounded-xl opacity-0 group-hover:opacity-75 blur transition duration-300">
            </div>
            <img src="/images/SEC-cover.jpg" alt="Secrets of Power"
              class="relative w-full h-auto rounded-xl shadow-2xl border border-white/10" />
            <div
              class="absolute inset-x-0 -bottom-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span class="text-swu-accent font-bold text-sm tracking-widest uppercase">{{ $t('open_6_packs') }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Divider (Vertical on desktop, Horizontal on mobile) -->
      <div class="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      <div class="block lg:hidden w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/10 to-transparent">
      </div>

      <!-- Custom Pool Column -->
      <div class="flex flex-col items-center flex-1 lg:flex-none">
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">{{ $t('custom_pool') }}</h2>
        <div
          class="w-full max-w-sm bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl backdrop-blur-sm flex flex-col flex-1">
          <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <AdjustmentsHorizontalIcon class="w-5 h-5 text-swu-primary" />
            {{ $t('configure_packs') }}
          </h3>

          <div class="space-y-4 mb-8">
            <div class="space-y-2">
              <div v-for="set in availableSets" :key="set.code" class="flex items-center justify-between w-full">
                <span class="text-gray-300 font-medium text-sm mr-8">{{ $t(`set_${set.code.toLowerCase()}`) }}</span>
                <div class="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/5">
                  <button @click="set.count = Math.max(0, set.count - 1)"
                    class="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <MinusIcon class="w-3 h-3" stroke-width="2" />
                  </button>
                  <span class="w-6 text-center font-mono font-bold text-white">{{ set.count }}</span>
                  <button @click="set.count = Math.min(12, set.count + 1)"
                    class="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <PlusIcon class="w-3 h-3" stroke-width="2" />
                  </button>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-white/10">
              <label class="flex items-center w-full cursor-pointer group">
                <div class="relative flex items-center">
                  <input type="checkbox" v-model="includeSpotlightLeaders"
                    class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/10 bg-black/40 checked:border-swu-primary checked:bg-swu-primary transition-all" />
                  <CheckIcon
                    class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                    stroke-width="3" />
                </div>
                <span class="ml-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">{{ $t('include_spotlight_leaders') }}</span>
              </label>
            </div>
          </div>

          <button @click="startCustomEvent" :disabled="totalPacks === 0"
            class="mt-auto w-full py-3 px-6 bg-swu-primary hover:bg-swu-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-swu-primary/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group">
            <span>{{ $t('open_packs') }}</span>
            <ArrowRightIcon class="w-4 h-4 group-hover:translate-x-1 transition-transform" stroke-width="2" />
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
