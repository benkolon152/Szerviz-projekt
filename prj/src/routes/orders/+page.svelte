<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import CartDrawer from "$lib/components/CartDrawer.svelte";

  const API_BASE = "http://localhost:3001";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userPfp = "";
  let isAdmin = false;
  let canViewInventory = false;
  let userId = null;

  let orders = [];
  let isLoadingOrders = true;
  let ordersError = "";

  onMount(async () => {
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
      } catch {
        displayName = "Profile";
        userPfp = "";
        userId = null;
        isAdmin = false;
        canViewInventory = false;
      }
    }

    if (userId) {
      await loadOrders(userId);
    } else {
      isLoadingOrders = false;
    }
  });

  async function loadOrders(id) {
    isLoadingOrders = true;
    ordersError = "";

    try {
      const response = await fetch(`${API_BASE}/api/users/${id}/orders`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load orders");
      }

      orders = data.orders ?? [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      ordersError = "Nem sikerült betölteni a rendeléseidet.";
    } finally {
      isLoadingOrders = false;
    }
  }

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
      userId = null;
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

  function formatDate(value) {
    if (!value) {
      return "Ismeretlen dátum";
    }

    return new Intl.DateTimeFormat("hu-HU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function getStatusLabel(status) {
    const normalizedStatus = String(status || "processing").toLowerCase();

    if (normalizedStatus === "processing") {
      return "Feldolgozás alatt";
    }

    if (normalizedStatus === "needs_repair") {
      return "Szervizre vár";
    }

    if (normalizedStatus === "confirmed") {
      return "Visszaigazolva";
    }

    if (normalizedStatus === "shipped") {
      return "Feladva";
    }

    if (normalizedStatus === "delivered") {
      return "Kézbesítve";
    }

    if (normalizedStatus === "cancelled") {
      return "Törölve";
    }

    return normalizedStatus;
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || "processing").toLowerCase();
    return `status-${normalizedStatus}`;
  }

  function getOrderTypeLabel(orderType) {
    return String(orderType || "purchase").toLowerCase() === "repair_request" ? "Szerviz leadás" : "Vásárlás";
  }

  $: orderCount = orders.length;
  $: totalSpent = orders.reduce((sum, order) => sum + Number(order.total_huf || 0), 0);
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
              <a href="/orders"><b>Orders</b></a>
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

<section class="orders-page">
  <header class="orders-header">
    <div>
      <p class="eyebrow">Rendeléskövetés</p>
      <h1>Orders</h1>
      <p>Kövesd nyomon a vásárlásaidat és nézd meg a rendelési tételeket.</p>
    </div>

    {#if isLoggedIn && orderCount > 0}
      <div class="orders-stats">
        <div>
          <span>Rendelések</span>
          <strong>{orderCount}</strong>
        </div>
        <div>
          <span>Elköltve</span>
          <strong>{formatPrice(totalSpent)}</strong>
        </div>
      </div>
    {/if}
  </header>

  {#if !isLoggedIn}
    <div class="empty-state">
      <h2>Jelentkezz be a rendeléseid megtekintéséhez</h2>
      <p>A rendeléseket a fiókodhoz kötjük, ezért itt csak bejelentkezve jelennek meg.</p>
      <a href="/login" class="primary-link">Bejelentkezés</a>
    </div>
  {:else if isLoadingOrders}
    <div class="empty-state">
      <h2>Rendelések betöltése...</h2>
      <p>Csak egy pillanat, lekérjük a rendelési előzményeket.</p>
    </div>
  {:else if ordersError}
    <div class="empty-state error-state">
      <h2>Nem sikerült betölteni a rendeléseket</h2>
      <p>{ordersError}</p>
    </div>
  {:else if orders.length === 0}
    <div class="empty-state">
      <h2>Még nincs rendelésed</h2>
      <p>Ha leadsz egy rendelést a checkout oldalról, itt meg fog jelenni.</p>
      <a href="/shop" class="primary-link">Vissza a shopba</a>
    </div>
  {:else}
    <div class="orders-list">
      {#each orders as order}
        <article class="order-card">
          <div class="order-card-top">
            <div>
              <p class="order-number">Rendelés #{order.id}</p>
              <h2>{formatDate(order.created_at)}</h2>
              <p class="order-type">{getOrderTypeLabel(order.order_type)}</p>
            </div>

            <span class={`status-pill ${getStatusClass(order.status)}`}>{getStatusLabel(order.status)}</span>
          </div>

          <div class="order-meta">
            <div>
              <span>Név</span>
              <strong>{order.customer_name}</strong>
            </div>
            <div>
              <span>E-mail</span>
              <strong>{order.customer_email}</strong>
            </div>
            <div>
              <span>Telefonszám</span>
              <strong>{order.phone_number || "Nincs megadva"}</strong>
            </div>
            <div>
              <span>Szállítási cím</span>
              <strong>{order.order_type === "repair_request" ? (order.shipping_address || "Szerviz leadás") : order.shipping_address}</strong>
            </div>
            {#if order.order_type === "repair_request"}
              <div>
                <span>Eszköz</span>
                <strong>{order.repair_device || "-"}</strong>
              </div>
              <div>
                <span>Hiba leírás</span>
                <strong>{order.repair_issue || "-"}</strong>
              </div>
              <div>
                <span>Rendelés típusa</span>
                <strong>Szerviz kérés</strong>
              </div>
            {/if}
          </div>

          <div class="order-items">
            {#if order.order_type === "repair_request"}
              <div class="repair-summary">
                <h3>Szerviz leadás</h3>
                <p>A javítási igényed rögzítve lett, a státusz most: {getStatusLabel(order.status)}.</p>
              </div>
            {:else}
              {#each order.items ?? [] as item}
                <div class="order-item">
                  <img src={item.image_url || "white.png"} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.quantity} x {formatPrice(item.price_huf)}</p>
                  </div>
                  <strong>{formatPrice(Number(item.price_huf || 0) * Number(item.quantity || 0))}</strong>
                </div>
              {/each}
            {/if}
          </div>

          <div class="order-footer">
            <span>Összesen</span>
            <strong>{formatPrice(order.total_huf)}</strong>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .orders-page {
    width: min(1220px, 94%);
    margin: 42px auto 72px;
    color: #14204f;
  }

  .orders-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
  }

  .orders-header h1 {
    margin: 0 0 8px;
    color: #fff;
    font-size: clamp(2rem, 4vw, 3rem);
  }

  .orders-header p {
    margin: 0;
    color: rgba(255, 255, 255, 0.82);
  }

  .eyebrow {
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.66) !important;
  }

  .orders-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(110px, 1fr));
    gap: 12px;
    background: rgba(10, 16, 46, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    padding: 14px;
    backdrop-filter: blur(16px);
  }

  .orders-stats span,
  .order-meta span,
  .order-footer span {
    display: block;
    font-size: 0.8rem;
    color: #66719c;
    margin-bottom: 4px;
  }

  .orders-stats strong {
    color: #fff;
    font-size: 1.25rem;
  }

  .empty-state,
  .order-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.48);
    border-radius: 18px;
    box-shadow: 0 22px 40px rgba(10, 16, 46, 0.14);
  }

  .empty-state {
    padding: 28px;
    display: grid;
    gap: 12px;
    max-width: 680px;
  }

  .empty-state h2,
  .order-card h2,
  .order-item h3 {
    margin: 0;
  }

  .empty-state p {
    margin: 0;
    color: #5f688e;
  }

  .error-state {
    border-color: rgba(214, 69, 69, 0.28);
    background: rgba(255, 244, 244, 0.96);
  }

  .primary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    border-radius: 999px;
    background: linear-gradient(135deg, #1b5cff, #4d79ff);
    color: white;
    text-decoration: none;
    padding: 12px 20px;
    font-weight: 700;
    box-shadow: 0 12px 26px rgba(27, 92, 255, 0.28);
  }

  .orders-list {
    display: grid;
    gap: 18px;
  }

  .order-card {
    padding: 20px;
    display: grid;
    gap: 18px;
  }

  .order-card-top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }

  .order-number {
    margin: 0 0 6px;
    font-size: 0.82rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6270a6;
  }

  .order-type {
    margin: 0;
    color: #5a6389;
    font-size: 0.95rem;
  }

  .order-card-top h2 {
    color: #121a43;
    font-size: 1.15rem;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .status-processing {
    background: #edf3ff;
    color: #2156d4;
  }

  .status-confirmed {
    background: #eefcf2;
    color: #1d8f4a;
  }

  .status-shipped {
    background: #fff6e6;
    color: #a86608;
  }

  .status-delivered {
    background: #e9f7f2;
    color: #17704c;
  }

  .status-cancelled {
    background: #fdeaea;
    color: #b73535;
  }

  .order-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 18px;
    padding: 16px;
    border-radius: 16px;
    background: #f6f8ff;
  }

  .order-meta strong {
    color: #17214c;
    word-break: break-word;
  }

  .order-items {
    display: grid;
    gap: 12px;
  }

  .repair-summary {
    display: grid;
    gap: 8px;
    padding: 16px;
    border-radius: 14px;
    background: linear-gradient(135deg, #eef4ff, #f9fbff);
    border: 1px solid #dbe6ff;
  }

  .repair-summary p {
    margin: 0;
    color: #5d668d;
  }

  .order-item {
    display: grid;
    grid-template-columns: 70px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 12px;
    border-radius: 14px;
    background: white;
    border: 1px solid #e3e8f6;
  }

  .order-item img {
    width: 70px;
    height: 70px;
    object-fit: contain;
    background: #f4f6fb;
    border-radius: 12px;
  }

  .order-item p {
    margin: 5px 0 0;
    color: #5d668d;
  }

  .order-item strong {
    color: #131943;
    white-space: nowrap;
  }

  .order-footer {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding-top: 2px;
    border-top: 1px solid #dde3f4;
  }

  .order-footer strong {
    font-size: 1.25rem;
    color: #10152f;
  }

  @media (max-width: 900px) {
    .orders-header {
      flex-direction: column;
      align-items: start;
    }

    .orders-stats {
      width: 100%;
    }

    .order-meta {
      grid-template-columns: 1fr;
    }

    .order-item {
      grid-template-columns: 60px minmax(0, 1fr);
    }

    .order-item strong {
      grid-column: 1 / -1;
      justify-self: end;
    }
  }

  @media (max-width: 700px) {
    .orders-page {
      width: min(100%, 95%);
      margin-top: 20px;
    }

    .order-card {
      padding: 16px;
    }

    .order-card-top {
      flex-direction: column;
      align-items: start;
    }

    .status-pill {
      width: fit-content;
    }
  }
</style>