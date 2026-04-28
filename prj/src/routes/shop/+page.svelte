        <script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
            import { pcComponentCategoryLabels } from "$lib/pc-components";
                    import CartDrawer from "$lib/components/CartDrawer.svelte";
            import { cart, cartOpen } from "$lib/cart";

            const API_BASE = "http://localhost:3001";
            const CATEGORY_LABEL_OVERRIDES = {
                cpus: "Processzor",
                motherboards: "Alaplap",
                pcCases: "Ház",
                gpus: "Videókártya",
                rams: "Memória",
                psus: "Tápegység",
                hdds: "Merevlemez",
                ssds: "SSD",
                opticalDrives: "Optikai meghajtó",
                cpuAirCoolers: "Processzor léghűtés",
                cpuLiquidCoolers: "Processzor vízhűtés",
                monitors: "Monitor",
                keyboards: "Billentyűzet",
                mice: "Egér",
                operatingSystems: "Operációs rendszer",
            };
            const SPEC_EXCLUDED_FIELDS = new Set([
                "id",
                "category",
                "name",
                "price_huf",
                "image_url",
                "sort_order",
                "featured_shop",
                "featured_shop_order",
                "specifications",
                "created_at",
                "updated_at",
            ]);

    let isOpen = false;
    let isProfileOpen = false;
    let isLoggedIn = false;
    let displayName = "Profile";
    let userPfp = "";
    let isAdmin = false;
    let canViewInventory = false;

    let sortOpen = false;
    let featuredItems = [];
    let isLoadingFeatured = true;
    let featuredError = "";

    let categoryTiles = [];
    let isLoadingCategories = true;
    let categoriesError = "";

    let selectedCategory = "";
    let categoryItems = [];
    let isLoadingCategoryItems = false;
    let categoryItemsError = "";

    let searchQuery = "";
    let minPrice = "";
    let maxPrice = "";
    let sortBy = "recommended";
    let selectedBrands = [];
    let selectedItem = null;
    let quantity = 1;
    let isLoadingItemDetails = false;
    let itemDetailsError = "";
    let isPrebuiltView = false;

    const PREBUILT_PCS = [
        {
            id: "prebuilt-starter",
            name: "Starter Game Box",
            category: "prebuilt",
            brand: "MyApp",
            model: "Starter",
            price_huf: 329900,
            image_url: "white.png",
            description: "Belépő szintű előre összeszerelt gép játékra és tanulásra.",
        },
        {
            id: "prebuilt-balanced",
            name: "Balanced Creator PC",
            category: "prebuilt",
            brand: "MyApp",
            model: "Balanced",
            price_huf: 569900,
            image_url: "white.png",
            description: "Kiegyensúlyozott konfiguráció játékhoz, munkához és tartalomgyártáshoz.",
        },
        {
            id: "prebuilt-pro",
            name: "Pro Performance Tower",
            category: "prebuilt",
            brand: "MyApp",
            model: "Pro",
            price_huf: 899900,
            image_url: "white.png",
            description: "Erős előre összeállított PC komolyabb teljesítményigényekhez.",
        },
    ];

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        isPrebuiltView = params.get("view") === "prebuilt";

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

        if (isPrebuiltView) {
            isLoadingFeatured = false;
            isLoadingCategories = false;
            featuredItems = PREBUILT_PCS;
            return;
        }

        await Promise.all([loadFeaturedItems(), loadCategoryTiles()]);
    });

    async function loadFeaturedItems() {
        isLoadingFeatured = true;
        featuredError = "";

        try {
            const response = await fetch(`${API_BASE}/api/shop/featured`);

            if (!response.ok) {
                throw new Error("Failed to load featured items");
            }

            const data = await response.json();
            const items = (data.components ?? []).slice(0, 10);

            featuredItems = items;
        } catch (error) {
            console.error(error);
            featuredError = "Nem sikerült betölteni a kiemelt termékeket.";
        } finally {
            isLoadingFeatured = false;
        }
    }

    async function loadCategoryTiles() {
        isLoadingCategories = true;
        categoriesError = "";

        try {
            const response = await fetch(`${API_BASE}/api/shop/components`);

            if (!response.ok) {
                throw new Error("Failed to load categories");
            }

            const data = await response.json();
            const components = data.components ?? [];
            const grouped = new Map();

            for (const component of components) {
                if (!grouped.has(component.category)) {
                    grouped.set(component.category, {
                        category: component.category,
                        label: getCategoryLabel(component.category),
                        image_url: component.image_url || "",
                    });
                }
            }

            categoryTiles = Array.from(grouped.values()).sort((a, b) =>
                a.label.localeCompare(b.label, "hu"),
            );
        } catch (error) {
            console.error(error);
            categoriesError = "Nem sikerült betölteni a kategóriákat.";
        } finally {
            isLoadingCategories = false;
        }
    }

    async function openCategory(category) {
        selectedCategory = category;
        searchQuery = "";
        minPrice = "";
        maxPrice = "";
        sortBy = "recommended";
        selectedBrands = [];
        await loadCategoryItems(category);
    }

    function closeCategoryView() {
        selectedCategory = "";
        categoryItems = [];
        categoryItemsError = "";
    }

    async function openItemDetails(item) {
        selectedItem = item;
        quantity = 1;
        itemDetailsError = "";

        const itemId = Number(item?.id);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return;
        }

        isLoadingItemDetails = true;

        try {
            const response = await fetch(`${API_BASE}/api/shop/components/${itemId}`);

            if (!response.ok) {
                throw new Error("Failed to load item details");
            }

            const data = await response.json();
            if (selectedItem && Number(selectedItem.id) === itemId) {
                selectedItem = data.component ?? selectedItem;
            }
        } catch (error) {
            console.error(error);
            itemDetailsError = "Nem sikerült frissíteni a termék részleteit az adatbázisból.";
        } finally {
            isLoadingItemDetails = false;
        }
    }

    function closeItemDetails() {
        selectedItem = null;
        itemDetailsError = "";
        isLoadingItemDetails = false;
    }

    function increaseQuantity() {
        quantity = Math.min(99, quantity + 1);
    }

    function decreaseQuantity() {
        quantity = Math.max(1, quantity - 1);
    }

    function handleAddToCart() {
        if (!selectedItem) {
            return;
        }

        cart.addItem(selectedItem, quantity);
        cartOpen.open();
    }

    function handleQuickAddToCart(item, event) {
        event?.stopPropagation();
        cart.addItem(item, 1);
        cartOpen.open();
    }

    function handlePrebuiltAddToCart(item) {
        cart.addItem(item, 1);
        cartOpen.open();
    }

    async function loadCategoryItems(category) {
        isLoadingCategoryItems = true;
        categoryItemsError = "";

        try {
            const response = await fetch(`${API_BASE}/api/shop/components?category=${encodeURIComponent(category)}`);

            if (!response.ok) {
                throw new Error("Failed to load category items");
            }

            const data = await response.json();
            categoryItems = data.components ?? [];
        } catch (error) {
            console.error(error);
            categoryItemsError = "Nem sikerült betölteni a termékeket.";
        } finally {
            isLoadingCategoryItems = false;
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
            userPfp = "";
            isAdmin = false;
            canViewInventory = false;
        }

        isProfileOpen = false;
        goto("/login");
    }

    function sort() {
        sortOpen = !sortOpen;
    }

    function getCategoryLabel(category) {
        return CATEGORY_LABEL_OVERRIDES[category] || pcComponentCategoryLabels[category] || category;
    }

    function getItemName(item) {
        const fallback = [item.brand, item.model].filter(Boolean).join(" ");
        return item.name || fallback || "Névtelen termék";
    }

    function getItemBrand(item) {
        if (item.brand && String(item.brand).trim()) {
            return String(item.brand).trim().toUpperCase();
        }

        const firstWord = getItemName(item).split(" ").find(Boolean);
        return firstWord ? firstWord.toUpperCase() : "ISMERETLEN";
    }

    function toggleBrand(brand) {
        if (selectedBrands.includes(brand)) {
            selectedBrands = selectedBrands.filter((value) => value !== brand);
            return;
        }

        selectedBrands = [...selectedBrands, brand];
    }

    function clearFilters() {
        searchQuery = "";
        minPrice = "";
        maxPrice = "";
        selectedBrands = [];
    }

    function formatPrice(price) {
        return new Intl.NumberFormat("hu-HU", {
            style: "currency",
            currency: "HUF",
            maximumFractionDigits: 0,
        }).format(price ?? 0).replace("HUF", "Ft");
    }

    function formatSpecLabel(key) {
        return String(key)
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^./, (letter) => letter.toUpperCase());
    }

    function formatSpecValue(value) {
        if (Array.isArray(value)) {
            return value.map((entry) => formatSpecValue(entry)).join(", ");
        }

        if (value !== null && typeof value === "object") {
            return Object.entries(value)
                .map(([key, entry]) => `${formatSpecLabel(key)}: ${formatSpecValue(entry)}`)
                .join(" | ");
        }

        if (value === null || value === undefined || value === "") {
            return "-";
        }

        return String(value);
    }

    function getSpecificationEntries(specifications) {
        if (!specifications) {
            return [];
        }

        let parsed = specifications;

        if (typeof parsed === "string") {
            try {
                parsed = JSON.parse(parsed);
            } catch {
                return [];
            }
        }

        if (Array.isArray(parsed)) {
            return parsed.map((value, index) => ({
                key: `Spec ${index + 1}`,
                value: formatSpecValue(value),
            }));
        }

        if (parsed && typeof parsed === "object") {
            return Object.entries(parsed).map(([key, value]) => ({
                key: formatSpecLabel(key),
                value: formatSpecValue(value),
            }));
        }

        return [];
    }

    function getSpecificationEntriesFromItem(item) {
        if (!item || typeof item !== "object") {
            return [];
        }

        const directEntries = Object.entries(item)
            .filter(([key, value]) => !SPEC_EXCLUDED_FIELDS.has(key) && value !== null && value !== undefined && value !== "")
            .map(([key, value]) => ({
                key: formatSpecLabel(key),
                value: formatSpecValue(value),
            }));

        if (directEntries.length > 0) {
            return directEntries;
        }

        return getSpecificationEntries(item.specifications);
    }

    $: availableBrands = Array.from(
        new Set(categoryItems.map((item) => getItemBrand(item))),
    ).sort((a, b) => a.localeCompare(b, "hu"));

    $: filteredItems = categoryItems.filter((item) => {
        const itemName = getItemName(item).toLowerCase();
        const query = searchQuery.trim().toLowerCase();
        const price = Number(item.price_huf ?? 0);
        const min = minPrice === "" ? null : Number(minPrice);
        const max = maxPrice === "" ? null : Number(maxPrice);

        if (query && !itemName.includes(query)) {
            return false;
        }

        if (min !== null && Number.isFinite(min) && price < min) {
            return false;
        }

        if (max !== null && Number.isFinite(max) && price > max) {
            return false;
        }

        if (selectedBrands.length > 0 && !selectedBrands.includes(getItemBrand(item))) {
            return false;
        }

        return true;
    });

    $: sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === "price_asc") {
            return Number(a.price_huf ?? 0) - Number(b.price_huf ?? 0);
        }

        if (sortBy === "price_desc") {
            return Number(b.price_huf ?? 0) - Number(a.price_huf ?? 0);
        }

        if (sortBy === "name_asc") {
            return getItemName(a).localeCompare(getItemName(b), "hu");
        }

        if (sortBy === "name_desc") {
            return getItemName(b).localeCompare(getItemName(a), "hu");
        }

        const sortOrderA = Number.isFinite(Number(a.sort_order)) ? Number(a.sort_order) : Number.MAX_SAFE_INTEGER;
        const sortOrderB = Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : Number.MAX_SAFE_INTEGER;
        if (sortOrderA !== sortOrderB) {
            return sortOrderA - sortOrderB;
        }

        return getItemName(a).localeCompare(getItemName(b), "hu");
    });

    $: selectedItemSpecifications = selectedItem
        ? getSpecificationEntriesFromItem(selectedItem)
        : [];
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

<div class="shop-page">
    {#if selectedItem}
        <section class="product-detail-page">
            <button class="back-button" type="button" on:click={closeItemDetails}>← Vissza</button>

            <div class="detail-top">
                <div class="detail-left">
                    <div class="detail-image-box">
                        <img class="detail-image" src={selectedItem.image_url} alt={getItemName(selectedItem)} loading="lazy" />
                    </div>

                    <section class="detail-specs-under-image">
                        <h3>Termékleírás</h3>
                        {#if isLoadingItemDetails}
                            <p class="item-detail-empty">Adatbázis részletek betöltése...</p>
                        {:else if itemDetailsError}
                            <p class="item-detail-empty">{itemDetailsError}</p>
                        {:else if selectedItemSpecifications.length === 0}
                            <p class="item-detail-empty">Nincs megadott specifikáció ehhez a termékhez.</p>
                        {:else}
                            <ul class="detail-spec-list">
                                {#each selectedItemSpecifications as spec}
                                    <li>
                                        <span>{spec.key}</span>
                                        <strong>{spec.value}</strong>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </section>
                </div>

                <div class="detail-right">
                    <h1>{getItemName(selectedItem)}</h1>
                    <p class="detail-brand">{getCategoryLabel(selectedItem.category)} | {getItemBrand(selectedItem)}</p>
                    <p class="detail-price-main">{formatPrice(selectedItem.price_huf)}</p>

                    <div class="detail-qty-row">
                        <span>Mennyiség</span>
                        <div class="detail-qty-controls">
                            <button type="button" on:click={decreaseQuantity}>-</button>
                            <input type="number" min="1" max="99" bind:value={quantity} />
                            <button type="button" on:click={increaseQuantity}>+</button>
                        </div>
                    </div>

                    <button class="add-to-cart-button" type="button" on:click={handleAddToCart}>Hozzáadom a kosárhoz</button>
                </div>
            </div>
        </section>
    {:else if isPrebuiltView}
        <section class="featured-section">
            <div class="prebuilt-header">
                <h2 class="section-title">Előre összeszerelt PC-k</h2>
                <a href="/shop" class="back-to-shop">Összes termék megtekintése</a>
            </div>
            <p class="section-status">Ezek a gépek még nincsenek az adatbázisban, ezért külön, statikus ajánlatként jelennek meg.</p>

            <div class="featured-grid prebuilt-grid">
                {#each PREBUILT_PCS as item}
                    <article class="cards featured-card prebuilt-card">
                        <img class="image featured-image" src={item.image_url} alt={item.name} loading="lazy">
                        <div class="cards-content">
                            <p class="featured-name">{item.name}</p>
                            <p class="featured-price">{formatPrice(item.price_huf)}</p>
                            <p class="prebuilt-description">{item.description}</p>
                            <button type="button" class="add-prebuilt-button" on:click={() => handlePrebuiltAddToCart(item)}>Kosárba</button>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    {:else if !selectedCategory}
        <section class="categories-section">
            <h2 class="section-title">Számítógép alkatrész</h2>

            {#if isLoadingCategories}
                <p class="section-status">Kategóriák betöltése...</p>
            {:else if categoriesError}
                <p class="section-status">{categoriesError}</p>
            {:else}
                <div class="category-grid">
                    {#each categoryTiles as tile}
                        <button class="category-tile" type="button" on:click={() => openCategory(tile.category)}>
                            {#if tile.image_url}
                                <img class="category-image" src={tile.image_url} alt={tile.label} loading="lazy" />
                            {:else}
                                <div class="category-image category-placeholder">{tile.label.slice(0, 1)}</div>
                            {/if}
                            <span class="category-label">{tile.label}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </section>

        <section class="featured-section">
            <h2 class="section-title">Kiemelt termékeink</h2>
            {#if isLoadingFeatured}
                <p class="section-status">Kiemelt termékek betöltése...</p>
            {:else if featuredError}
                <p class="section-status">{featuredError}</p>
            {:else}
                <div class="featured-grid">
                    {#each featuredItems as item}
                        <button class="cards featured-card" type="button" on:click={() => openItemDetails(item)}>
                            <img class="image featured-image" src={item.image_url} alt={item.name} loading="lazy">
                            <div class="cards-content">
                                <p class="featured-name">{item.name}</p>
                                <p class="featured-price">{formatPrice(item.price_huf)}</p>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </section>
    {:else}
        <section class="catalog-view">
            <button class="back-button" type="button" on:click={closeCategoryView}>← Vissza a kategóriákhoz</button>

            <div class="catalog-shell">
                <aside class="filters-panel">
                    <div class="filters-header">
                        <h3>Szűrés</h3>
                        <button type="button" class="clear-button" on:click={clearFilters}>Mindent törlöm</button>
                    </div>

                    <div class="filter-block">
                        <h4>Ár</h4>
                        <div class="price-inputs">
                            <input type="number" min="0" bind:value={minPrice} placeholder="Min Ft" />
                            <input type="number" min="0" bind:value={maxPrice} placeholder="Max Ft" />
                        </div>
                    </div>

                    <div class="filter-block">
                        <h4>Gyártó</h4>
                        <div class="brand-list">
                            {#each availableBrands as brand}
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(brand)}
                                        on:change={() => toggleBrand(brand)}
                                    />
                                    {brand}
                                </label>
                            {/each}
                        </div>
                    </div>
                </aside>

                <div class="catalog-main">
                    <div class="catalog-toolbar">
                        <h2>{getCategoryLabel(selectedCategory)} <span>({sortedItems.length} termék)</span></h2>
                        <div class="toolbar-controls">
                            <input type="search" bind:value={searchQuery} placeholder="Keresés..." />
                            <select bind:value={sortBy}>
                                <option value="recommended">Legnépszerűbb</option>
                                <option value="price_asc">Ár szerint növekvő</option>
                                <option value="price_desc">Ár szerint csökkenő</option>
                                <option value="name_asc">Név szerint A-Z</option>
                                <option value="name_desc">Név szerint Z-A</option>
                            </select>
                        </div>
                    </div>

                    {#if isLoadingCategoryItems}
                        <p class="section-status">Termékek betöltése...</p>
                    {:else if categoryItemsError}
                        <p class="section-status">{categoryItemsError}</p>
                    {:else if sortedItems.length === 0}
                        <p class="section-status">Nincs találat a kiválasztott szűrésre.</p>
                    {:else}
                        <div class="product-grid">
                            {#each sortedItems as item}
                                <article class="product-card">
                                    <button class="product-details-button" type="button" on:click={() => openItemDetails(item)}>
                                        <div class="product-image-wrap">
                                            <img class="product-image" src={item.image_url} alt={getItemName(item)} loading="lazy" />
                                        </div>
                                        <div class="product-content">
                                            <p class="product-name">{getItemName(item)}</p>
                                            <p class="product-price">{formatPrice(item.price_huf)}</p>
                                        </div>
                                    </button>
                                    <div class="product-card-actions">
                                        <button class="quick-add-button" type="button" aria-label="Kosárba tesz" on:click={(event) => handleQuickAddToCart(item, event)}>
                                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM7.17 14h9.92c.75 0 1.41-.41 1.75-1.03L22 6.5l-1.74-1-3.09 5.5H8.1L4.27 3H1v2h2l3.6 7.59-1.35 2.44C4.52 16.37 5.48 18 7 18h12v-2H7l1.17-2Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </section>
    {/if}
</div>

<style>
    .shop-page {
        width: min(1450px, 94%);
        margin: 42px auto 70px;
    }

    .section-title {
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 18px;
        font-size: 1.55rem;
    }

    .section-status {
        color: white;
        font-weight: 600;
        margin: 10px 0 22px;
    }

    .categories-section {
        margin-bottom: 36px;
    }

    .category-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 14px;
    }

    .category-tile {
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.94);
        border-radius: 8px;
        color: #1d224f;
        min-height: 170px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        transition: transform 140ms ease, box-shadow 140ms ease;
    }

    .category-tile:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.2);
    }

    .category-image {
        width: 100%;
        height: 100px;
        object-fit: contain;
        border-radius: 6px;
        background: #f2f3f7;
    }

    .category-placeholder {
        display: grid;
        place-items: center;
        font-size: 2rem;
        font-weight: 700;
        color: #41509f;
    }

    .category-label {
        margin-top: 8px;
        font-size: 1.05rem;
        text-align: center;
        line-height: 1.22;
    }

    .featured-section {
        margin-top: 10px;
    }
    .featured-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 18px;
        align-items: stretch;
    }

    .prebuilt-header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 12px;
    }

    .back-to-shop {
        color: white;
        text-decoration: none;
        font-weight: 700;
    }

    .prebuilt-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .prebuilt-card {
        text-align: left;
    }

    .prebuilt-description {
        margin: 0 0 12px;
        color: #5d668d;
    }

    .add-prebuilt-button {
        border: none;
        border-radius: 999px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #1b5cff, #4d79ff);
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }

    :global(.featured-link-card) {
        display: block;
        text-decoration: none;
        color: inherit;
    }

    .featured-card {
        min-height: 100%;
        cursor: pointer;
        text-align: left;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .featured-card :global(.cards-content) {
        min-height: 86px;
        background: #ffffff;
        border-top: 1px solid #ececf3;
    }

    .featured-image {
        object-fit: cover;
        aspect-ratio: 4 / 3;
        background: #f1f1f1;
    }

    .featured-name {
        color: #0f1224;
        font-weight: 700;
        margin: 0 0 6px;
    }

    .featured-price {
        color: #111;
        margin: 0;
        font-size: 0.95rem;
    }

    .catalog-view {
        color: #111;
    }

    .back-button {
        border: 1px solid rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-radius: 999px;
        padding: 9px 16px;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: 16px;
    }

    .catalog-shell {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 20px;
        align-items: start;
    }

    .filters-panel {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 14px;
        padding: 18px;
        position: sticky;
        top: 84px;
    }

    .filters-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
    }

    .filters-header h3 {
        margin: 0;
        color: #131943;
        font-size: 1.8rem;
    }

    .clear-button {
        border: none;
        background: none;
        color: #ec3b3b;
        cursor: pointer;
    }

    .filter-block {
        margin-bottom: 18px;
    }

    .filter-block h4 {
        margin: 0 0 10px;
        color: #0e1645;
        font-size: 1.1rem;
    }

    .price-inputs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .price-inputs input {
        width: 100%;
        min-width: 0;
    }

    .price-inputs input,
    .toolbar-controls input,
    .toolbar-controls select {
        border-radius: 10px;
        border: 1px solid #cfd3e8;
        padding: 10px 12px;
        font-size: 0.95rem;
        background: white;
    }

    .brand-list {
        max-height: 260px;
        overflow-y: auto;
        display: grid;
        gap: 7px;
        padding-right: 6px;
    }

    .brand-list label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1a2156;
    }

    .catalog-main {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 14px;
        padding: 18px;
    }

    .catalog-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
        flex-wrap: wrap;
    }

    .catalog-toolbar h2 {
        color: #0f1a52;
        margin: 0;
        font-size: 2.2rem;
        line-height: 1;
    }

    .catalog-toolbar h2 span {
        color: #7b83a8;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .toolbar-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
    }

    .product-card {
        border: 2px solid #6a20d8;
        border-radius: 8px;
        background: white;
        overflow: hidden;
        text-align: left;
    }

    .product-details-button {
        width: 100%;
        border: none;
        background: transparent;
        padding: 0;
        text-align: left;
        cursor: pointer;
    }

    .product-card-actions {
        padding: 0 14px 14px;
    }

    .product-detail-page {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.45);
        padding: 16px;
        color: #0f1b52;
    }

    .product-detail-page .back-button {
        background: #f3f5fc;
        color: #162154;
        border: 1px solid #d1d8ef;
        margin-bottom: 12px;
    }

    .product-detail-page .back-button:hover {
        background: #e8edf9;
    }

    .detail-top {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 420px;
        gap: 18px;
        align-items: start;
    }

    .detail-left {
        display: grid;
        gap: 16px;
    }

    .detail-image-box {
        background: white;
        border-radius: 12px;
        border: 1px solid #e8ebf5;
        min-height: 420px;
        display: grid;
        place-items: center;
        padding: 18px;
    }

    .detail-image {
        width: 100%;
        max-height: 380px;
        object-fit: contain;
    }

    .detail-specs-under-image {
        background: white;
        border: 1px solid #e3e6f3;
        border-radius: 12px;
        padding: 14px;
    }

    .detail-specs-under-image h3 {
        margin: 0 0 10px;
        color: #101739;
        text-transform: uppercase;
        font-size: 1.03rem;
    }

    .detail-spec-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
    }

    .detail-spec-list li {
        border: 1px solid #edf0f8;
        border-radius: 10px;
        padding: 9px 11px;
        display: grid;
        gap: 4px;
    }

    .detail-spec-list span {
        color: #4f5883;
        font-size: 0.9rem;
    }

    .detail-spec-list strong {
        color: #101739;
    }

    .detail-right {
        background: white;
        border-radius: 12px;
        border: 1px solid #e8ebf5;
        padding: 18px;
        position: sticky;
        top: 84px;
    }

    .detail-right h1 {
        margin: 0 0 10px;
        color: #141f57;
        font-size: 2rem;
        line-height: 1.05;
    }

    .detail-brand {
        margin: 0 0 20px;
        color: #5f6790;
    }

    .detail-price-main {
        margin: 0 0 18px;
        color: #0f1b52;
        font-size: 2.1rem;
        font-weight: 800;
    }

    .detail-qty-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        color: #1f2a67;
    }

    .detail-qty-controls {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .detail-qty-controls button {
        border: none;
        background: #3fbf67;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        font-size: 1.2rem;
        cursor: pointer;
        line-height: 1;
    }

    .detail-qty-controls input {
        width: 56px;
        text-align: center;
        border-radius: 6px;
        border: 1px solid #ccd2eb;
        padding: 6px;
        font-size: 1rem;
    }

    .add-to-cart-button {
        width: 100%;
        border: none;
        border-radius: 8px;
        background: #08a93f;
        color: white;
        font-weight: 800;
        text-transform: uppercase;
        padding: 12px 16px;
        cursor: pointer;
    }

    .item-detail-empty {
        margin: 0;
        color: #5a6187;
    }

    .product-image-wrap {
        padding: 14px;
        display: grid;
        place-items: center;
        border-bottom: 1px solid #ececf3;
    }

    .product-image {
        width: 100%;
        max-width: 180px;
        height: 150px;
        object-fit: contain;
    }

    .product-content {
        padding: 12px 14px 14px;
        display: grid;
        gap: 10px;
    }

    .product-name {
        color: #171d48;
        font-weight: 700;
        margin: 0 0 10px;
        min-height: 42px;
    }

    .product-price {
        color: #080808;
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
    }

    .quick-add-button {
        border: none;
        border-radius: 8px;
        background: #08a93f;
        color: white;
        font-weight: 800;
        width: 52px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        cursor: pointer;
    }

    .quick-add-button svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    .quick-add-button:hover {
        background: #079137;
    }

    @media (max-width: 1100px) {
        .detail-top {
            grid-template-columns: 1fr;
        }

        .detail-right {
            position: static;
        }

        .category-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .featured-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .catalog-shell {
            grid-template-columns: 1fr;
        }

        .filters-panel {
            position: static;
        }

        .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 700px) {
        .shop-page {
            width: min(100%, 95%);
            margin-top: 20px;
        }

        .detail-image-box {
            min-height: 280px;
        }

        .detail-right h1 {
            font-size: 1.4rem;
        }

        .detail-price-main {
            font-size: 1.6rem;
        }

        .section-title {
            font-size: 1.2rem;
        }

        .category-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .featured-grid {
            grid-template-columns: 1fr;
        }

        .prebuilt-header {
            align-items: start;
            flex-direction: column;
        }

        .prebuilt-grid {
            grid-template-columns: 1fr;
        }

        .product-grid {
            grid-template-columns: 1fr;
        }

        .catalog-toolbar h2 {
            font-size: 1.6rem;
        }

        .catalog-toolbar h2 span {
            font-size: 1rem;
        }

        .toolbar-controls {
            width: 100%;
        }

        .toolbar-controls input,
        .toolbar-controls select {
            width: 100%;
        }
    }
</style>