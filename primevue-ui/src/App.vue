<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppMenu from '@/components/AppMenu.vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleDark } = useDarkMode()

const collapsed = ref(false)
const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="layout-wrapper" :class="{ 'layout-collapsed': collapsed }">
    <!-- Desktop sidebar: brand + collapse caret, then navigation. Collapses to icons. -->
    <aside class="layout-sidebar">
      <div class="layout-sidebar-header">
        <RouterLink to="/" class="layout-brand">
          <img src="@/assets/ui-logo.svg" alt="" class="layout-brand-logo" />
          <span class="layout-brand-title text-lg">Expense Divider</span>
        </RouterLink>
        <Button
          class="layout-collapse-button"
          :icon="collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          :aria-label="collapsed ? 'Expand navigation' : 'Collapse navigation'"
          severity="secondary"
          text
          rounded
          size="small"
          @click="collapsed = !collapsed"
        />
      </div>
      <AppMenu />
    </aside>

    <!-- Mobile navigation -->
    <Drawer v-model:visible="mobileMenuOpen" class="layout-drawer">
      <template #header>
        <RouterLink to="/" class="layout-brand" @click="mobileMenuOpen = false">
          <img src="@/assets/ui-logo.svg" alt="" class="layout-brand-logo" />
          <span class="layout-brand-title text-lg">Expense Divider</span>
        </RouterLink>
      </template>
      <AppMenu @navigate="mobileMenuOpen = false" />
    </Drawer>

    <header class="layout-topbar">
      <Button
        class="layout-mobile-menu-button"
        icon="pi pi-bars"
        aria-label="Open navigation"
        severity="secondary"
        text
        rounded
        @click="mobileMenuOpen = true"
      />
      <Button
        class="layout-topbar-end"
        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        severity="secondary"
        text
        rounded
        @click="toggleDark"
      />
    </header>

    <main class="layout-main">
      <RouterView />
    </main>

    <Toast position="top-right" />
    <ConfirmDialog :draggable="false" style="width: 22rem" />
  </div>
</template>

<style scoped>
/* Layout dimensions — defined once; offsets below derive from these.
   Colors come from Lara tokens only. */
.layout-wrapper {
  --layout-topbar-height: 4rem;
  --layout-sidebar-width: 16rem;
  --layout-sidebar-collapsed-width: 4rem;
  --layout-content-padding: 2rem;
  --layout-transition: var(--p-transition-duration) ease;
  --layout-sidebar-current: var(--layout-sidebar-width);
}

/* ---------- Sidebar ---------- */
.layout-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--layout-sidebar-current);
  display: flex;
  flex-direction: column;
  background: var(--p-content-background);
  border-right: 1px solid var(--p-content-border-color);
  overflow: hidden auto;
  z-index: 1001;
  transition: width var(--layout-transition);
}

.layout-sidebar-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.5rem;
  height: var(--layout-topbar-height);
  padding: 0 0.5rem 0 1rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.layout-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  color: var(--p-text-color);
  font-weight: var(--p-card-title-font-weight);
  text-decoration: none;
}
.layout-brand-logo {
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
}
.layout-brand-title {
  white-space: nowrap;
  overflow: hidden;
}

.layout-collapse-button {
  margin-left: auto;
  flex-shrink: 0;
}

/* ---------- Topbar ---------- */
.layout-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: var(--layout-sidebar-current);
  height: var(--layout-topbar-height);
  display: flex;
  align-items: center;
  padding: 0 var(--layout-content-padding);
  background: var(--p-content-background);
  border-bottom: 1px solid var(--p-content-border-color);
  z-index: 1000;
  transition: left var(--layout-transition);
}
.layout-topbar-end {
  margin-left: auto;
}
.layout-mobile-menu-button {
  display: none;
}

/* ---------- Content ---------- */
.layout-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: calc(var(--layout-topbar-height) + var(--layout-content-padding)) var(--layout-content-padding)
    var(--layout-content-padding) calc(var(--layout-sidebar-current) + var(--layout-content-padding));
  transition: padding-left var(--layout-transition);
}

/* ---------- Desktop: collapsed to icons; hover to peek ---------- */
@media (min-width: 992px) {
  .layout-collapsed {
    --layout-sidebar-current: var(--layout-sidebar-collapsed-width);
  }
  .layout-collapsed .layout-sidebar:hover {
    width: var(--layout-sidebar-width);
    box-shadow: var(--p-overlay-navigation-shadow);
  }
  .layout-collapsed .layout-sidebar:not(:hover) .layout-sidebar-header {
    justify-content: center;
    padding: 0;
  }
  .layout-collapsed .layout-sidebar:not(:hover) .layout-brand-title,
  .layout-collapsed .layout-sidebar:not(:hover) .layout-collapse-button {
    display: none;
  }
  /* Labels keep their line height (rows don't shrink) but take no width */
  .layout-collapsed .layout-sidebar:not(:hover) :deep(.p-menu-item-link) {
    justify-content: center;
    gap: 0;
  }
  .layout-collapsed .layout-sidebar:not(:hover) :deep(.p-menu-item-label) {
    width: 0;
    overflow: hidden;
  }
}

/* ---------- Mobile: sidebar replaced by the Drawer ---------- */
@media (max-width: 991.98px) {
  .layout-wrapper {
    --layout-sidebar-current: 0px;
    --layout-content-padding: 1rem;
  }
  .layout-sidebar {
    display: none;
  }
  .layout-mobile-menu-button {
    display: inline-flex;
  }
}
</style>
