<script setup lang="ts">
useSeoMeta({
  title: 'swulimited.com',
  description: 'Practice Star Wars Unlimited sealed format online. Open virtual booster packs, build decks, and prepare for your next event.',
  ogTitle: 'swulimited.com',
  ogDescription: 'The best tool to practice Star Wars Unlimited sealed deck format. Open booster packs, build your deck, and export it for tournaments.',
})

const router = useRouter()

const availableSets = ref([
  { code: 'LOF', name: 'Legends of Force', count: 3 },
  { code: 'SEC', name: 'Secrets of Power', count: 3 }
])

const totalPacks = computed(() => availableSets.value.reduce((acc, s) => acc + s.count, 0))

const startCustomEvent = () => {
  const config = availableSets.value
    .filter(s => s.count > 0)
    .map(s => `${s.code}-${s.count}`)
    .join('_')

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
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Standard Pool</h2>
        <div class="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:gap-6 md:gap-8 items-center justify-center">
          <NuxtLink to="/sets/LOF"
            class="group relative block w-full sm:w-28 md:w-40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-swu-primary/50 rounded-xl">
            <div class="absolute -inset-0.5 bg-swu-primary rounded-xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
            <img src="/images/LOF-cover.jpg" alt="Legends of the Force"
              class="relative w-full h-auto rounded-xl shadow-2xl border border-white/10" />
            <div class="absolute inset-x-0 -bottom-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span class="text-swu-primary font-bold text-sm tracking-widest uppercase">Open 6 Packs</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/sets/SEC"
            class="group relative block w-full sm:w-28 md:w-40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-swu-accent/50 rounded-xl">
            <div class="absolute -inset-0.5 bg-swu-accent rounded-xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
            <img src="/images/SEC-cover.jpg" alt="Secrets of Power"
              class="relative w-full h-auto rounded-xl shadow-2xl border border-white/10" />
             <div class="absolute inset-x-0 -bottom-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span class="text-swu-accent font-bold text-sm tracking-widest uppercase">Open 6 Packs</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Divider (Vertical on desktop, Horizontal on mobile) -->
      <div class="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      <div class="block lg:hidden w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <!-- Custom Pool Column -->
      <div class="flex flex-col items-center flex-1 lg:flex-none">
        <h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Custom Pool</h2>
        <div class="w-full max-w-sm bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl backdrop-blur-sm flex flex-col flex-1">
            <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-swu-primary">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Configure Packs
            </h3>
            
            <div class="space-y-2 mb-8">
                 <div v-for="set in availableSets" :key="set.code" class="flex items-center justify-between">
                     <span class="text-gray-300 font-medium text-sm mr-8">{{ set.name }}</span>
                     <div class="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/5">
                         <button @click="set.count = Math.max(0, set.count - 1)" 
                             class="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                               <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                             </svg>
                         </button>
                         <span class="w-6 text-center font-mono font-bold text-white">{{ set.count }}</span>
                         <button @click="set.count = Math.min(12, set.count + 1)"
                             class="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                               <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                             </svg>
                         </button>
                     </div>
                 </div>
            </div>

            <button @click="startCustomEvent" :disabled="totalPacks === 0"
                class="mt-auto w-full py-3 px-6 bg-swu-primary hover:bg-swu-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-swu-primary/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group">
                <span>Open Packs</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>
      </div>
    
    </div>
  </div>
</template>
