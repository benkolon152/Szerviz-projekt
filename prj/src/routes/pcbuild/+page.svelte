<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let isAdmin = false;
  let canViewInventory = false;

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        displayName = parsedUser?.username || "Profile";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
      } catch {
        displayName = "Profile";
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
      isAdmin = false;
      canViewInventory = false;
    }

    isProfileOpen = false;
    goto("/login");
  }

  // Szolgáltatások állapotai és árai
  let services = {
    osszeszereles: { checked: false, price: 9990 },
    bios: { checked: false, price: 3490 },
    teszteles: { checked: false, price: 2490 }
  };

  // Dinamikus végösszeg számítás
  $: total = (services.osszeszereles.checked ? services.osszeszereles.price : 0) +
             (services.bios.checked ? services.bios.price : 0) +
             (services.teszteles.checked ? services.teszteles.price : 0);

  // Pénznem formázó (pl. 9 990 Ft)
  const formatPrice = (price) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(price).replace('HUF', 'Ft');
</script>

<svelte:head>
  <title>PC Builder | MyApp</title>
</svelte:head>

<nav class="navbar" id="top">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a>

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>
    
    <ul class="nav-links" class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild"><b>Pc builder</b></a></li>
      {#if isAdmin}
        <li><a href="/users">Users</a></li>
      {/if}
      {#if canViewInventory}
        <li><a href="/inventory">Inventory</a></li>
      {/if}
      <li class="profile-dropdown">
        <button class="dropdown-trigger" on:click={toggleProfile}>
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
    <div class="builder-row"><span>Processzor</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Alaplap</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Ház</span> <button class="btn-add">Hozzáadás +</button></div>
  </div>

  <h3 class="section-title">KOMPONENSEK</h3>
  <div class="builder-section">
    <div class="builder-row"><span>Videokártya</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Memória</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Tápegység</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Merevlemez</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>SSD</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Optikai egység</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Processzor léghűtő</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Processzor vízhűtő</span> <button class="btn-add">Hozzáadás +</button></div>
  </div>

  <h3 class="section-title">EXTRÁK</h3>
  <div class="builder-section">
    <div class="builder-row"><span>Monitor</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Billentyűzet</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Egér</span> <button class="btn-add">Hozzáadás +</button></div>
    <div class="builder-row"><span>Operációs rendszer</span> <button class="btn-add">Hozzáadás +</button></div>
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
      <button class="btn-buy">Kosárba</button>
    </div>
  </div>

  <div class="back-to-top">
    <a href="#top">Vissza az oldal tetejére ↑</a>
  </div>

</div>

<style>
  /* Fő tároló ami középre rendezi és maximalizálja a szélességet */
  .builder-container {
    max-width: 1000px;
    margin: 40px auto;
    padding: 0 20px;
  }

  /* Szekció címek stílusa */
  .section-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 40px 0 10px 0;
    color: #ccc;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Lista konténer - illeszkedik a meglévő "glassmorphism" dizájnhoz */
  .builder-section {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
  }

  .builder-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    transition: background 0.2s;
  }

  .builder-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .builder-row:last-child {
    border-bottom: none;
  }

  .btn-add {
    background: #6a96e8;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    font-family: inherit;
    transition: background 0.3s;
  }

  .btn-add:hover {
    background: #5077c5;
  }

  /* Szolgáltatások (kártyás grid elrendezés) */
  .services-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .service-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.3s ease;
  }

  .service-card:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .service-card.active {
    border-color: #6a96e8;
    background: rgba(106, 150, 232, 0.1);
  }

  .service-header {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .service-header input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .service-name {
    flex-grow: 1;
    font-weight: bold;
    font-size: 1.1rem;
  }

  .service-price {
    font-weight: bold;
    color: #fff;
  }

  .service-card p {
    font-size: 0.85rem;
    color: #bbb;
    margin: 0;
    line-height: 1.5;
  }

  /* Alsó Sticky/Fix lezáró sáv */
  .builder-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(20, 0, 30, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px 30px;
    border-radius: 10px;
    margin-top: 50px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }

  .btn-save {
    background: #8fa8ff;
    color: black;
    border: none;
    padding: 12px 24px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
    transition: opacity 0.2s;
  }

  .btn-save:hover {
    opacity: 0.8;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 30px;
  }

  .total-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .total-price span {
    font-size: 0.9rem;
    color: #ccc;
  }

  .total-price strong {
    font-size: 1.8rem;
    color: white;
  }

  .btn-buy {
    background: #a8e6cf;
    color: black;
    border: none;
    padding: 14px 28px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1.1rem;
    font-family: inherit;
    transition: transform 0.2s, background 0.2s;
  }

  .btn-buy:hover {
    background: #90cdb6;
    transform: scale(1.05);
  }

  .back-to-top {
    text-align: center;
    margin: 40px 0;
  }

  .back-to-top a {
    color: #aaa;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .back-to-top a:hover {
    color: white;
  }

  /* Mobil reszponzivitás javítása */
  @media (max-width: 650px) {
    .builder-footer {
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }
    
    .footer-right {
      flex-direction: column;
      width: 100%;
      gap: 15px;
    }
    
    .btn-save, .btn-buy {
      width: 100%;
    }
    
    .total-price {
      align-items: center;
    }
  }
</style>