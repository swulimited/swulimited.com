
<template>
  <div class="flex flex-col items-center justify-center py-10 text-center">
    <div class="flex flex-col md:flex-row gap-10 items-center justify-center mt-4">
      <NuxtLink 
        to="/sets/LOF"
        class="group relative block w-48 md:w-60 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-swu-primary/50 rounded-xl"
      >
        <img 
          src="/images/LOF-cover.jpg" 
          alt="LOF Set" 
          class="w-full h-auto rounded-xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent group-hover:border-swu-primary"
        />
      </NuxtLink>

      <NuxtLink 
        to="/sets/SEC"
        class="group relative block w-48 md:w-60 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-swu-accent/50 rounded-xl"
      >
        <img 
          src="/images/SEC-cover.jpg" 
          alt="SEC Set" 
          class="w-full h-auto rounded-xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent group-hover:border-swu-accent"
        />
      </NuxtLink>
    </div>
  </div>
</template>
