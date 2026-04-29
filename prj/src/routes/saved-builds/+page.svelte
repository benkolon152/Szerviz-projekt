<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import CartDrawer from "$lib/components/CartDrawer.svelte";

  const API_BASE = "http://localhost:3001";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profil";
  let userPfp = "";
  let isAdmin = false;
  let canViewInventory = false;

  let builds = [];
  let loading = true;
  let error = "";
  let deleteError = "";

  onMount(async () => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        displayName = parsedUser?.username || "Profil";
        userPfp = parsedUser?.pfp || "";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
      } catch {
        displayName = "Profil";
        userPfp = "";
        isAdmin = false;
        canViewInventory = false;
      }
    }

    loading = true;
    error = "";

    let userId = null;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        userId = Number(parsed?.id) || null;
      }
    } catch {}

    try {
      const url = userId ? `${API_BASE}/api/builds?user_id=${userId}` : `${API_BASE}/api/builds`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        error = data?.message || "Hiba történt a build-ek lekérésekor.";
        builds = [];
      } else {
        builds = data.builds || [];
      }
    } catch (err) {
      console.error(err);
      error = "Hálózati hiba a lekérés során.";
    } finally {
      loading = false;
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
      displayName = "Profil";
      userPfp = "";
      isAdmin = false;
      canViewInventory = false;
    }

    isProfileOpen = false;
    goto("/login");
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString("hu-HU");
    } catch { return String(ts); }
  }

  async function deleteBuild(buildId) {
    if (!confirm("Biztosan törlöd ezt a buildet?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/builds/${buildId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        deleteError = data?.message || "Nem sikerült törölni a buildet.";
        return;
      }

      builds = builds.filter(b => b.id !== buildId);
      deleteError = "";
    } catch (err) {
      console.error(err);
      deleteError = "Hálózati hiba a törlés során.";
    }
  }

  function goToBuilder(build) {
    // For now navigate to pcbuilder page. Loading into builder is future work.
    goto('/pcbuild');
  }
</script>

<div class="saved-builds-page">
  <nav class="navbar">
    <div class="nav-container">
      <a href="/" class="logo">PcD</a>

      <button class="hamburger" on:click={toggle}>
        ☰
      </button>

      <ul class="nav-links" class:open={isOpen}>
        <li><a href="/">Kezdőlap</a></li>
        <li><a href="/shop">Bolt</a></li>
        <li><a href="/pcbuild">PC építő</a></li>
        {#if isAdmin}
          <li><a href="/users">Felhasználók</a></li>
        {/if}
        {#if canViewInventory}
          <li><a href="/inventory">Raktárkészlet</a></li>
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
                <a href="/profile">Fiókom</a>
                <a href="/orders">Rendeléseim</a>
                <a href="/saved-builds"><b>Mentett buildek</b></a>
                <hr />
              {/if}
              <button class={isLoggedIn ? "logout" : "login-action"} on:click={handleAuthAction}>
                {isLoggedIn ? "Kijelentkezés" : "Bejelentkezés"}
              </button>
            </div>
          {/if}
        </li>
      </ul>
    </div>
  </nav>

  <div class="page-content">
    <h1>Mentett buildjeim</h1>

    {#if deleteError}
      <p class="error">{deleteError}</p>
    {/if}

    {#if loading}
      <p>Töltés...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if builds.length === 0}
      <p>Nincsenek mentett buildjeid.</p>
    {:else}
      <ul class="build-list">
      {#each builds as b}
        <li class="build-item">
          <div class="build-meta">
            <strong>{b.name || 'Névtelen build'}</strong>
            <span class="build-date">{formatDate(b.created_at)}</span>
            <span class="build-total">{new Intl.NumberFormat('hu-HU').format(Number(b.total_huf || 0))} Ft</span>
          </div>
          <div class="build-actions">
            <button class="action-btn primary-btn" on:click={() => goToBuilder(b)}>Szerkesztés</button>
            <button class="action-btn delete-btn" on:click={() => deleteBuild(b.id)}>Törlés</button>
          </div>
          <details class="build-details">
            <summary>Komponensek</summary>
              <div class="components-grid">
                {#each Object.entries(b.components || {}) as [slot, comp]}
                  <div class="component-card">
                    {#if comp?.image_url}
                      <img class="component-image" src={comp.image_url} alt={comp?.name || slot} on:error={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'white.png'; }} />
                    {:else}
                      <div class="component-image placeholder">{slot.slice(0,1)}</div>
                    {/if}

                    <div class="component-meta">
                      <div class="component-slot">{slot}</div>
                      <div class="component-name">{comp?.name || comp?.model || 'Ismeretlen'}</div>
                      <div class="component-brand">{comp?.brand || ''}</div>
                      <div class="component-price">{new Intl.NumberFormat('hu-HU').format(Number(comp?.price_huf || 0))} Ft</div>
                    </div>
                  </div>
                {/each}
              </div>
          </details>
        </li>
      {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .saved-builds-page { max-width: 1400px; margin: 48px auto; color: white; }
  .build-list { list-style: none; padding: 0; display: grid; gap: 24px; }
  .build-item { background: rgba(255,255,255,0.04); padding: 24px; border-radius: 12px; }
  .build-meta { display:flex; flex-wrap: wrap; gap: 20px; align-items:center; font-size: 1.1rem; }
  .build-date { font-size: 0.95rem; color: #a8c2ff; }
  .build-total { font-size: 1.2rem; font-weight: 800; color: #a8e6cf; }
  .build-actions { margin-top:16px; }
  

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .component-card {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 12px;
    background: rgba(255,255,255,0.02);
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.03);
  }

  .component-image {
    width: 100px;
    height: 100px;
    object-fit: contain;
    background: #fff;
    border-radius: 8px;
    padding: 8px;
    flex-shrink: 0;
  }

  .component-image.placeholder {
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-weight: 700;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    font-size: 2rem;
  }

  .component-meta { display:flex; flex-direction:column; gap:6px; color: #e6eefb; }
  .component-slot { font-size: 0.85rem; color: #9fb3ff; font-weight: 700; text-transform: uppercase; }
  .component-name { font-weight: 700; font-size: 1rem; }
  .component-brand { font-size: 0.95rem; color: #a8c2ff; }
  .component-price { font-weight: 800; color: #a8e6cf; font-size: 1.05rem; }

  .build-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .action-btn { padding: 12px 20px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .primary-btn { background: #5c7cfa; color: white; }
  .primary-btn:hover { background: #4c63d2; }
  .delete-btn { background: #fa5252; color: white; }
  .delete-btn:hover { background: #f03e3e; }

  .page-content { padding: 0 32px; }
  .page-content h1 { font-size: 2.2rem; margin-bottom: 32px; }
  .error { color: #ff6b6b; font-weight: 600; margin: 16px 0; font-size: 1.05rem; }

  @media (max-width: 480px) {
    .saved-builds-page {
      margin: 16px auto 32px;
      max-width: 100%;
      width: 100%;
    }

    .page-content {
      padding: 0 14px;
    }

    .page-content h1 {
      font-size: 1.9rem;
      line-height: 1.05;
      margin-bottom: 20px;
      word-break: break-word;
    }

    .build-list {
      gap: 16px;
    }

    .build-item {
      padding: 16px;
      border-radius: 14px;
    }

    .build-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      font-size: 1rem;
    }

    .build-meta strong {
      font-size: 1.1rem;
      word-break: break-word;
    }

    .build-date,
    .build-total {
      font-size: 0.95rem;
    }

    .build-actions {
      width: 100%;
      gap: 10px;
    }

    .action-btn {
      width: 100%;
      padding: 12px 14px;
    }

    .build-details {
      margin-top: 4px;
    }

    .components-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 14px;
    }

    .component-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
    }

    .component-image,
    .component-image.placeholder {
      width: 72px;
      height: 72px;
      padding: 6px;
      font-size: 1.3rem;
    }

    .component-meta {
      width: 100%;
      gap: 4px;
    }
  }
</style>
