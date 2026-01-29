<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="suave">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
</template>

<style>
/* IMPORTANTE: sin scoped */
.suave-enter-active, .suave-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.suave-enter-from, .suave-leave-to {
  opacity: 0;
  transform: scale(0.99);
}
</style>