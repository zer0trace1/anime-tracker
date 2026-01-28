<template>
  <RouterView v-slot="{ Component }">
    <Transition name="suave" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.suave-enter-active, .suave-leave-active { transition: opacity .18s ease, transform .18s ease; }
.suave-enter-from, .suave-leave-to { opacity: 0; transform: translateY(6px); }
</style>
