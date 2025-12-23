<template>
  <Transition
    enter-active-class="transform ease-out duration-500 transition"
    enter-from-class="translate-y-10 opacity-0 sm:translate-y-10 sm:translate-x-0"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 translate-y-10"
  >
    <div 
      v-if="isOpen" 
      class="fixed bottom-0 inset-x-0 md:bottom-6 md:right-6 md:left-auto md:w-[26rem] z-50 p-4 md:p-0"
    >
      <div class="bg-swu-950/95 backdrop-blur-xl border border-swu-primary/20 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div class="p-5">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 pt-1">
              <div class="p-2 bg-gradient-to-br from-swu-primary/20 to-swu-primary/5 rounded-lg border border-swu-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-swu-primary">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-white mb-2 tracking-wide">
                {{ $t('cookies_title') }}
              </h3>
              <p class="text-sm text-slate-400 leading-relaxed">
                {{ $t('cookies_text') }}
              </p>
            </div>
          </div>
          <div class="mt-6 flex gap-3 justify-end items-center">
            <button 
              @click="decline" 
              class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
            >
              {{ $t('cookies_decline') }}
            </button>
            <button 
              @click="accept" 
              class="group relative px-5 py-2 text-xs font-bold text-white bg-swu-primary rounded-lg overflow-hidden transition-all hover:bg-swu-primary/90 shadow-lg shadow-swu-primary/20 hover:shadow-swu-primary/40 uppercase tracking-wider"
            >
              <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shine"></div>
              {{ $t('cookies_accept') }}
            </button>
          </div>
        </div>
        <!-- Decorative bottom line -->
        <div class="h-0.5 w-full bg-gradient-to-r from-swu-primary/0 via-swu-primary/40 to-swu-primary/0"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isOpen = ref(false)
const nuxtApp = useNuxtApp()

onMounted(() => {
  const consent = localStorage.getItem('cookie_consent')
  if (consent === null) {
    // Show after a brief delay for smoother entrance
    setTimeout(() => {
      isOpen.value = true
    }, 1500)
  }
})

function accept() {
  localStorage.setItem('cookie_consent', 'true')
  isOpen.value = false
  const { $enableAnalytics } = nuxtApp as any
  if ($enableAnalytics) $enableAnalytics()
}

function decline() {
  localStorage.setItem('cookie_consent', 'false')
  isOpen.value = false
}
</script>

<style scoped>
@keyframes shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shine {
  animation: shine 1s ease-in-out infinite;
}
</style>
