        <script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    let isOpen = false;
    let isProfileOpen = false;
    let isLoggedIn = false;
    let displayName = "Profile";
    let isAdmin = false;
    let canViewInventory = false;

    let sortOpen = false;

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

    function sort() {
        sortOpen = !sortOpen;
    }
</script>

<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a> <!-- TODO logo-->

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>
    <!--TODO this should be on the left side-->
    <ul class="nav-links" class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop"><b>Store</b></a></li>
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

<div class="shop" style="text-align: center;">
    <div class="vbox" style="overflow-y: auto;">
        <div class="hbox" style="display:flex; position:relative; color: black; margin-bottom: 35px; justify-content:center;align-items:center;"><h2><b style="color:black;">Kiemelt Termékeink</b></h2>
            <button class="hamburger_sort" on:click={sort} style="background-color: black; border-radius:15px; max-height:35px;"> ☰</button>
        </div>
        <div class="hbox cards-container">
            <div class="cards">
                    <img class="image" src="white.png" alt="Avatar">
                    <div class="cards-content">
                        <p style="color: black">placeholder text</p>
                    </div>
            </div>
            <div class="cards">
                    <img class="image" src="white.png" alt="Avatar" >
                    <div class="cards-content">
                    </div>
            </div>
            <div class="cards">
                    <img class="image" src="white.png" alt="Avatar">
                    <div class="cards-content">
                    </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar" >
                <div class="cards-content">
                </div>
            </div>
        </div>

        <div class=" hbox cards-container">
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar" >
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
        </div>
        <div class=" hbox cards-container">
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar" >
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
            <div class="cards">
                <img class="image" src="white.png" alt="Avatar">
                <div class="cards-content">
                </div>
            </div>
        </div>
    </div>
</div>