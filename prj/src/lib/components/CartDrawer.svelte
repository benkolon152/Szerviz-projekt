<script>
  import { cart, cartOpen } from "$lib/cart";
  import { goto } from "$app/navigation";

  let isCartOpen = false;
  let cartItems = [];
  let cartTotal = 0;

  $: isCartOpen = $cartOpen;
  $: cartItems = $cart;
  $: cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price_huf || 0) * Number(item.quantity || 0), 0);

  function openCart() {
    cartOpen.open();
  }

  function closeCart() {
    cartOpen.close();
  }

  function removeItem(itemId) {
    cart.removeItem(itemId);
  }

  function changeQuantity(itemId, event) {
    const nextQuantity = Number(event.currentTarget.value);
    cart.updateQuantity(itemId, nextQuantity);
  }

  function goToCheckout() {
    closeCart();
    goto("/checkout");
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeCart();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<li class="cart-nav-item">
  <button
    class="cart-trigger"
    type="button"
    on:click={openCart}
    aria-label="Kosar megnyitasa"
    aria-expanded={isCartOpen}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.17 14h9.92c.75 0 1.41-.41 1.75-1.03L22 6.5l-1.74-1-3.09 5.5H8.1L4.27 3H1v2h2l3.6 7.59-1.35 2.44C4.52 16.37 5.48 18 7 18h12v-2H7l1.17-2Z" />
    </svg>
    <span>Kosar</span>
    {#if cartItems.length > 0}
      <strong class="cart-badge">{cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
    {/if}
  </button>
</li>

<div
  class="cart-overlay"
  class:open={isCartOpen}
  on:click={closeCart}
  aria-hidden={!isCartOpen}
></div>

<aside class="cart-drawer" class:open={isCartOpen} aria-hidden={!isCartOpen}>
  <div class="cart-head">
    <h2>Kosar</h2>
    <button type="button" class="cart-close" on:click={closeCart} aria-label="Kosar bezarasa">x</button>
  </div>

  {#if cartItems.length === 0}
    <div class="cart-body empty-state">
      <h3>URES A KOSARAD!</h3>
      <p>Nem muszaj hogy igy legyen. Nezz korul a Shopban tobb ezer jo ajanlatert!</p>
      <a href="/shop" class="shop-link" on:click={closeCart}>Tovabb a shopba</a>
    </div>
  {:else}
    <div class="cart-body cart-list">
      {#each cartItems as item}
        <article class="cart-item">
          <img class="cart-item-image" src={item.image_url} alt={item.name} />
          <div class="cart-item-content">
            <h3>{item.name}</h3>
            <p>{new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(Number(item.price_huf || 0)).replace("HUF", "Ft")}</p>
            <div class="cart-item-controls">
              <label>
                Db
                <input type="number" min="1" max="99" value={item.quantity} on:change={(event) => changeQuantity(item.id, event)} />
              </label>
              <button type="button" class="remove-button" on:click={() => removeItem(item.id)}>Eltávolítás</button>
            </div>
          </div>
        </article>
      {/each}

      <div class="cart-summary">
        <div>
          <span>Összesen</span>
          <strong>{new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(cartTotal).replace("HUF", "Ft")}</strong>
        </div>
        <button type="button" class="checkout-button" on:click={goToCheckout}>Tovább a fizetéshez</button>
      </div>
    </div>
  {/if}
</aside>

<style>
  .cart-nav-item {
    padding: 0;
  }

  .cart-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    border-radius: 999px;
    padding: 7px 12px;
    font: inherit;
    cursor: pointer;
    position: relative;
  }

  .cart-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: #ff4d4d;
    color: white;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .cart-trigger svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }

  .cart-overlay {
    position: fixed;
    inset: 0;
    background: rgba(6, 3, 13, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
    z-index: 999;
  }

  .cart-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .cart-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: min(560px, 100vw);
    height: 100vh;
    background: #f2f2f3;
    color: #111;
    transform: translateX(100%);
    transition: transform 220ms ease;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.22);
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  .cart-drawer.open {
    transform: translateX(0);
  }

  .cart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 28px;
    border-bottom: 1px solid #ddd;
  }

  .cart-head h2 {
    margin: 0;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cart-close {
    border: none;
    background: transparent;
    color: #353535;
    font-size: 1.4rem;
    cursor: pointer;
  }

  .cart-body {
    padding: 28px;
  }

  .cart-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    height: calc(100vh - 73px);
  }

  .cart-item {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 12px;
    background: white;
    border: 1px solid #e3e6f3;
    border-radius: 12px;
    padding: 12px;
  }

  .cart-item-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    background: #f4f6fb;
    border-radius: 10px;
  }

  .cart-item-content h3 {
    margin: 0 0 6px;
    font-size: 1rem;
    color: #161f53;
  }

  .cart-item-content p {
    margin: 0 0 10px;
    color: #111;
    font-weight: 700;
  }

  .cart-item-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .cart-item-controls label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #4f5883;
  }

  .cart-item-controls input {
    width: 62px;
    border: 1px solid #d0d6ea;
    border-radius: 8px;
    padding: 6px 8px;
  }

  .remove-button {
    border: none;
    background: transparent;
    color: #e44c4c;
    cursor: pointer;
    padding: 0;
  }

  .cart-summary {
    margin-top: auto;
    display: grid;
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid #dfe3ef;
  }

  .cart-summary div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .cart-summary span {
    color: #5a6187;
  }

  .cart-summary strong {
    color: #111;
    font-size: 1.15rem;
  }

  .checkout-button {
    border: none;
    border-radius: 8px;
    background: #08a93f;
    color: white;
    font-weight: 800;
    padding: 12px 16px;
    cursor: pointer;
  }

  .cart-body h3 {
    margin: 0 0 24px;
    color: #172038;
    font-size: 2rem;
    line-height: 1.1;
  }

  .cart-body p {
    margin: 0 0 26px;
    color: #575757;
    font-size: 1.1rem;
    line-height: 1.4;
    max-width: 32ch;
  }

  .shop-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    text-decoration: none;
    background: #2260e8;
    color: white;
    padding: 12px 24px;
    font-weight: 700;
  }

  .shop-link:hover {
    background: #1b4ec0;
  }
</style>
