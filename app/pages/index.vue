
<template>
  <div class="flex flex-col items-center justify-center py-20 text-center">
    <div class="mb-12">
      <h1 class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-swu-primary to-swu-accent mb-6 drop-shadow-md">
        swusealed.net
      </h1>
      <p class="text-2xl text-slate-300 font-light tracking-wide">
        Sealed Simulator for Star Wars Unlimited
      </p>
    </div>

    <div class="flex gap-6">
      <NuxtLink 
        to="/sets/lof"
        class="group relative px-8 py-4 bg-swu-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-swu-primary/20 hover:border-swu-primary"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-swu-primary/20 to-swu-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span class="relative text-xl font-semibold text-swu-primary group-hover:text-white transition-colors">
          View LOF Set
        </span>
      </NuxtLink>

      <NuxtLink 
        to="/sets/sec"
        class="group relative px-8 py-4 bg-swu-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-swu-primary/20 hover:border-swu-accent"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-swu-secondary/20 to-swu-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span class="relative text-xl font-semibold text-swu-accent group-hover:text-white transition-colors">
          View SEC Set
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
