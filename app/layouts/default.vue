
<template>
  <div class="min-h-screen bg-swu-950 text-slate-200 flex flex-col font-sans selection:bg-swu-primary selection:text-white">
    <!-- Navigation Bar -->
    <header class="sticky top-0 z-40 w-full backdrop-blur-lg bg-swu-950/80 border-b border-swu-primary/20 shadow-lg shadow-swu-900/50">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <!-- Logo Section -->
          <div class="flex items-center gap-2">
            <img src="/images/logo.png" alt="SWU-Sealed Logo" class="h-10 w-auto rounded-lg shadow-md shadow-swu-primary/20" />
            <NuxtLink to="/" class="text-xl font-bold tracking-tight text-white hover:text-swu-primary transition-colors duration-200">
              swusealed.net
            </NuxtLink>
            
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-4 items-center">

            <NuxtLink 
              to="/sets/lof" 
              active-class="opacity-100 grayscale-0 bg-swu-primary/10 ring-2 ring-swu-primary"
              class="rounded-md px-2 py-1 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-swu-primary/10 transition-all duration-300"
            >
              <img src="/images/LOF-logo.png" alt="LOF" class="h-8 w-auto" />
            </NuxtLink>
            <NuxtLink 
              to="/sets/sec" 
              active-class="opacity-100 grayscale-0 bg-swu-primary/10 ring-2 ring-swu-primary"
              class="rounded-md px-2 py-1 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-swu-primary/10 transition-all duration-300"
            >
              <img src="/images/SEC-logo.png" alt="SEC" class="h-8 w-auto" />
            </NuxtLink>
          </nav>

          <!-- Mobile Menu Button (Placeholder) -->
          <div class="flex ml-auto md:hidden">
            <button type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-400 hover:text-white">
              <span class="sr-only">Open main menu</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow relative">
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute -top-[10%] left-[20%] w-[40rem] h-[40rem] rounded-full bg-swu-secondary/10 blur-3xl mix-blend-screen"></div>
        <div class="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-swu-primary/10 blur-3xl mix-blend-screen"></div>
      </div>

      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-swu-primary/20 bg-swu-950 py-8 relative">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-swu-primary/50 to-transparent opacity-50"></div>
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-xs text-slate-500">
          &copy; {{ new Date().getFullYear() }} swusealed.net. Fan-made tool. Not affiliated with Star Wars Unlimited.
        </p>
        <div class="flex gap-4 text-xs text-slate-500">
          <a href="#" class="hover:text-white transition-colors">Terms</a>
          <a href="#" class="hover:text-white transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  </div>
</template>
