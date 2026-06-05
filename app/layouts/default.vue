<script setup lang="ts">
const route = useRoute()
const { locale, setLocale } = useI18n()

const { $trackEvent } = useNuxtApp()

const changeLanguage = (newLocale: 'en' | 'fr') => {
  setLocale(newLocale)
  $trackEvent('change_language', { lang: newLocale })
}
</script>

<template>
  <div
    class="min-h-screen bg-swu-950 text-slate-200 flex flex-col font-sans selection:bg-swu-primary selection:text-white">
    <!-- Navigation Bar -->
    <header
      class="sticky top-0 z-50 w-full backdrop-blur-lg bg-swu-950/80 border-b border-swu-primary/20 shadow-lg shadow-swu-900/50">
      <div class="w-full px-6">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo Section -->
          <div class="flex items-center gap-2">
            <img src="/images/logo.png" alt="SWU-Sealed Logo"
              class="h-10 w-auto rounded-lg shadow-md shadow-swu-primary/20" />
            <NuxtLink to="/"
              class="text-xl font-bold tracking-tight text-white hover:text-swu-primary transition-colors duration-200">
              swulimited.com
            </NuxtLink>

          </div>

          <!-- Language Switcher -->
          <div class="flex items-center gap-2">
            <button @click="changeLanguage('en')" class="text-xs font-bold transition-colors"
              :class="locale === 'en' ? 'text-swu-primary' : 'text-slate-500 hover:text-slate-300'">EN</button>
            <span class="text-slate-600 text-xs">|</span>
            <button @click="changeLanguage('fr')" class="text-xs font-bold transition-colors"
              :class="locale === 'fr' ? 'text-swu-primary' : 'text-slate-500 hover:text-slate-300'">FR</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow relative flex flex-col">
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          class="absolute -top-[10%] left-[20%] w-[40rem] h-[40rem] rounded-full bg-swu-secondary/10 blur-3xl mix-blend-screen">
        </div>
        <div
          class="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-swu-primary/10 blur-3xl mix-blend-screen">
        </div>
      </div>

      <div class="w-full px-6 flex flex-col flex-grow" :class="route.path === '/' ? 'py-2' : 'py-8'">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-swu-primary/20 bg-swu-950 py-8 relative">
      <div
        class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-swu-primary/50 to-transparent opacity-50">
      </div>
      <div class="w-full px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex flex-col gap-2">
          <p class="text-xs text-slate-500">
            &copy; {{ new Date().getFullYear() }} swulimited.com. {{ $t('fan_made_tool') }}
          </p>
          <p class="text-xs text-slate-500 max-w-3xl">
            {{ $t('disclaimer') }}
          </p>
        </div>
        <div class="flex gap-4 text-xs text-slate-500">
          <NuxtLink to="/about" class="hover:text-white transition-colors">{{ $t('about') }}</NuxtLink>
        </div>
      </div>
    </footer>
    <ConsentBanner />
  </div>
</template>
