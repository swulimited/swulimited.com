<script setup lang="ts">
useSeoMeta({
  title: 'swulimited.com',
  description: 'Practice Star Wars Unlimited sealed format online. Open virtual booster packs, build decks, and prepare for your next event.',
  ogTitle: 'swulimited.com',
  ogDescription: 'The best tool to practice Star Wars Unlimited sealed deck format. Open booster packs, build your deck, and export it for tournaments.',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-2 text-center">
    <div class="flex flex-row gap-4 md:gap-10 items-center justify-center mt-2">
      <NuxtLink to="/sets/LOF"
        class="group relative block w-36 md:w-52 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-swu-primary/50 rounded-xl">
        <img src="/images/LOF-cover.jpg" alt="Legends of the Force"
          class="w-full h-auto rounded-xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent group-hover:border-swu-primary" />
      </NuxtLink>

      <NuxtLink to="/sets/SEC"
        class="group relative block w-36 md:w-52 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-swu-accent/50 rounded-xl">
        <img src="/images/SEC-cover.jpg" alt="Secrets of Power"
          class="w-full h-auto rounded-xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent group-hover:border-swu-accent" />
      </NuxtLink>
    </div>
  </div>
</template>
