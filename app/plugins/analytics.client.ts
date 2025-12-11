export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const measurementId = config.public.googleAnalyticsId

    const enableAnalytics = () => {
        if (!measurementId || measurementId === 'G-MEASUREMENT_ID') {
            console.warn('Google Analytics Measurement ID not set or is placeholder.')
            return
        }

        if (document.getElementById('ga-script')) return

        const { googleAnalyticsId } = useRuntimeConfig().public;
        function gtag() {
            window.dataLayer.push(arguments);
        }

        window.dataLayer = window.dataLayer || [];

        gtag("js", new Date());
        gtag("config", googleAnalyticsId);

        useHead({
            script: [
                {
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
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
            enableAnalytics
        }
    }
})

declare global {
    interface Window {
        dataLayer: any[]
        gtag: (...args: any[]) => void
    }
}
