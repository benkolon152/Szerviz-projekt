<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  const API_BASE = "http://localhost:3001";

  let builds = [];
  let loading = true;
  let error = "";

  onMount(async () => {
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

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString("hu-HU");
    } catch { return String(ts); }
  }

  function goToBuilder(build) {
    // For now navigate to pcbuilder page. Loading into builder is future work.
    goto('/pcbuild');
  }
</script>

<div class="saved-builds-page">
  <h1>Mentett buildjeim</h1>

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

<style>
  .saved-builds-page { max-width: 1000px; margin: 36px auto; color: white; }
  .build-list { list-style: none; padding: 0; display: grid; gap: 12px; }
  .build-item { background: rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; }
  .build-meta { display:flex; gap:12px; align-items:center; }
  .build-actions { margin-top:8px; }
  button { padding:8px 12px; border-radius:8px; border:none; background:#1b5cff; color:white; cursor:pointer; }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .component-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 8px;
    background: rgba(255,255,255,0.02);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.03);
  }

  .component-image {
    width: 64px;
    height: 64px;
    object-fit: contain;
    background: #fff;
    border-radius: 6px;
    padding: 6px;
  }

  .component-image.placeholder {
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-weight: 700;
    width: 64px;
    height: 64px;
    border-radius: 6px;
  }

  .component-meta { display:flex; flex-direction:column; gap:4px; color: #e6eefb; }
  .component-slot { font-size: 0.75rem; color: #9fb3ff; font-weight: 700; }
  .component-name { font-weight: 700; }
  .component-brand { font-size: 0.85rem; color: #a8c2ff; }
  .component-price { font-weight: 800; color: #a8e6cf; }
</style>
