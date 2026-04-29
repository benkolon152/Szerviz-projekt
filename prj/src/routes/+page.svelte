<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import CartDrawer from "$lib/components/CartDrawer.svelte";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userPfp = "";
  let isAdmin = false;
  let canViewInventory = false;

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

  function openFeaturedShop() {
    goto("/shop?view=prebuilt");
  }

  function openRepairForm() {
    goto("/form");
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

<div class="home">
  <img class="banner" src="banner.png" alt="kep" />
  
  <h1 class="cimek">Kiemelt</h1>
  <div class="highlight">
    <div class="cards-container">
      <a class="cards featured-link-card" href="/shop?view=prebuilt" on:click|preventDefault={openFeaturedShop}>
        <img class="image" src="https://uavftnxveesjyonfmhak.supabase.co/storage/v1/object/public/partpictures/prebuilts/3.jpg" alt="kep">
        <div class="cards-content">
            <h4>Előre összeszerelt PC-k</h4>
            <p>Minőségi, előre összeszerelt számítógépek a kedvező árú modellektől a legerősebb konfigurációkig.</p>
        </div>
      </a>
      <a class="cards featured-link-card" href="/form" on:click|preventDefault={openRepairForm}>
        <div class="middle-card-image-shell">
          <img class="image" src="repair.jpg" alt="kep">
        </div>
        <div class="cards-content">
            <h4>Szerviz és javítás</h4>
            <p>Bármilyen számítógépes probléma megoldható.</p>
        </div>
      </a>
      <a class="cards featured-link-card" href="/shop" on:click|preventDefault={() => goto("/shop")}>
        <img class="image" src="https://uavftnxveesjyonfmhak.supabase.co/storage/v1/object/public/partpictures/pc-components/10604.jpg" alt="kep">
        <div class="cards-content">
            <h4>Használt és új alkatrészek</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </a>
    </div>
  </div>
<section class="about">
    <div class="about-content">
      <h2>Rólunk</h2>
      <div class="about-text">
        <h4>Subheading</h4>
        <p>Body text for whatever you'd like to expand on the main point.</p>
      </div>
      <div class="about-text">
        <h4>Subheading</h4>
        <p>Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes.</p>
      </div>
      <div class="about-text">
        <h4>Subheading</h4>
        <p>Body text for whatever you'd like to add more to the main point. It provides details, explanations, and context.</p>
      </div>
    </div>

    <div class="image-container">
      <img class="image" src="white.png" alt="" />
    </div>
  </section>

<h1 class="cimek">Értékelések</h1>
  <div class="rewiews">
    <div class="hbox wrap" style="justify-content: center;">
      
      <div class="cards">
        <div class="vbox h-100">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div style="overflow: hidden; border-radius: 50%; background: black; width: 50px; height: 50px;">
              <img style="height: 100%; width: 100%; object-fit: cover;" src="white.png" alt="kep" />
            </div>
            <div class="name">
              <h5 style="color: black; margin: 0;">Name</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="cards">
        <div class="vbox h-100">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div style="overflow: hidden; border-radius: 50%; background: black; width: 50px; height: 50px;">
              <img style="height: 100%; width: 100%; object-fit: cover;" src="white.png" alt="kep" />
            </div>
            <div class="name">
              <h5 style="color: black; margin: 0;">Name</h5>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<footer class="footer">
  <div class="footer-top">
    <div>
      <h3>Site name</h3>
      <div class="socials">
        <span>🌐</span>
        <span>🔗</span>
        <span>📸</span>
      </div>
    </div>

    <div class="links">
      <div>
        <h4>Topic</h4>
        <p>Page</p>
        <p>Page</p>
        <p>Page</p>
      </div>
      <div>
        <h4>Topic</h4>
        <p>Page</p>
        <p>Page</p>
        <p>Page</p>
      </div>
      <div>
        <h4>Topic</h4>
        <p>Page</p>
        <p>Page</p>
        <p>Page</p>
      </div>
    </div>
  </div>
</footer>

<style>
.featured-link-card {
  display: block;
  overflow: visible;
  transition: transform 180ms ease, box-shadow 180ms ease;
  transform-origin: center;
  will-change: transform, box-shadow;
  border-radius: 8px;
}
.featured-link-card:hover,
.featured-link-card:focus {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 14px 30px rgba(2,6,23,0.12), 0 6px 12px rgba(2,6,23,0.06);
  z-index: 2;
}

.middle-card-image-shell {
  background: #fff;
}
</style>