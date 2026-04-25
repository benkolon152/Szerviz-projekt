<script>
  let isCartOpen = false;

  function openCart() {
    isCartOpen = true;
  }

  function closeCart() {
    isCartOpen = false;
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

  <div class="cart-body">
    <h3>URES A KOSARAD!</h3>
    <p>Nem muszaj hogy igy legyen. Nezz korul a Shopban tobb ezer jo ajanlatert!</p>
    <a href="/shop" class="shop-link" on:click={closeCart}>Tovabb a shopba</a>
  </div>
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
