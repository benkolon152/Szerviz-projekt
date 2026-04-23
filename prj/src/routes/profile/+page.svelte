<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userEmail = "";
  let isAdmin = false;
  let canViewInventory = false;

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        displayName = parsedUser?.username || "Profile";
        userEmail = parsedUser?.email || "";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
      } catch {
        displayName = "Profile";
        userEmail = "";
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
      userEmail = "";
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
      <li><a href="/">Home</a></li>
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
          {displayName} ▾
        </button>

        {#if isProfileOpen}
          <div class="dropdown-menu">
            <a href="/profile"><b>My Account</b></a>
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

<h1 class="inv_h" style="text-align: center;">Profilod</h1>
{#if isLoggedIn}
  <p style="text-align: center; margin-top: -10px; opacity: 0.85;">Bejelentkezve mint: {displayName}{userEmail ? ` (${userEmail})` : ""}</p>
{:else}
  <p style="text-align: center; margin-top: -10px; opacity: 0.85;">Nem vagy bejelentkezve.</p>
{/if}
<div class="profile">
    <div class="hbox">
        <div class="pdata"><!--TODO formot allitva rendezni-->
            <form action="">
                <img src="white.png" alt="placeholder"><!-- TODO GET pfp -->
                <label for="item">Profilkep változtatás:</label>
                <input class="item_name_input" type="file" id="item" name="item" required>


                <label for="item"><!--GET Name from table--></label>

                <label for="email">E-mail:</label> <!--TODO Hidden-->
                <!--option for changing email-->


                <label for="address">Szállítási cím:</label>

                <!--option to change address-->
                






                <button type="submit">Hozzáadás</button>
            </form>
        </div>
    </div>
    <div class="hbox" style="color:black;">
        <table class="table">
            <thead>
                <tr>
                    <th>Termék neve:</th>
                </tr>
                <tr>
                    <th>Termék típusa:</th>
                </tr>
                <tr>
                    <th>Mukodokepes?</th>
                </tr>
            </thead>
            <tbody>
                <!-- Table rows will be populated dynamically -->
            </tbody>
        </table>
    </div>
</div>    