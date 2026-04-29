<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import CartDrawer from "$lib/components/CartDrawer.svelte";
  import { cart } from "$lib/cart";

  const API_BASE = "http://localhost:3001";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userPfp = "";
  let isAdmin = false;
  let canViewInventory = false;
  let userId = null;

  let checkoutMessage = "";
  let checkoutMessageIsError = false;
  let submitting = false;

  let customerName = "";
  let customerEmail = "";
  let postalCode = "";
  let city = "";
  let streetAddress = "";
  let phoneNumber = "";
  let savedUser = null;
  let savedAddressAvailable = false;
  let lastSavedAddress = "";

  $: cartItems = $cart;
  $: cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price_huf || 0) * Number(item.quantity || 0), 0);

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        displayName = parsedUser?.username || "Profile";
        userPfp = parsedUser?.pfp || "";
        userId = parsedUser?.id ?? null;
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
        customerEmail = parsedUser?.email || "";
        customerName = parsedUser?.username || "";
        // Autofill contact basics; keep address fields empty until user opts in
        phoneNumber = parsedUser?.phone || parsedUser?.phone_number || parsedUser?.tel || phoneNumber;
        // Keep the parsed user around so the UI can opt-in to use the saved address
        savedUser = parsedUser;
        savedAddressAvailable = Boolean(parsedUser?.shipping_address || parsedUser?.address || parsedUser?.postal_code || parsedUser?.address_line1 || parsedUser?.street);
        lastSavedAddress = parsedUser?.shipping_address || parsedUser?.address || "";
      } catch {
        displayName = "Profile";
        userPfp = "";
        userId = null;
        isAdmin = false;
        canViewInventory = false;
      }
    }
  });

  function toggle() {
    isOpen = !isOpen;
  }

  function toggleProfile() {
    isProfileOpen = !isProfileOpen;
  }

  function handleAuthAction() {
    if (isLoggedIn) {
      localStorage.removeItem("user");
      isLoggedIn = false;
      displayName = "Profile";
      userPfp = "";
      isAdmin = false;
      canViewInventory = false;
    }

    isProfileOpen = false;
    goto("/login");
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("hu-HU", {
      style: "currency",
      currency: "HUF",
      maximumFractionDigits: 0,
    }).format(price ?? 0).replace("HUF", "Ft");
  }

  async function applySavedAddress() {
    // Try user object first
    if (savedUser) {
      const savedAddress = savedUser?.shipping_address || savedUser?.address || savedUser?.address_line1 || savedUser?.street || savedUser?.address_line_1 || "";
      if (savedAddress) {
        const parts = String(savedAddress).split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          postalCode = parts[0];
          city = parts[1];
          streetAddress = parts.slice(2).join(', ');
        } else if (parts.length === 2) {
          postalCode = parts[0];
          city = parts[1];
        } else {
          streetAddress = parts[0] || "";
        }

        postalCode = postalCode || savedUser?.postal_code || savedUser?.zip || "";
        city = city || savedUser?.city || savedUser?.town || "";
        streetAddress = streetAddress || savedUser?.street_address || savedUser?.address_line2 || savedUser?.address2 || streetAddress;
        phoneNumber = phoneNumber || savedUser?.phone || savedUser?.phone_number || savedUser?.tel || phoneNumber;
        savedAddressAvailable = true;
        lastSavedAddress = savedAddress;
        return;
      }
    }

    // If userId exists, try to fetch the user's profile first (profile stores structured fields)
    if (userId) {
      try {
        const prof = await fetch(`${API_BASE}/api/users/${userId}/profile`);
        if (prof.ok) {
          const json = await prof.json().catch(() => ({}));
          const u = json.user || {};
          // profile returns city, postal_code, house_number
          if (u.postal_code || u.city || u.house_number) {
            postalCode = postalCode || (u.postal_code ? String(u.postal_code) : "");
            city = city || (u.city || "");
            streetAddress = streetAddress || (u.house_number ? String(u.house_number) : "");
            phoneNumber = phoneNumber || (u.phone_number ? String(u.phone_number) : "") || savedUser?.phone || savedUser?.phone_number || savedUser?.tel || phoneNumber;
            savedAddressAvailable = true;
            lastSavedAddress = `${postalCode}, ${city}, ${streetAddress}`;
            return;
          }
        }
      } catch (e) {
        // ignore and fallback to orders
      }

      // Fall back to fetching the user's previous orders for a saved shipping_address
      try {
        const res = await fetch(`${API_BASE}/api/users/${userId}/orders`);
        if (!res.ok) {
          savedAddressAvailable = false;
          return;
        }
        const json = await res.json().catch(() => ({}));
        const orders = json.orders || [];
        const found = (orders || []).find(o => o.shipping_address && String(o.shipping_address).trim());
        if (found) {
          const savedAddress = String(found.shipping_address || "");
          const parts = savedAddress.split(',').map(p => p.trim()).filter(Boolean);
          if (parts.length >= 3) {
            postalCode = parts[0];
            city = parts[1];
            streetAddress = parts.slice(2).join(', ');
          } else if (parts.length === 2) {
            postalCode = parts[0];
            city = parts[1];
          } else {
            streetAddress = parts[0] || "";
          }
          phoneNumber = phoneNumber || (found.phone_number || "");
          savedAddressAvailable = true;
          lastSavedAddress = savedAddress;
          return;
        }
        savedAddressAvailable = false;
      } catch (e) {
        savedAddressAvailable = false;
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (cartItems.length === 0) {
      checkoutMessage = "A kosár üres, ezért nem lehet rendelést leadni.";
      checkoutMessageIsError = true;
      return;
    }

    if (!isLoggedIn || !userId) {
      checkoutMessage = "A rendelés mentéséhez jelentkezz be, hogy az Orders menüpont alatt is lásd.";
      checkoutMessageIsError = true;
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !postalCode.trim() || !city.trim() || !streetAddress.trim()) {
      checkoutMessage = "Kérlek töltsd ki a nevet, e-mailt és a teljes szállítási címet (irányítószám, város, utca).";
      checkoutMessageIsError = true;
      return;
    }

    submitting = true;
    checkoutMessage = "";

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          shipping_address: `${postalCode.trim()}, ${city.trim()}, ${streetAddress.trim()}`,
          phone_number: phoneNumber.trim(),
          items: cartItems,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        checkoutMessage = data.message || "Nem sikerült elmenteni a rendelést.";
        checkoutMessageIsError = true;
        return;
      }

      cart.clear();
      goto("/orders");
    } finally {
      submitting = false;
    }
  }
</script>

<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a>

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>

    <ul class="nav-links" class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>
      {#if isAdmin}
        <li><a href="/users">Users</a></li>
      {/if}
      {#if canViewInventory}
        <li><a href="/inventory">Inventory</a></li>
      {/if}
      <CartDrawer />
      <li class="profile-dropdown">
        <button class="dropdown-trigger" on:click={toggleProfile}>
          {#if userPfp}
            <img src={userPfp} alt="Profilkép" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;" />
          {/if}
          {displayName} ▾
        </button>

        {#if isProfileOpen}
          <div class="dropdown-menu">
            {#if isLoggedIn}
              <a href="/profile">My Account</a>
              <a href="/orders">Orders</a>
              <a href="/saved-builds">Saved Builds</a>
              <hr />
            {/if}
            <button class={isLoggedIn ? "logout" : "login-action"} on:click={handleAuthAction}>
              {isLoggedIn ? "Logout" : "Login"}
            </button>
          </div>
        {/if}
      </li>
    </ul>
  </div>
</nav>

<section class="checkout-page">
  <div class="checkout-header">
    <h1>Checkout</h1>
    <p>Véglegesítsd a rendelést a kosarad tartalma alapján.</p>
  </div>

  {#if cartItems.length === 0}
    <div class="checkout-empty">
      <h2>Üres a kosarad</h2>
      <p>Mielőtt fizetnél, tegyél néhány terméket a kosárba.</p>
      <a href="/shop" class="shop-link">Vissza a shopba</a>
    </div>
  {:else}
    <div class="checkout-grid">
      <form class="checkout-form" on:submit={handleSubmit}>
        <h2>Szállítási adatok</h2>

        <label>
          Név
          <input type="text" bind:value={customerName} placeholder="Teljes név" />
        </label>

        <label>
          E-mail
          <input type="email" bind:value={customerEmail} placeholder="email@example.com" />
        </label>

        <label>
          Telefonszám
          <input type="tel" bind:value={phoneNumber} placeholder="+36 ..." />
        </label>

        <div style="display:flex;gap:8px;align-items:center;">
          <div style="flex:1;display:grid;gap:8px;">
            <label>
              Irányítószám
              <input type="text" bind:value={postalCode} placeholder="Irányítószám" />
            </label>

            <label>
              Város
              <input type="text" bind:value={city} placeholder="Város" />
            </label>

            <label>
              Utca, házszám
              <input type="text" bind:value={streetAddress} placeholder="Utca, házszám" />
            </label>
          </div>

          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
            <button type="button" class="use-saved" on:click={applySavedAddress} disabled={!userId}>
              Use saved address
            </button>
            {#if savedAddressAvailable}
              <small style="color:#5a6187;">Saved address available</small>
            {:else if userId}
              <small style="color:#5a6187;">No saved address found yet — will check orders</small>
            {/if}
          </div>
        </div>

        <button class="place-order-button" type="submit" disabled={submitting}>
          {submitting ? "Rendelés leadása..." : "Rendelés leadása"}
        </button>

        {#if checkoutMessage}
          <p class:success={!checkoutMessageIsError} class:error={checkoutMessageIsError} class="checkout-message">
            {checkoutMessage}
          </p>
        {/if}
      </form>

      <aside class="summary-panel">
        <h2>Rendelés összegzése</h2>

        <div class="summary-items">
          {#each cartItems as item}
            <article class="summary-item">
              <img src={item.image_url} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.quantity} x {formatPrice(item.price_huf)}</p>
              </div>
            </article>
          {/each}
        </div>

        <div class="summary-total">
          <span>Összesen</span>
          <strong>{formatPrice(cartTotal)}</strong>
        </div>
      </aside>
    </div>
  {/if}
</section>

<style>
  .checkout-page {
    width: min(1450px, 94%);
    margin: 42px auto 70px;
    color: #151c44;
  }

  .checkout-header {
    margin-bottom: 18px;
  }

  .checkout-header h1 {
    margin: 0 0 6px;
    color: white;
    font-size: 2.2rem;
  }

  .checkout-header p {
    margin: 0;
    color: rgba(255, 255, 255, 0.82);
  }

  .checkout-empty,
  .checkout-form,
  .summary-panel {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 14px;
    padding: 18px;
  }

  .checkout-empty {
    display: grid;
    gap: 12px;
    justify-items: start;
  }

  .shop-link,
  .place-order-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    text-decoration: none;
    background: #2260e8;
    color: white;
    padding: 12px 24px;
    font-weight: 700;
    border: none;
    cursor: pointer;
  }

  .checkout-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 18px;
    align-items: start;
  }

  .checkout-form {
    display: grid;
    gap: 14px;
  }

  .checkout-form h2,
  .summary-panel h2 {
    margin: 0 0 6px;
    color: #131943;
  }

  .checkout-form label {
    display: grid;
    gap: 6px;
    color: #20306a;
    font-weight: 600;
  }

  .checkout-form input {
    border-radius: 10px;
    border: 1px solid #cfd3e8;
    padding: 10px 12px;
    font: inherit;
    background: white;
  }

  .summary-panel {
    position: sticky;
    top: 84px;
  }

  .summary-items {
    display: grid;
    gap: 12px;
    margin-top: 12px;
  }

  .summary-item {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    background: white;
    border: 1px solid #e5e8f3;
    border-radius: 12px;
    padding: 10px;
  }

  .summary-item img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    background: #f4f6fb;
    border-radius: 10px;
  }

  .summary-item h3 {
    margin: 0 0 4px;
    font-size: 1rem;
  }

  .summary-item p {
    margin: 0;
    color: #4f5883;
  }

  .summary-total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid #dfe3ef;
  }

  .summary-total span {
    color: #5a6187;
  }

  .summary-total strong {
    color: #111;
    font-size: 1.35rem;
  }

  .checkout-message {
    margin: 0;
    font-weight: 600;
  }

  .checkout-message.success {
    color: #1d8f4a;
  }

  .checkout-message.error {
    color: #d64545;
  }

  .use-saved {
    background: transparent;
    border: 0;
    color: #2260e8;
    cursor: pointer;
    padding: 6px 8px;
    font-weight: 700;
  }
  .use-saved[disabled] {
    opacity: 0.45;
    cursor: default;
  }

  @media (max-width: 1100px) {
    .checkout-grid {
      grid-template-columns: 1fr;
    }

    .summary-panel {
      position: static;
    }
  }

  @media (max-width: 700px) {
    .checkout-page {
      width: min(100%, 95%);
      margin-top: 20px;
    }

    .checkout-header h1 {
      font-size: 1.6rem;
    }
  }
</style>
