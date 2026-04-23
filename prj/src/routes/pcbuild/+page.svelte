<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userPfp = "";
  let isAdmin = false;
  let canViewInventory = false;
  let isModalOpen = false;
  let activeCategory = "";

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
  
  const partsLookup = {
    "Processzor": ["Intel Core i9-14900K"],
    "Alaplap": ["ASUS ROG STRIX Z790-E"],
    "Ház": ["NZXT H7 Flow"],
    "Videokártya": ["NVIDIA RTX 4090 24GB"],
    "Memória": ["Kingston FURY Beast 32GB DDR5"],
    "Tápegység": ["EVGA SuperNOVA 850W"],
    "Merevlemez": ["Seagate BarraCuda 2TB"],
    "SSD": ["Samsung 990 Pro 1TB"],
    "Optikai egység": ["Asus ZenDrive External"],
    "Processzor léghűtő": ["Noctua NH-D15"],
    "Processzor vízhűtő": ["NZXT Kraken 360"],
    "Monitor": ["ASUS TUF Gaming 27"],
    "Billentyűzet és egér": ["Logitech MK270 Combo"],
    "Billentyűzet": ["Keychron Q1 V2"],
    "Egér": ["Logitech G Pro X Superlight"],
    "Operációs rendszer": ["Windows 11 Home"],
    "Irodai alkalmazás": ["Microsoft Office 2021"],
    "Biztonsági szoftver": ["ESET Internet Security"]
  };

  function openModal(category) {
    activeCategory = category;
    isModalOpen = true;
    document.body.style.overflow = 'hidden';
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

  $: total = (services.osszeszereles.checked ? services.osszeszereles.price : 0) +
             (services.bios.checked ? services.bios.price : 0) +
             (services.teszteles.checked ? services.teszteles.price : 0);

  const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p) + " Ft";
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
      <li class="profile-dropdown">
        <button class="dropdown-trigger" on:click={toggleProfile}>
          {#if userPfp}
            <img src={userPfp} alt="Profilkép" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;" />
          {/if}
          {displayName} ▾
        </button>
        
        {#if isProfileOpen}
          <div class="dropdown-menu">
            <a href="/profile">My Account</a>
            <a href="/orders">Orders</a>
            <hr />
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
    <div class="builder-row"><span>Processzor</span> <button class="btn-add" on:click={() => openModal("Processzor")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Alaplap</span> <button class="btn-add" on:click={() => openModal("Alaplap")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Ház</span> <button class="btn-add" on:click={() => openModal("Ház")}>Hozzáadás +</button></div>
  </div>

  <h3 class="section-title">KOMPONENSEK</h3>
  <div class="builder-section">
    <div class="builder-row"><span>Videokártya</span> <button class="btn-add" on:click={() => openModal("Videokártya")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Memória</span> <button class="btn-add" on:click={() => openModal("Memória")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Tápegység</span> <button class="btn-add" on:click={() => openModal("Tápegység")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Merevlemez</span> <button class="btn-add" on:click={() => openModal("Merevlemez")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>SSD</span> <button class="btn-add" on:click={() => openModal("SSD")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Optikai egység</span> <button class="btn-add" on:click={() => openModal("Optikai egység")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Processzor léghűtő</span> <button class="btn-add" on:click={() => openModal("Processzor léghűtő")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Processzor vízhűtő</span> <button class="btn-add" on:click={() => openModal("Processzor vízhűtő")}>Hozzáadás +</button></div>
  </div>

  <h3 class="section-title">EXTRÁK</h3>
  <div class="builder-section">
    <div class="builder-row"><span>Monitor</span> <button class="btn-add" on:click={() => openModal("Monitor")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Billentyűzet és egér</span> <button class="btn-add" on:click={() => openModal("Billentyűzet és egér")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Billentyűzet</span> <button class="btn-add" on:click={() => openModal("Billentyűzet")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Egér</span> <button class="btn-add" on:click={() => openModal("Egér")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Operációs rendszer</span> <button class="btn-add" on:click={() => openModal("Operációs rendszer")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Irodai alkalmazás</span> <button class="btn-add" on:click={() => openModal("Irodai alkalmazás")}>Hozzáadás +</button></div>
    <div class="builder-row"><span>Biztonsági szoftver</span> <button class="btn-add" on:click={() => openModal("Biztonsági szoftver")}>Hozzáadás +</button></div>
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
    <button class="btn-save">Mentés</button>
    <div class="footer-right">
      <div class="total-price">
        <span>Összesen</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button class="btn-buy">Megveszem</button>
    </div>
  </div>

  <div class="back-to-top">
    <a href="#top">Vissza az oldal tetejére ↑</a>
  </div>

</div>

{#if isModalOpen}
  <div class="modal-backdrop" on:click|self={closeModal}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>{activeCategory} választása</h2>
        <button class="close-btn" on:click={closeModal}>✕</button>
      </div>
      
      <div class="parts-list">
        {#if partsLookup[activeCategory]}
          {#each partsLookup[activeCategory] as part}
            <div class="part-item">
              <div class="part-info">
                <strong>{part}</strong>
                <span class="stock-status">Raktáron</span>
              </div>
              <button class="btn-select" on:click={closeModal}>Kiválaszt</button>
            </div>
          {/each}
        {:else}
          <div class="no-parts">Nincs elérhető termék ebben a kategóriában.</div>
        {/if}
      </div>
    </div>
  </div>
{/if}