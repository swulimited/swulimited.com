export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const measurementId = config.public.googleAnalyticsId

    const gtag = (...args: any[]) => {
        if (!import.meta.client) return
        const consent = localStorage.getItem('cookie_consent')
        if (consent !== 'true') return

        window.dataLayer = window.dataLayer || []
        window.dataLayer.push(args)
    }


    const enableAnalytics = () => {
        if (!measurementId || measurementId === 'G-MEASUREMENT_ID') {
            console.warn('Google Analytics Measurement ID not set or is placeholder.')
            return
        }

        if (document.getElementById('ga-script')) return

        window.dataLayer = window.dataLayer || [];
        gtag("js", new Date());
        gtag("config", measurementId);

        useHead({
            script: [
                {
                    id: 'ga-script',
                    src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
                    async: true,
                },
            ],
        });
        console.log('Google Analytics initialized with ID:', measurementId)
    }

    if (import.meta.client) {
        const consent = localStorage.getItem('cookie_consent')
        if (consent === 'true') {
            enableAnalytics()
        }
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

