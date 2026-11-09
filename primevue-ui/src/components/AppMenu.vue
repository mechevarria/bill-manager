<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'

defineEmits<{ navigate: [] }>()

const route = useRoute()

const items: MenuItem[] = [
  { label: 'Bills', icon: 'pi pi-list', route: '/' },
  { label: 'Chart', icon: 'pi pi-chart-line', route: '/chart' },
  { label: 'Search', icon: 'pi pi-search', route: '/search' },
  { label: 'Defaults', icon: 'pi pi-cog', route: '/defaults' },
  { label: 'Data', icon: 'pi pi-database', route: '/data' },
]

function isActive(to: string): boolean {
  // Bills lives at "/" and also owns /bills/:id detail routes
  if (to === '/') return route.path === '/' || route.path.startsWith('/bills/')
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <!-- PrimeVue Menu with router links (pattern from the PrimeVue Menu "Router" docs) -->
  <nav class="app-menu">
    <Menu :model="items">
      <template #item="{ item, props }">
        <RouterLink v-slot="{ href, navigate }" :to="item.route" custom>
          <a
            v-bind="props.action"
            :href="href"
            :title="item.label as string"
            :class="{ 'app-menu-active': isActive(item.route) }"
            :aria-current="isActive(item.route) ? 'page' : undefined"
            @click="
              (e) => {
                navigate(e)
                $emit('navigate')
              }
            "
          >
            <span :class="[item.icon, 'p-menu-item-icon']" />
            <span class="p-menu-item-label">{{ item.label }}</span>
          </a>
        </RouterLink>
      </template>
    </Menu>
  </nav>
</template>

<style scoped>
/* The menu fills its container (sidebar or drawer), so drop its own frame.
   Menu renders a fragment root, so it is styled through a wrapper + :deep(). */
.app-menu :deep(.p-menu) {
  border: 0;
  border-radius: 0;
  min-width: 0;
  background: transparent;
}

/* Current page uses the theme's selection colors. */
.app-menu :deep(.app-menu-active),
.app-menu :deep(.app-menu-active .p-menu-item-icon) {
  background: var(--p-highlight-background);
  color: var(--p-highlight-color);
}
</style>
