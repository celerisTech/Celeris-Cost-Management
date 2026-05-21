import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 🔹 Store to handle which auth screen (login/signup/forgot)
export const useAuthScreenStore = create(
  persist(
    (set) => ({
      currentScreen: 'login',
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
    }),
    { name: 'auth-screen-store' }
  )
);

// 🔹 Store for user + navLinks (from privileges)
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      navLinks: {}, // 👈 allowed nav links for this user
      navLinksTimestamp: null, // 👈 Track when navLinks were last updated

      setUser: (user) => set({ user }),

      // 👇 Enhanced setNavLinks with timestamp
      setNavLinks: (links) => set({
        navLinks: links,
        navLinksTimestamp: Date.now()
      }),

      // 👇 Clear auth data
      clearAuth: () => set({
        user: null,
        navLinks: {},
        navLinksTimestamp: null
      }),

      // 👇 Check if navLinks are stale
      areNavLinksStale: () => {
        const state = get();
        if (!state.navLinks || Object.keys(state.navLinks).length === 0) return true;
        if (!state.navLinksTimestamp) return true;

        // Consider links stale after 1 hour (adjust time as needed)
        const STALE_THRESHOLD = 60 * 60 * 1000; // 1 hour in ms
        return Date.now() - state.navLinksTimestamp > STALE_THRESHOLD;
      },

      // 👇 Function to refresh navLinks
      refreshNavLinks: async (force = false) => {
        const state = get();
        if (!state.user || !state.user.id) return;

        // Skip if not stale and not forced
        if (!force && !state.areNavLinksStale()) return;

        try {
          const res = await fetch(`/api/nav-links?userId=${state.user.id}&_t=${Date.now()}`, {
            headers: {
              'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            }
          });

          if (!res.ok) throw new Error('Failed to refresh navigation');

          const data = await res.json();
          if (data?.success && data?.data) {
            set({
              navLinks: data.data,
              navLinksTimestamp: Date.now()
            });
            console.log('Navigation links refreshed');
          }
        } catch (error) {
          console.error('Failed to refresh navigation:', error);
          // Don't update timestamp on failure
        }
      }
    }),
    {
      name: 'auth-store',
      // 👇 Optimize storage by only storing what's needed
      partialize: (state) => ({
        user: state.user,
        navLinks: state.navLinks,
        navLinksTimestamp: state.navLinksTimestamp,
      }),
      // 👇 Use more efficient storage mechanism
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// 🔹 Store for notifications
export const useNotificationStore = create(
  persist(
    (set) => ({
      notifications: [],
      setNotifications: (next) =>
        set((state) => ({
          notifications:
            typeof next === 'function'
              ? next(Array.isArray(state.notifications) ? state.notifications : [])
              : (Array.isArray(next) ? next : []),
        })),
    }),
    { name: 'notification-store' }
  )
);
