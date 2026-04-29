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
  let isModalOpen = false;
  let activeCategory = "";

  let searchQuery = "";
  let parts = [];
  let loading = false;
  let message = "";

  let selectedParts = {};

  onMount(() => {
  const rawUser = localStorage.getItem("user");
  isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        displayName = parsedUser?.username || "Profile";
        userPfp = parsedUser?.pfp || "";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
      } catch {
        displayName = "Profile";
        userPfp = "";
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

  function openModal(category) {
    activeCategory = category;
    searchQuery = "";
    isModalOpen = true;
    document.body.style.overflow = 'hidden';
    fetchParts();
  }

  function closeModal() {
    isModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  let services = {
    osszeszereles: { checked: false, price: 9990 },
    bios: { checked: false, price: 3490 },
    teszteles: { checked: false, price: 2490 }
  };

  $: partsTotal = Object.values(selectedParts).reduce((sum, part) => {
    return sum + (Number(part.price_huf) || 0);
  }, 0);

  $: total = partsTotal + 
             (services.osszeszereles.checked ? services.osszeszereles.price : 0) +
             (services.bios.checked ? services.bios.price : 0) +
             (services.teszteles.checked ? services.teszteles.price : 0);

  const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p) + " Ft";

    async function fetchParts() {
      if (!activeCategory) return;
      loading = true; // [cite: 16]
      message = "";

      try {
        const response = await fetch(`${API_BASE}/api/parts/${activeCategory}?search=${encodeURIComponent(searchQuery)}`); // [cite: 16]
        const data = await response.json().catch(() => ({})); // [cite: 17]

        if (!response.ok) {
          parts = []; // [cite: 17]
          message = data.message || "Hiba a betöltés során."; // [cite: 18]
          return;
        }

        let allItems = data.items || []; // [cite: 18]

        // Keresztszűrés: Csak az azonos foglalatú (socket) elemeket mutatjuk
        if (activeCategory === "Motherboard" && selectedParts["Cpu"]?.socket) {
          parts = allItems.filter(p => p.socket === selectedParts["Cpu"].socket);
        } else if (activeCategory === "Cpu" && selectedParts["Motherboard"]?.socket) {
          parts = allItems.filter(p => p.socket === selectedParts["Motherboard"].socket);
        } else {
          parts = allItems; // [cite: 18]
        }

      } catch (error) {
        console.error("Error loading inventory:", error); // [cite: 19]
        parts = []; // [cite: 19]
        message = "A backend nem érhető el."; // [cite: 20]
      } finally {
        loading = false; // [cite: 20]
      }
    }

  function selectPart(part) {
    // Beállítjuk az új alkatrészt
    selectedParts[activeCategory] = part; // 

    // Ha Processzort cserélünk és már van Alaplap (vagy fordítva), 
    // ellenőrizzük, hogy az új választás kompatibilis-e a régivel.
    // Ha nem, akkor a régit töröljük a listából.
    if (activeCategory === "Cpu" && selectedParts["Motherboard"]) {
      if (selectedParts["Motherboard"].socket !== part.socket) {
        delete selectedParts["Motherboard"];
      }
    } else if (activeCategory === "Motherboard" && selectedParts["Cpu"]) {
      if (selectedParts["Cpu"].socket !== part.socket) {
        delete selectedParts["Cpu"];
      }
    }

    // Svelte reaktivitás frissítése (szükséges az objektum módosítása után)
    selectedParts = { ...selectedParts }; // 

    closeModal(); // 
  }

  async function handleSaveBuild() {
    // prompt for a build name
    const name = window.prompt("Build neve:", `MyApp build ${new Date().toLocaleString()}`);

    if (name === null) {
      // user cancelled
      return;
    }

    const rawUser = localStorage.getItem("user");
    let userId = null;
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        userId = Number(parsed?.id) || null;
      } catch {
        userId = null;
      }
    }

    const payload = {
      user_id: userId,
      name: String(name).trim() || null,
      components: selectedParts,
      services: {
        osszeszereles: Boolean(services.osszeszereles.checked),
        bios: Boolean(services.bios.checked),
        teszteles: Boolean(services.teszteles.checked),
      },
      total_huf: Number(total) || 0,
      metadata: {
        parts_total: Number(partsTotal) || 0,
      }
    };

    try {
      const res = await fetch(`${API_BASE}/api/builds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        message = data?.message || "Nem sikerült elmenteni a buildet.";
        return;
      }

      message = "Build elmentve.";
    } catch (err) {
      console.error(err);
      message = "Hálózati hiba a build mentésekor.";
    }
  }

  $: if (isModalOpen || searchQuery !== undefined) {
    if (isModalOpen) {
      fetchParts();
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
      <li><a href="/"><b>Home</b></a></li>
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

<div class="builder-container">
  
  <h3 class="section-title">FŐ EGYSÉGEK</h3>
  <div class="builder-section">
    <div class="builder-row">
      <div class="row-left">
        <strong>Processzor</strong>
        {#if selectedParts["Cpu"]}
          <div class="selected-part">
            <img src={selectedParts["Cpu"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Cpu"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Cpu"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Cpu")}>
        {selectedParts["Cpu"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Alaplap</strong>
        {#if selectedParts["Motherboard"]}
          <div class="selected-part">
            <img src={selectedParts["Motherboard"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Motherboard"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Motherboard"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Motherboard")}>
        {selectedParts["Motherboard"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Ház</strong>
        {#if selectedParts["PC case"]}
          <div class="selected-part">
            <img src={selectedParts["PC case"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["PC case"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["PC case"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("PC case")}>
        {selectedParts["PC case"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>
  </div>

  <h3 class="section-title">KOMPONENSEK</h3>
  <div class="builder-section">
    <div class="builder-row">
      <div class="row-left">
        <strong>Videokártya</strong>
        {#if selectedParts["Gpu"]}
          <div class="selected-part">
            <img src={selectedParts["Gpu"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Gpu"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Gpu"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Gpu")}>
        {selectedParts["Gpu"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Memória</strong>
        {#if selectedParts["Ram"]}
          <div class="selected-part">
            <img src={selectedParts["Ram"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Ram"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Ram"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Ram")}>
        {selectedParts["Ram"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Tápegység</strong>
        {#if selectedParts["PSU"]}
          <div class="selected-part">
            <img src={selectedParts["PSU"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["PSU"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["PSU"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("PSU")}>
        {selectedParts["PSU"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Merevlemez</strong>
        {#if selectedParts["HDD"]}
          <div class="selected-part">
            <img src={selectedParts["HDD"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["HDD"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["HDD"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("HDD")}>
        {selectedParts["HDD"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>SSD</strong>
        {#if selectedParts["SSD"]}
          <div class="selected-part">
            <img src={selectedParts["SSD"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["SSD"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["SSD"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("SSD")}>
        {selectedParts["SSD"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Optikai egység</strong>
        {#if selectedParts["Optical drive"]}
          <div class="selected-part">
            <img src={selectedParts["Optical drive"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Optical drive"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Optical drive"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Optical drive")}>
        {selectedParts["Optical drive"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Processzor léghűtő</strong>
        {#if selectedParts["CPU cooler"]}
          <div class="selected-part">
            <img src={selectedParts["CPU cooler"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["CPU cooler"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["CPU cooler"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("CPU cooler")}>
        {selectedParts["CPU cooler"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Processzor vízhűtő</strong>
        {#if selectedParts["Liquid Cooler"]}
          <div class="selected-part">
            <img src={selectedParts["Liquid Cooler"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Liquid Cooler"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Liquid Cooler"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Liquid Cooler")}>
        {selectedParts["Liquid Cooler"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>
  </div>

  <h3 class="section-title">EXTRÁK</h3>
  <div class="builder-section">
    <div class="builder-row">
      <div class="row-left">
        <strong>Monitor</strong>
        {#if selectedParts["Monitor"]}
          <div class="selected-part">
            <img src={selectedParts["Monitor"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Monitor"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Monitor"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Monitor")}>
        {selectedParts["Monitor"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Billentyűzet</strong>
        {#if selectedParts["Keyboard"]}
          <div class="selected-part">
            <img src={selectedParts["Keyboard"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Keyboard"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Keyboard"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Keyboard")}>
        {selectedParts["Keyboard"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Egér</strong>
        {#if selectedParts["Mouse"]}
          <div class="selected-part">
            <img src={selectedParts["Mouse"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["Mouse"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["Mouse"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("Mouse")}>
        {selectedParts["Mouse"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>

    <div class="builder-row">
      <div class="row-left">
        <strong>Operációs rendszer</strong>
        {#if selectedParts["OS"]}
          <div class="selected-part">
            <img src={selectedParts["OS"].image_url} alt="" class="part-thumb" />
            <div class="part-details">
              <span class="part-name">{selectedParts["OS"].name}</span>
              <span class="part-price">{formatPrice(selectedParts["OS"].price_huf)}</span>
            </div>
          </div>
        {/if}
      </div>
      <button class="btn-add" on:click={() => openModal("OS")}>
        {selectedParts["OS"] ? "Csere" : "Hozzáadás +"}
      </button>
    </div>
  </div>

  <h3 class="section-title">SZOLGÁLTATÁSOK</h3>
  <div class="services-section">
    <label class="service-card" class:active={services.osszeszereles.checked}>
      <div class="service-header">
        <input type="checkbox" bind:checked={services.osszeszereles.checked}>
        <span class="service-name">Kérek összeszerelést</span>
        <span class="service-price">9 990 Ft</span>
      </div>
      <p>Ha inkább profikra bíznád a géped összerakását, akkor mi szívesen vállaljuk plusz 3-4 munkanapos határidővel.</p>
    </label>

    <label class="service-card" class:active={services.bios.checked}>
      <div class="service-header">
        <input type="checkbox" bind:checked={services.bios.checked}>
        <span class="service-name">Kérek BIOS frissítést</span>
        <span class="service-price">3 490 Ft</span>
      </div>
      <p>Ha mi szereljük össze a géped, akkor szívesen frissítjük a BIOS-t is a konfigodban.</p>
    </label>

    <label class="service-card" class:active={services.teszteles.checked}>
      <div class="service-header">
        <input type="checkbox" bind:checked={services.teszteles.checked}>
        <span class="service-name">Kérek tesztelést</span>
        <span class="service-price">2 490 Ft</span>
      </div>
      <p>Ha mi szereljük össze a géped, akkor vállaljuk a konfigod beüzemelését és memória tesztelését diagnosztikai programmal.</p>
    </label>
  </div>

  <div class="builder-footer">
    <button class="btn-save" on:click={handleSaveBuild}>Mentés</button>
    <div class="footer-right">
      <div class="total-price">
        <span>Összesen</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button class="btn-buy" on:click={handleAddToCart}>Kosárba</button>
    </div>
  </div>

  <div class="back-to-top">
    <a href="#top">Vissza az oldal tetejére ↑</a>
  </div>

</div>

{#if isModalOpen}
<div
  class="modal-backdrop"
  role="button"
  tabindex="0"
  on:click|self={closeModal}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); closeModal(); } }}
>
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">

    <div class="modal-header">
      <h2 id="modal-title">{activeCategory} választása</h2>
      <button class="close-btn" type="button" on:click={closeModal}>✕</button>
    </div>

    <input
      type="text"
      placeholder="Keresés..."
      bind:value={searchQuery}
      class="search-input"
    />

    <div class="parts-list">
      {#if loading}
        <p>Betöltés...</p>

      {:else if parts.length === 0}
        <p>Nincs találat</p>

      {:else}
        {#each parts as part}
          <div class="part-item">

            <div class="part-info-container">
              <img src={part.image_url} alt="" class="part-img" />
              <div class="part-info">
                <strong>{part.name}</strong>
                <span>{part.price_huf} Ft</span>
              </div>
            </div>

            <button class="btn-select" on:click={() => selectPart(part)}>
              Kiválaszt
            </button>

          </div>
        {/each}
      {/if}
    </div>

  </div>
</div>
{/if}

<style>
  /* Kiegészítő stílusok a kiválasztott alkatrészekhez */
  .row-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .selected-part {
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(255, 255, 255, 0.05);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: fit-content;
  }

  .part-thumb {
    width: 45px;
    height: 45px;
    object-fit: contain;
    background: white;
    border-radius: 4px;
    padding: 2px;
  }

  .part-details {
    display: flex;
    flex-direction: column;
  }

  .part-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #eee;
  }

  .part-price {
    font-size: 0.85rem;
    color: #a8e6cf;
    font-weight: bold;
  }
</style>