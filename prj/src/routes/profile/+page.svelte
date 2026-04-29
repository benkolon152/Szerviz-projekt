<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import CartDrawer from "$lib/components/CartDrawer.svelte";

  const API_BASE = "http://localhost:3001";

  let isOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;
  let displayName = "Profile";
  let userEmail = "";
  let isAdmin = false;
  let canViewInventory = false;
  let userId = null;

  let pfp = "";
  let phoneNumber = "";
  let city = "";
  let postalCode = "";
  let houseNumber = "";

  let saveMessage = "";
  let saveMessageIsError = false;
  let saving = false;

  onMount(async () => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        userId = parsedUser?.id ?? null;
        displayName = parsedUser?.username || "Profile";
        userEmail = parsedUser?.email || "";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);

        if (userId) {
          await fetchProfileData(userId);
        }
      } catch {
        displayName = "Profile";
        userEmail = "";
        isAdmin = false;
        canViewInventory = false;
      }
    }
  });

  async function fetchProfileData(id) {
    try {
      const response = await fetch(`${API_BASE}/api/users/${id}/profile`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.user) return;

      userEmail = data.user.useremail || "";
      pfp = data.user.pfp || "";
      phoneNumber = data.user.phone_number || "";
      city = data.user.city || "";
      postalCode = data.user.postal_code ?? "";
      houseNumber = data.user.house_number || "";
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

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

  function handlePfpUpload(event) {
    const file = event.currentTarget?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      saveMessage = "Csak képfájl tölthető fel profilképnek.";
      saveMessageIsError = true;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      saveMessage = "A profilkép legfeljebb 5 MB lehet.";
      saveMessageIsError = true;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        pfp = reader.result;
        saveMessage = "Profilkép kiválasztva. Kattints a Mentés gombra.";
        saveMessageIsError = false;
      }
    };
    reader.onerror = () => {
      saveMessage = "Nem sikerült beolvasni a kiválasztott képet.";
      saveMessageIsError = true;
    };

    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    if (!isLoggedIn || !userId) {
      saveMessage = "Jelentkezz be a módosításhoz.";
      saveMessageIsError = true;
      return;
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      saveMessage = "Az e-mail mező kötelező.";
      saveMessageIsError = true;
      return;
    }

    saving = true;
    saveMessage = "";

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          pfp: pfp.trim(),
          phone_number: phoneNumber.trim(),
          city: city.trim(),
          postal_code: postalCode === "" ? null : Number(postalCode),
          house_number: houseNumber.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        saveMessage = data.message || "Nem sikerült menteni a profilt.";
        saveMessageIsError = true;
        return;
      }

      saveMessage = "Profil sikeresen mentve.";
      saveMessageIsError = false;

      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        try {
          const parsedUser = JSON.parse(rawUser);
          parsedUser.email = normalizedEmail;
          parsedUser.pfp = pfp;
          parsedUser.phone_number = phoneNumber;
          parsedUser.city = city;
          parsedUser.postal_code = postalCode === "" ? null : Number(postalCode);
          parsedUser.house_number = houseNumber;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        } catch {
          // ignore localStorage parse issues
        }
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      saveMessage = "A mentés nem sikerült, mert a backend nem érhető el.";
      saveMessageIsError = true;
    } finally {
      saving = false;
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
      <li><a href="/">Home</a></li>
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
          {#if pfp}
            <img src={pfp} alt="Profilkép" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:8px;vertical-align:middle;" />
          {/if}
          {displayName} ▾
        </button>

        {#if isProfileOpen}
          <div class="dropdown-menu">
            {#if isLoggedIn}
              <a href="/profile"><b>My Account</b></a>
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

<h1 class="inv_h" style="text-align: center;">Profilod</h1>
{#if isLoggedIn}
  <p style="text-align: center; margin-top: -10px; opacity: 0.85;">
    Bejelentkezve mint: {displayName}{userEmail ? ` (${userEmail})` : ""}
  </p>
{:else}
  <p style="text-align: center; margin-top: -10px; opacity: 0.85;">Nem vagy bejelentkezve.</p>
{/if}

<div class="profile">
  <div class="hbox">
    <div class="pdata">
      <form on:submit={handleSaveProfile} class="profile-form">
        <img src={pfp || "white.png"} alt="Profilkép" class="profile-image" />

        <label for="email">Gmail:</label>
        <input id="email" type="email" bind:value={userEmail} required />

        <label for="pfpFile">Profilkép feltöltés:</label>
        <input id="pfpFile" type="file" accept="image/*" on:change={handlePfpUpload} />

        <label for="pfp">Profilkép URL:</label>
        <input id="pfp" type="text" bind:value={pfp} placeholder="https://..." />

        <label for="phone_number">Telefonszám:</label>
        <input id="phone_number" type="tel" bind:value={phoneNumber} placeholder="+36 ..." />

        <label for="city">Város:</label>
        <input id="city" type="text" bind:value={city} />

        <label for="postal_code">Irányítószám:</label>
        <input id="postal_code" type="number" bind:value={postalCode} min="0" step="1" />

        <label for="house_number">Házszám:</label>
        <input id="house_number" type="text" bind:value={houseNumber} />

        <button type="submit" disabled={saving}>{saving ? "Mentés..." : "Mentés"}</button>

        {#if saveMessage}
          <p class:success-message={!saveMessageIsError} class:error-message={saveMessageIsError}>
            {saveMessage}
          </p>
        {/if}
      </form>
    </div>
  </div>
</div>

<style>
  .profile {
    max-width: 760px;
    margin: 20px auto;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 12px;
    padding: 20px;
    color: #111;
  }

  .profile-form {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 10px;
    align-items: center;
  }

  .profile-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid #ccc;
    grid-column: 1 / -1;
    margin-bottom: 6px;
  }

  .profile-form input,
  .profile-form button {
    font: inherit;
    padding: 8px 10px;
    border: 1px solid #c9c9c9;
    border-radius: 8px;
  }

  .profile-form button {
    background: #5a005a;
    color: #fff;
    border: none;
    cursor: pointer;
    grid-column: 1 / -1;
  }

  .profile-form button:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .success-message,
  .error-message {
    grid-column: 1 / -1;
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
  }

  .success-message {
    background: #e7f6e7;
    color: #1f5f1f;
  }

  .error-message {
    background: #fdeaea;
    color: #8b2f2f;
  }

  @media (max-width: 700px) {
    .profile-form {
      grid-template-columns: 1fr;
    }
  }
</style>
