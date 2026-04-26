<template>
  <div class="login-hero-skeleton">
    <div class="skeleton-layer skeleton-bg"></div>
    <div class="skeleton-layer skeleton-mountain"></div>
    <div class="skeleton-layer skeleton-tree-1"></div>
    <div class="skeleton-layer skeleton-tree-2"></div>
    <div class="skeleton-layer skeleton-ground"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页 Hero Banner 骨架屏
 *
 * @author Wangsongsong
 * @date 2026-04-26
 */
</script>

<style scoped lang="scss">
.login-hero-skeleton {
  position: relative;
  width: 100%;
  height: clamp(150px, 16vw, 260px);
  overflow: hidden;
  background: linear-gradient(180deg, #f5f0e8 0%, #ebe4d8 100%);
}

.skeleton-layer {
  position: absolute;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-bg {
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(255, 248, 230, 0.6) 0%,
    rgba(245, 240, 232, 0.4) 100%
  );
}

.skeleton-mountain {
  bottom: 30%;
  left: 10%;
  width: 80%;
  height: 35%;
  background: rgba(220, 210, 195, 0.5);
  border-radius: 50% 50% 0 0;
  clip-path: polygon(0% 100%, 20% 40%, 40% 60%, 60% 30%, 80% 50%, 100% 100%);
}

.skeleton-tree-1 {
  bottom: 25%;
  left: 15%;
  width: 60px;
  height: 120px;
  background: rgba(200, 190, 175, 0.6);
  border-radius: 50% 50% 0 0;
}

.skeleton-tree-2 {
  bottom: 25%;
  right: 20%;
  width: 80px;
  height: 140px;
  background: rgba(200, 190, 175, 0.6);
  border-radius: 50% 50% 0 0;
}

.skeleton-ground {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  background: linear-gradient(
    180deg,
    rgba(235, 228, 216, 0.8) 0%,
    rgba(225, 218, 206, 0.9) 100%
  );
}

// 深色模式适配
.login--dark .login-hero-skeleton {
  background: linear-gradient(180deg, #1a1c22 0%, #14161a 100%);
}

.login--dark .skeleton-bg {
  background: linear-gradient(
    180deg,
    rgba(40, 35, 25, 0.6) 0%,
    rgba(30, 28, 24, 0.4) 100%
  );
}

.login--dark .skeleton-mountain {
  background: rgba(50, 45, 40, 0.5);
}

.login--dark .skeleton-tree-1,
.login--dark .skeleton-tree-2 {
  background: rgba(60, 55, 50, 0.6);
}

.login--dark .skeleton-ground {
  background: linear-gradient(
    180deg,
    rgba(35, 33, 30, 0.8) 0%,
    rgba(25, 23, 20, 0.9) 100%
  );
}
</style>
