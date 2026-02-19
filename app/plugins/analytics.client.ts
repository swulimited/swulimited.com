export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const measurementId = config.public.googleAnalyticsId
    const router = useRouter()

    // Standard gtag implementation
    const gtag = function (...args: any[]) {
        if (!import.meta.client) return

        // Check consent
        const consent = localStorage.getItem('cookie_consent')
        if (consent !== 'true') return

        window.dataLayer = window.dataLayer || []
        window.dataLayer.push(arguments)
    }

    // Initialize globally if in client
    if (import.meta.client) {
        window.dataLayer = window.dataLayer || []
        window.gtag = gtag as any
    }

    const enableAnalytics = () => {
        if (!measurementId || measurementId === 'G-MEASUREMENT_ID') {
            console.warn('Google Analytics Measurement ID not set or is placeholder.')
            return
        }

        if (document.getElementById('ga-script')) {
            // If already loaded, just make sure we trigger a config for current page
            gtag("config", measurementId, {
                page_path: router.currentRoute.value.fullPath,
                page_title: document.title
            })
            return
        }

        // Initialize and load script
        gtag("js", new Date())
        gtag("config", measurementId, {
            page_path: router.currentRoute.value.fullPath,
            page_title: document.title
        })

        const script = document.createElement('script')
        script.id = 'ga-script'
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
        document.head.appendChild(script)


    }

    // Handle initial load
    if (import.meta.client) {
        const consent = localStorage.getItem('cookie_consent')
        if (consent === 'true') {
            enableAnalytics()
        }

        // Track route changes
        router.afterEach(async (to) => {
            await nextTick()
            const consent = localStorage.getItem('cookie_consent')
            if (consent === 'true') {
                gtag('config', measurementId, {
                    page_path: to.fullPath,
                    page_title: document.title
                })
            }
        })
    }

    return {
        provide: {
            enableAnalytics,
            trackEvent: (name: string, params?: any) => {
                gtag('event', name, params)
            }
        }
    }
})

declare global {
    interface Window {
        dataLayer: any[]
        gtag: (...args: any[]) => void
    }
}

