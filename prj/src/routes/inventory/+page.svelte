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

  let loading = false;
  let message = "";
  let inventoryItems = [];
  let categoryFilter = "";
  let brandFilter = "";
  let itemsPerPage = 25;
  let currentPage = 1;
  let deletingId = null;
  let formMessage = "";
  let formSubmitting = false;
  let inventoryImageDataUrl = "";

  $: categoryOptions = [
    "all",
    ...Array.from(new Set(inventoryItems.map((item) => (item.category || "").trim()).filter(Boolean))),
  ];
  $: brandOptions = [
    "all",
    ...Array.from(new Set(inventoryItems.map((item) => (item.brand || "").trim()).filter(Boolean))),
  ];
  $: filteredInventoryItems =
    inventoryItems.filter((item) => {
      const categoryQuery = categoryFilter.trim().toLowerCase();
      const brandQuery = brandFilter.trim().toLowerCase();
      const itemCategory = (item.category || "").toLowerCase();
      const itemBrand = (item.brand || "").toLowerCase();
      const matchesCategory = !categoryQuery || itemCategory.includes(categoryQuery);
      const matchesBrand = !brandQuery || itemBrand.includes(brandQuery);

      return matchesCategory && matchesBrand;
    });
  $: totalPages = Math.max(1, Math.ceil(filteredInventoryItems.length / itemsPerPage));
  $: if (currentPage > totalPages) currentPage = totalPages;
  $: paginatedInventoryItems = filteredInventoryItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  onMount(async () => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (!rawUser) {
      displayName = "Profile";
      userPfp = "";
      isAdmin = false;
      canViewInventory = false;
      await fetchInventory();
      return;
    }

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

    await fetchInventory();
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

  function formatPrice(price) {
    if (price === null || price === undefined || price === "") return "-";
    const numeric = Number(price);
    if (Number.isNaN(numeric)) return String(price);
    return `${numeric.toLocaleString("hu-HU")} Ft`;
  }

  async function fetchInventory() {
    loading = true;
    message = "";

    try {
      const response = await fetch(`${API_BASE}/api/inventory`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        inventoryItems = [];
        message = data.message || "Nem sikerült betölteni a raktárkészletet.";
        return;
      }

      inventoryItems = data.items || [];
      currentPage = 1;
    } catch (error) {
      console.error("Error loading inventory:", error);
      inventoryItems = [];
      message = "A backend nem érhető el a http://localhost:3001 címen.";
    } finally {
      loading = false;
    }
  }

  async function handleDeleteInventoryItem(itemId) {
    if (!itemId) return;

    const shouldDelete = confirm("Biztosan törlöd ezt a terméket?");
    if (!shouldDelete) return;

    deletingId = itemId;
    message = "";

    try {
      const response = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        message = data.message || "Nem sikerült törölni a terméket.";
        return;
      }

      inventoryItems = inventoryItems.filter((item) => item.id !== itemId);
      message = "Termék sikeresen törölve.";
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      message = "A törlés nem sikerült, mert a backend nem érhető el.";
    } finally {
      deletingId = null;
    }
  }

  function handleCategoryChange(event) {
    categoryFilter = event.currentTarget.value;
    currentPage = 1;
  }

  function handleBrandChange(event) {
    brandFilter = event.currentTarget.value;
    currentPage = 1;
  }

  function handleFilterInput() {
    currentPage = 1;
  }

  function handleInventoryImageUpload(event) {
    const file = event.currentTarget?.files?.[0];
    if (!file) {
      inventoryImageDataUrl = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      formMessage = "Csak képfájl tölthető fel.";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      formMessage = "A kép legfeljebb 5 MB lehet.";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        inventoryImageDataUrl = reader.result;
      }
    };
    reader.onerror = () => {
      formMessage = "Nem sikerült beolvasni a kiválasztott képet.";
    };
    reader.readAsDataURL(file);
  }

  async function handleAddInventoryItem(event) {
    event.preventDefault();
    formSubmitting = true;
    formMessage = "";

    const formData = new FormData(event.target);
    const name = formData.get("item");
    const category = formData.get("category");
    const brand = formData.get("brand");
    const model = formData.get("model");
    const price_huf = Number(formData.get("price"));

    // Validate fields
    if (!name || !category || !brand || !model || !price_huf) {
      formMessage = "Kérlek töltsd ki az összes mezőt!";
      formSubmitting = false;
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          brand,
          model,
          price_huf,
          image_url: inventoryImageDataUrl || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        formMessage = data.message || "Nem sikerült hozzáadni a terméket.";
        formSubmitting = false;
        return;
      }

      formMessage = "✓ Termék sikeresen hozzáadva!";
      event.target.reset();
      inventoryImageDataUrl = "";
      
      // Refresh inventory list
      await fetchInventory();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        formMessage = "";
      }, 3000);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      formMessage = "A hozzáadás nem sikerült, mert a backend nem érhető el.";
    } finally {
      formSubmitting = false;
    }
  }

  function goToPage(page) {
    currentPage = Math.min(Math.max(1, page), totalPages);
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
        <li><a href="/inventory"><b>Inventory</b></a></li>
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
  <section class="inventory-form-panel">
    <h2>Új termék hozzáadása</h2>
    <form class="inventory-form" on:submit={handleAddInventoryItem}>
      <label for="item">Termék neve:</label>
      <input class="item_name_input" type="text" id="item" name="item" required>

      <label for="category">Kategória:</label>
      <select class="item_category_input" id="category" name="category" required>
        <option value="" disabled selected>Válassz kategóriát</option>
        {#each categoryOptions.filter((option) => option !== "all") as category}
          <option value={category}>{category}</option>
        {/each}
      </select>

      <label for="brand">Márka:</label>
      <input class="item_brand_input" type="text" id="brand" name="brand" required>

      <label for="model">Modell:</label>
      <input class="item_model_input" type="text" id="model" name="model" required>

      <label for="price">Ár:</label>
      <input class="item_price_input" type="number" id="price" name="price" min="0" step="1" required>

      <label for="image">Kep a termekrol:</label>
      <input class="item_image_input" type="file" id="image" name="image" accept="image/*" on:change={handleInventoryImageUpload}>

      {#if inventoryImageDataUrl}
        <div class="inventory-upload-preview-wrap">
          <img src={inventoryImageDataUrl} alt="Feltöltött kép előnézet" class="inventory-upload-preview" />
        </div>
      {/if}

      <div class="form-button-container">
        <button type="submit" disabled={formSubmitting}>
          {formSubmitting ? "Hozzáadás..." : "Hozzáadás"}
        </button>
        {#if formMessage}
          <span class="form-message" class:success={formMessage.includes("✓")} class:error={!formMessage.includes("✓")}>
            {formMessage}
          </span>
        {/if}
      </div>
    </form>
  </section>

  <section class="inventory-table-panel">
    <div class="inventory-table-tools">
      <label for="category-filter">Szűrés kategóriára:</label>
      <input
        id="category-filter"
        class="filter-input"
        bind:value={categoryFilter}
        on:input={handleFilterInput}
        list="category-options"
        placeholder="Összes vagy keress rá..."
      />
      <datalist id="category-options">
        {#each categoryOptions.filter((option) => option !== "all") as category}
          <option value={category}></option>
        {/each}
      </datalist>

      <label for="brand-filter">Szűrés márkára:</label>
      <input
        id="brand-filter"
        class="filter-input"
        bind:value={brandFilter}
        on:input={handleFilterInput}
        list="brand-options"
        placeholder="Összes vagy keress rá..."
      />
      <datalist id="brand-options">
        {#each brandOptions.filter((option) => option !== "all") as brand}
          <option value={brand}></option>
        {/each}
      </datalist>
    </div>

    <table class="inventory-table">
            <thead>
                <tr>
                    <th>Kategória:</th>
                    <th>Márka:</th>
                    <th>Modell:</th>
                    <th>Ár:</th>
                    <th>Kép</th>
                    <th>Művelet</th>
                </tr>
            </thead>
            <tbody>
          {#if loading}
            <tr>
              <td colspan="6">Betöltés...</td>
            </tr>
          {:else if paginatedInventoryItems.length === 0}
            <tr>
              <td colspan="6">{message || "Nincs megjeleníthető raktár adat."}</td>
            </tr>
          {:else}
            {#each paginatedInventoryItems as item}
              <tr>
                <td>{item.category || "-"}</td>
                <td>{item.brand || "-"}</td>
                <td>{item.model || "-"}</td>
                <td>{formatPrice(item.price_huf)}</td>
                <td class="image-cell">
                  {#if item.image_url}
                    <img class="inventory-image" src={item.image_url} alt="" loading="lazy" />
                  {:else}
                    -
                  {/if}
                </td>
                <td>
                  <button
                    type="button"
                    class="delete-btn"
                    disabled={deletingId === item.id}
                    on:click={() => handleDeleteInventoryItem(item.id)}
                  >
                    {deletingId === item.id ? "Törlés..." : "Törlés"}
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
            </tbody>
        </table>

        <div class="pagination">
          <button type="button" class="page-btn" on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading}>
            Előző
          </button>

          <div class="page-info">
            Oldal {currentPage} / {totalPages}
          </div>

          <button type="button" class="page-btn" on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading}>
            Következő
          </button>
        </div>
        </section>
</div>    

  {#if message && inventoryItems.length > 0}
    <p style="text-align:center; color:#8a2d2d;">{message}</p>
  {/if}

<style>
  .inventory {
    width: min(1200px, 92vw);
    margin: 30px auto 60px auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: center;
  }

  .inventory-form-panel,
  .inventory-table-panel {
    width: 100%;
    background: rgba(255, 255, 255, 0.96);
    border-radius: 14px;
    padding: 16px;
    color: #111;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
  }

  .inventory-form-panel h2 {
    margin: 0 0 14px 0;
    font-size: 1.15rem;
  }

  .inventory-form {
    display: grid;
    grid-template-columns: repeat(4, minmax(170px, 1fr));
    gap: 10px;
    align-items: center;
  }

  .inventory-form input,
  .inventory-form button {
    min-width: 0;
  }

  .inventory-form button {
    height: 36px;
  }

  .form-button-container {
    display: flex;
    align-items: center;
    gap: 12px;
    grid-column: 1 / -1;
  }

  .inventory-upload-preview-wrap {
    grid-column: 1 / -1;
  }

  .inventory-upload-preview {
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #d0d0d0;
  }

  .form-button-container button {
    grid-column: auto;
  }

  .form-message {
    font-size: 0.95rem;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .form-message.success {
    color: #2d5016;
    background: rgba(45, 80, 22, 0.1);
  }

  .form-message.error {
    color: #8a2d2d;
    background: rgba(138, 45, 45, 0.1);
  }

  .inventory-table-tools {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .filter-input {
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    padding: 6px 10px;
    font: inherit;
    background: #fff;
    min-width: 220px;
  }

  .inventory-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .inventory-table th,
  .inventory-table td {
    border-bottom: 1px solid #ececec;
    text-align: left;
    padding: 10px 8px;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }

  .image-cell {
    padding-left: 0;
  }

  .inventory-table th {
    font-weight: 700;
  }

  .delete-btn {
    border: none;
    background: #b53b3b;
    color: #fff;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font: inherit;
  }

  .delete-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 16px;
    flex-wrap: wrap;
  }

  .page-btn {
    border: none;
    background: #5a005a;
    color: white;
    border-radius: 8px;
    padding: 8px 14px;
    font: inherit;
    cursor: pointer;
  }

  .page-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .page-info {
    color: #111;
    font-weight: 600;
  }

  .inventory-image {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 6px;
    display: block;
    margin: 0 auto 0 0;
    transform: translateX(-14px);
  }

  @media (max-width: 980px) {
    .inventory-form {
      grid-template-columns: 1fr 1fr;
    }

    .inventory-table-tools {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 640px) {
    .inventory-form {
      grid-template-columns: 1fr;
    }

    .inventory-table th,
    .inventory-table td {
      padding: 8px 6px;
      font-size: 0.9rem;
    }

    .filter-input {
      min-width: 100%;
      width: 100%;
    }
  }
</style>