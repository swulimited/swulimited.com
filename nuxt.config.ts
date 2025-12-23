// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' }
    ],
    lazy: true,
    langDir: '../app/locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'swu_i18n',
      redirectOn: 'root',
    }
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'swulimited.com',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      googleAnalyticsId: 'G-WWBPWFQLPX'
    }
  }
})