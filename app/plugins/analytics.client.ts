export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    const measurementId = config.public.googleAnalyticsId

    const enableAnalytics = () => {
        if (!measurementId || measurementId === 'G-MEASUREMENT_ID') {
            console.warn('Google Analytics Measurement ID not set or is placeholder.')
            return
        }

        if (document.getElementById('ga-script')) return

        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
        script.id = 'ga-script'
        document.head.appendChild(script)

        window.dataLayer = window.dataLayer || []
        function gtag(...args: any[]) {
            window.dataLayer.push(args)
        }
        window.gtag = gtag
        gtag('js', new Date())
        gtag('config', measurementId)
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
