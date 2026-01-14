<template>
  <div class="truck-scene">
    <img src="/img/volvo.jpeg" alt="Volvo Truck" class="truck-image" />
  </div>
</template>

<style scoped>
.truck-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.truck-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
