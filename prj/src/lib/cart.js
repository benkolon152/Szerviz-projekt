import { browser } from "$app/environment";
import { writable } from "svelte/store";

const STORAGE_KEY = "cart-items";
const CART_OPEN_KEY = "cart-open";

function loadStoredValue(key, fallback) {
  if (!browser) {
    return fallback;
  }

  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function persistValue(key, value) {
  if (!browser) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeQuantity(quantity) {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return 1;
  }

  return Math.min(99, Math.floor(numericQuantity));
}

function createCartStore() {
  const items = writable(loadStoredValue(STORAGE_KEY, []));

  if (browser) {
    items.subscribe((value) => {
      persistValue(STORAGE_KEY, value);
    });
  }

  return {
    subscribe: items.subscribe,
    addItem(product, quantity = 1) {
      if (!product) {
        return;
      }

      const itemQuantity = normalizeQuantity(quantity);
      const productId = product.id ?? product.itemId ?? product.name;

      items.update((currentItems) => {
        const existingIndex = currentItems.findIndex((item) => item.id === productId);

        if (existingIndex >= 0) {
          const nextItems = [...currentItems];
          const existingItem = nextItems[existingIndex];
          nextItems[existingIndex] = {
            ...existingItem,
            quantity: Math.min(99, normalizeQuantity(existingItem.quantity) + itemQuantity),
          };
          return nextItems;
        }

        return [
          ...currentItems,
          {
            id: productId,
            name: product.name || product.model || "Névtelen termék",
            image_url: product.image_url || "",
            price_huf: Number(product.price_huf ?? 0),
            category: product.category || "",
            brand: product.brand || "",
            model: product.model || "",
            specifications: product.specifications || null,
            quantity: itemQuantity,
          },
        ];
      });
    },
    updateQuantity(productId, quantity) {
      const nextQuantity = normalizeQuantity(quantity);

      items.update((currentItems) =>
        currentItems
          .map((item) =>
            item.id === productId
              ? {
                  ...item,
                  quantity: nextQuantity,
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem(productId) {
      items.update((currentItems) => currentItems.filter((item) => item.id !== productId));
    },
    clear() {
      items.set([]);
    },
  };
}

function createCartOpenStore() {
  const openState = writable(loadStoredValue(CART_OPEN_KEY, false));

  if (browser) {
    openState.subscribe((value) => {
      persistValue(CART_OPEN_KEY, Boolean(value));
    });
  }

  return {
    subscribe: openState.subscribe,
    open() {
      openState.set(true);
    },
    close() {
      openState.set(false);
    },
    toggle() {
      openState.update((value) => !value);
    },
  };
}

export const cart = createCartStore();
export const cartOpen = createCartOpenStore();
