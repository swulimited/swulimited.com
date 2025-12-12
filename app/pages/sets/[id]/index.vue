<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Generate a random seed and redirect to the seeded URL
onMounted(() => {
    const seed = Math.random().toString(36).substring(7)
    const setId = route.params.id as string
    router.replace(`/sets/${setId}/${seed}`)
})
</script>

<template>
    <div class="flex items-center justify-center min-h-[50vh]">
        <div class="animate-pulse text-swu-primary">Initializing sealed pool...</div>
    </div>
</template>
