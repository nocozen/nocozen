import { addAPIProvider, addCollection } from '@iconify/vue';

let isMdiLoaded = false; // 单例标记

async function setupMdi() {
  if (!isMdiLoaded) {
    try {
      const mdiIcons = await import("@iconify/json/json/mdi.json");
      addCollection(mdiIcons);
      isMdiLoaded = true;
    } catch (err) {
      console.error("Failed to load MDI icons:", err);
    }
  }
}

/** Setup the iconify offline */
export async function setupIconifyOffline() {
  const { VITE_ICONIFY_URL } = import.meta.env;

  if (VITE_ICONIFY_URL) {
    addAPIProvider('', { resources: [VITE_ICONIFY_URL] });
  }
  await setupMdi();
}