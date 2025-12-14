<script setup lang="ts">
const isMobileMenuOpen = ref(false)
const route = useRoute()

// Close menu when route changes
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>

<template>
  <div
    class="min-h-screen bg-swu-950 text-slate-200 flex flex-col font-sans selection:bg-swu-primary selection:text-white">
    <!-- Navigation Bar -->
    <header
      class="sticky top-0 z-40 w-full backdrop-blur-lg bg-swu-950/80 border-b border-swu-primary/20 shadow-lg shadow-swu-900/50">
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

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-4 items-center">

            <NuxtLink to="/sets/LOF" class="rounded-md px-2 py-1 transition-all duration-300" :class="[
              route.path.includes('/sets/LOF') || (route.params.id as string)?.includes('LOF-')
                ? 'opacity-100 grayscale-0 bg-swu-primary/10 ring-2 ring-swu-primary'
                : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-swu-primary/10'
            ]">
              <img src="/images/LOF-logo.png" alt="Legends of the Force" class="h-8 w-auto" />
            </NuxtLink>
            <NuxtLink to="/sets/SEC" class="rounded-md px-2 py-1 transition-all duration-300" :class="[
              route.path.includes('/sets/SEC') || (route.params.id as string)?.includes('SEC-')
                ? 'opacity-100 grayscale-0 bg-swu-primary/10 ring-2 ring-swu-primary'
                : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-swu-primary/10'
            ]">
              <img src="/images/SEC-logo.png" alt="Secrets of Power" class="h-8 w-auto" />
            </NuxtLink>
          </nav>

          <!-- Mobile Menu Button -->
          <div class="flex ml-auto md:hidden">
            <button type="button"
              class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-400 hover:text-white transition-colors"
              @click="isMobileMenuOpen = !isMobileMenuOpen">
              <span class="sr-only">Toggle main menu</span>
              <!-- Hamburger Icon -->
              <svg v-if="!isMobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <!-- Close Icon -->
              <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <transition enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0">
        <div v-if="isMobileMenuOpen" class="md:hidden border-t border-swu-primary/10 bg-swu-950/95 backdrop-blur-xl">
          <div class="space-y-1 px-4 pb-3 pt-2">
            <NuxtLink to="/sets/LOF"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-swu-primary/10 transition-colors"
              :class="route.path.includes('/sets/LOF') || (route.params.id as string)?.includes('LOF-') ? 'bg-swu-primary/10 ring-1 ring-swu-primary/50' : ''">
              <img src="/images/LOF-logo.png" alt="Legends of the Force" class="h-8 w-auto" />
            </NuxtLink>
            <NuxtLink to="/sets/SEC"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-swu-primary/10 transition-colors"
              :class="route.path.includes('/sets/SEC') || (route.params.id as string)?.includes('SEC-') ? 'bg-swu-primary/10 ring-1 ring-swu-primary/50' : ''">
              <img src="/images/SEC-logo.png" alt="Secrets of Power" class="h-8 w-auto" />
            </NuxtLink>
          </div>
        </div>
      </transition>
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
            &copy; {{ new Date().getFullYear() }} swulimited.com. Fan-made tool.
          </p>
          <p class="text-xs text-slate-500 max-w-3xl">
            The information presented on this site about Star Wars Unlimited, both literal and graphical, is copyrighted
            by Fantasy Flight Games and Lucasfilm Ltd.
            This website is not produced, endorsed, supported, or affiliated with Fantasy Flight Games and/or Lucasfilm
            Ltd.
            All card images and symbols are property of their respective owners.
          </p>
        </div>
        <div class="flex gap-4 text-xs text-slate-500">
          <NuxtLink to="/about" class="hover:text-white transition-colors">About</NuxtLink>
        </div>
      </div>
    </footer>
    <ConsentBanner />
  </div>
</template>
