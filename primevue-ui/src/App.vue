<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleDark } = useDarkMode()
const route = useRoute()

const staticInactive = ref(false)
const mobileActive = ref(false)

interface NavItem {
  to: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { to: '/', label: 'Bills', icon: 'pi pi-list' },
  { to: '/chart', label: 'Chart', icon: 'pi pi-chart-line' },
  { to: '/search', label: 'Search', icon: 'pi pi-search' },
  { to: '/system', label: 'System', icon: 'pi pi-cog' },
]

const containerClass = computed(() => ({
  'layout-static-inactive': staticInactive.value,
  'layout-mobile-active': mobileActive.value,
}))

function toggleMenu() {
  if (window.innerWidth < 992) {
    mobileActive.value = !mobileActive.value
  } else {
    staticInactive.value = !staticInactive.value
  }
}

function onMenuItemClick() {
  if (mobileActive.value) mobileActive.value = false
}

function isItemActive(to: string): boolean {
  // Bills lives at "/" and also owns /bills/:id detail routes
  if (to === '/') {
    return route.path === '/' || route.path.startsWith('/bills/')
  }
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <div class="layout-wrapper" :class="containerClass">
    <!-- Full-width topbar -->
    <div class="layout-topbar">
      <div class="layout-topbar-logo-container">
        <button
          type="button"
          class="layout-topbar-action layout-menu-button"
          aria-label="Toggle navigation"
          @click="toggleMenu"
        >
          <i class="pi pi-bars" />
        </button>
        <RouterLink to="/" class="layout-topbar-logo">
          <img src="@/assets/ui-logo.svg" alt="Expense Divider" class="brand-logo" />
          <span>Expense Divider</span>
        </RouterLink>
      </div>

      <div class="layout-topbar-actions">
        <button
          type="button"
          class="layout-topbar-action"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleDark"
        >
          <i :class="['pi', isDark ? 'pi-sun' : 'pi-moon']" />
        </button>
      </div>
    </div>

    <!-- Floating sidebar card -->
    <div class="layout-sidebar">
      <nav class="layout-menu">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          v-slot="{ href, navigate }"
          :to="item.to"
          custom
        >
          <a
            :href="href"
            class="layout-menuitem"
            :class="{ 'is-active': isItemActive(item.to) }"
            @click="(e) => { navigate(e); onMenuItemClick() }"
          >
            <i :class="item.icon" />
            <span class="layout-menuitem-label">{{ item.label }}</span>
          </a>
        </RouterLink>
      </nav>
    </div>

    <!-- Main content -->
    <div class="layout-main-container">
      <div class="layout-main">
        <RouterView />
      </div>
    </div>

    <!-- Click-outside mask for mobile -->
    <div class="layout-mask" @click="mobileActive = false" />

    <Toast position="top-right" />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
}

/* ---------- Topbar (full width, fixed) ---------- */
.layout-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4rem;
  background: var(--p-content-background, #ffffff);
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  z-index: 1000;
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 0.03),
    0 1px 6px -1px rgb(0 0 0 / 0.02),
    0 2px 4px 0 rgb(0 0 0 / 0.02);
}

.layout-topbar-logo-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.layout-topbar-action {
  background: transparent;
  border: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  color: var(--p-text-color, #374151);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
}
.layout-topbar-action:hover {
  background: color-mix(in srgb, var(--p-text-color, #374151) 8%, transparent);
}
.layout-topbar-action .pi {
  font-size: 1.1rem;
}

.layout-topbar-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--p-text-color, #1f2937);
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0 0.5rem;
}
.layout-topbar-logo .brand-logo {
  width: 1.75rem;
  height: 1.75rem;
  display: block;
}

.layout-topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ---------- Sidebar (floating card) ---------- */
.layout-sidebar {
  position: fixed;
  top: 5rem;
  left: 1rem;
  width: 16rem;
  bottom: 1rem;
  background: var(--p-content-background, #ffffff);
  border-radius: 12px;
  padding: 0.875rem 0.625rem;
  overflow-y: auto;
  z-index: 999;
  transition:
    transform 0.25s ease,
    left 0.25s ease;
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 0.03),
    0 1px 6px -1px rgb(0 0 0 / 0.02),
    0 4px 8px -2px rgb(0 0 0 / 0.04);
}

.layout-menu {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.layout-menuitem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  color: var(--p-text-color, #374151);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}
.layout-menuitem i {
  font-size: 0.95rem;
  width: 1.25rem;
  text-align: center;
  color: var(--p-text-muted-color, #6b7280);
  transition: color 0.12s ease;
}
.layout-menuitem:hover {
  background: color-mix(in srgb, var(--p-text-color, #374151) 6%, transparent);
}
.layout-menuitem.is-active {
  background: color-mix(in srgb, var(--p-primary-color, #06b6d4) 10%, transparent);
  color: var(--p-primary-color, #06b6d4);
  font-weight: 600;
}
.layout-menuitem.is-active i {
  color: var(--p-primary-color, #06b6d4);
}

/* ---------- Main container (offset by sidebar + topbar) ---------- */
.layout-main-container {
  padding: 5rem 1.5rem 1.5rem 18rem;
  min-height: 100vh;
  transition: padding-left 0.25s ease;
}

.layout-main {
  display: flex;
  flex-direction: column;
}

/* ---------- Collapsed (desktop) ---------- */
.layout-static-inactive .layout-sidebar {
  transform: translateX(calc(-100% - 1.5rem));
}
.layout-static-inactive .layout-main-container {
  padding-left: 1.5rem;
}

/* ---------- Mask (mobile overlay) ---------- */
.layout-mask {
  display: none;
}

/* ---------- Mobile breakpoint ---------- */
@media (max-width: 991.98px) {
  .layout-sidebar {
    transform: translateX(calc(-100% - 1.5rem));
  }
  .layout-main-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .layout-mobile-active .layout-sidebar {
    transform: translateX(0);
  }
  .layout-mobile-active .layout-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.4);
    z-index: 998;
  }
}
</style>
