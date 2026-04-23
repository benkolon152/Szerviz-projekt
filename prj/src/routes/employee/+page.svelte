<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let canViewInventory = false;

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);
    if (!rawUser) return;

    try {
      const parsedUser = JSON.parse(rawUser);
      displayName = parsedUser?.username || "Profile";
      canViewInventory = Boolean(parsedUser?.isadmin) || Boolean(parsedUser?.isemployee);
    } catch {
      displayName = "Profile";
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