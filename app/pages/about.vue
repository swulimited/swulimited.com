<template>
  <div class="space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold text-white tracking-tight">About swulimited.com</h1>
      <p class="text-slate-400 max-w-2xl mx-auto text-lg">
        The ultimate tool for Star Wars Unlimited sealed deck practice.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-bold text-swu-primary mb-4">
          What is this?
        </h2>
        <p class="text-slate-300 leading-relaxed">
          swulimited.com is a fan-made application designed to simulate the sealed format of the Star Wars Unlimited trading card game. 
          It allows players to open virtual booster packs, build decks from a limited pool of cards, and practice their deck-building skills without needing physical cards.
        </p>
      </div>

      <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-bold text-swu-primary mb-4">
          Community Project
        </h2>
        <p class="text-slate-300 leading-relaxed">
          This project is built by <a href="https://github.com/alexandreroman" target="_blank" class="text-swu-primary hover:text-white font-bold transition-colors underline decoration-swu-primary/30 hover:decoration-swu-primary">NotAlex</a>, a Star Wars Unlimited player.
          My goal is to provide a smooth and beautiful interface for the community to enjoy and improve their game.
          Feel free to reach out and contribute: <a href="https://github.com/swulimited/swulimited.com" target="_blank" class="text-swu-primary hover:text-white font-bold transition-colors underline decoration-swu-primary/30 hover:decoration-swu-primary">the code is open source</a>!
        </p>
      </div>
    </div>
    
    <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg max-w-4xl mx-auto">
      <h2 class="text-xl font-bold text-swu-primary mb-4">Legal Disclaimer</h2>
      <p class="text-slate-400 text-sm leading-relaxed">
        The information presented on this site about Star Wars Unlimited, both literal and graphical, is copyrighted by Fantasy Flight Games and Lucasfilm Ltd. 
        This website is not produced, endorsed, supported, or affiliated with Fantasy Flight Games and/or Lucasfilm Ltd.
        All card images and symbols are property of their respective owners.
      </p>
    </div>


  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About swulimited.com',
  meta: [
    { name: 'description', content: 'Learn more about swulimited.com, a fan-made tool for Star Wars Unlimited sealed deck simulation.' }
  ]
})
</script>
