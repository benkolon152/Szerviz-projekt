<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let isAdmin = false;

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);
    if (!rawUser) return;

    try {
      const parsedUser = JSON.parse(rawUser);
      displayName = parsedUser?.username || "Profile";
      isAdmin = Boolean(parsedUser?.isadmin);
    } catch {
      displayName = "Profile";
      isAdmin = false;
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
      <li><a href="/inventory"><b>Inventory</b></a></li>

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
<h1 class="inv_h" style="text-align: center;">Raktárkészlet</h1>
<div class="inventory">
    <div class="hbox">
        <div class="upform"><!--TODO formot allitva rendezni-->
            <form action="">
                <label for="item">Termék neve:</label>
                <input class="item_name_input" type="text" id="item" name="item" required>

                <label for="type">Termék típusa:</label> <!--TODO dropdown menu-->
                <input class="item_type_input" type="text" id="type" name="type" required>

                <label for="isworking">Mukodokepes?:</label>
                <input class="item_isworking_input" type="boolean" id="isworking" name="isworking" required>

                <label for="image">Kep a termekrol:</label>
                <input class="item_image_input" type="file" id="image" name="image" required><!-- TODO image upload functionality with the pic showing -->



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