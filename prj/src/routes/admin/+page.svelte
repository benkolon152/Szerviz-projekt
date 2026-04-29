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
    if (!rawUser) return;

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
</script>

<!-- ---------------------------------NAV-------------------------------- -->
<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a> <!-- TODO logo-->

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>
    <!--TODO this should be on the left side-->
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