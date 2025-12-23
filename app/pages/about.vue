<template>
  <div class="space-y-8">
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold text-white tracking-tight">{{ $t('about_title') }}</h1>
      <p class="text-slate-400 max-w-2xl mx-auto text-lg">
        {{ $t('about_subtitle') }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-bold text-swu-primary mb-4">
          {{ $t('what_is_this') }}
        </h2>
        <p class="text-slate-300 leading-relaxed">
          {{ $t('what_is_this_text') }}
        </p>
      </div>

      <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg">
        <h2 class="text-xl font-bold text-swu-primary mb-4">
          {{ $t('community_project') }}
        </h2>
        <i18n-t keypath="community_text" tag="p" class="text-slate-300 leading-relaxed">
          <template #author>
            <a href="https://github.com/alexandreroman" target="_blank"
              class="text-swu-primary hover:text-white font-bold transition-colors underline decoration-swu-primary/30 hover:decoration-swu-primary">NotAlex</a>
          </template>
          <template #source>
            <a href="https://github.com/swulimited/swulimited.com" target="_blank"
              class="text-swu-primary hover:text-white font-bold transition-colors underline decoration-swu-primary/30 hover:decoration-swu-primary">{{
                $t('community_link') }}</a>
          </template>
        </i18n-t>
      </div>
    </div>

    <div class="bg-swu-900/50 backdrop-blur-sm border border-swu-primary/20 rounded-xl p-6 shadow-lg max-w-4xl mx-auto">
      <h2 class="text-xl font-bold text-swu-primary mb-4">{{ $t('legal_disclaimer') }}</h2>
      <p class="text-slate-400 text-sm leading-relaxed">
        {{ $t('disclaimer') }}
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: t('about_meta_title'),
  description: t('about_meta_desc'),
  ogTitle: t('about_meta_title'),
  ogDescription: t('about_meta_desc'),
})
</script>
