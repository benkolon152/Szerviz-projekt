        <script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

            const API_BASE = "http://localhost:3001";
            const CATEGORY_LABELS = {
                cpus: "CPU processor",
                motherboards: "computer motherboard",
                pcCases: "computer case",
                gpus: "graphics card",
                rams: "RAM memory module",
                psus: "computer power supply",
                hdds: "hard disk drive",
                ssds: "solid state drive",
                opticalDrives: "optical drive",
                cpuAirCoolers: "CPU air cooler",
                cpuLiquidCoolers: "CPU liquid cooler",
                monitors: "computer monitor",
                keyboards: "computer keyboard",
                mice: "computer mouse",
                operatingSystems: "operating system software box",
            };
            const imageCache = new Map();

    let isOpen = false;
    let isProfileOpen = false;
    let isLoggedIn = false;
    let displayName = "Profile";
    let isAdmin = false;
    let canViewInventory = false;

    let sortOpen = false;
    let featuredItems = [];
    let isLoadingFeatured = true;
    let featuredError = "";

    onMount(async () => {
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

        try {
            const response = await fetch(`${API_BASE}/api/shop/featured`);

            if (!response.ok) {
                throw new Error("Failed to load featured items");
            }

            const data = await response.json();
            const items = (data.components ?? []).slice(0, 10);

            featuredItems = await Promise.all(
                items.map(async (item) => ({
                    ...item,
                    resolvedImageUrl: await resolveImageForItem(item),
                })),
            );
        } catch (error) {
            console.error(error);
            featuredError = "Nem sikerült betölteni a kiemelt termékeket.";
        } finally {
            isLoadingFeatured = false;
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

    function formatPrice(price) {
        return new Intl.NumberFormat("hu-HU", {
            style: "currency",
            currency: "HUF",
            maximumFractionDigits: 0,
        }).format(price ?? 0).replace("HUF", "Ft");
    }

    async function fetchWikimediaThumbnail(searchText) {
        const query = (searchText || "").trim();

        if (!query) {
            return null;
        }

        if (imageCache.has(query)) {
            return imageCache.get(query);
        }

        const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                imageCache.set(query, null);
                return null;
            }

            const data = await response.json();
            const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
            const source = pages?.[0]?.thumbnail?.source || null;

            imageCache.set(query, source);
            return source;
        } catch {
            imageCache.set(query, null);
            return null;
        }
    }

    async function resolveImageForItem(item) {
        const primaryQuery = `${item.name} product photo`;
        const byName = await fetchWikimediaThumbnail(primaryQuery);
        if (byName) {
            return byName;
        }

        const categoryQuery = CATEGORY_LABELS[item.category] || "computer hardware";
        const byCategory = await fetchWikimediaThumbnail(categoryQuery);
        if (byCategory) {
            return byCategory;
        }

        return getFallbackImage(item.name, item.category);
    }

    function getFallbackImage(name, category) {
        const seed = Array.from(`${category}:${name}`).reduce((value, character) => value + character.charCodeAt(0), 0);
        const hue = seed % 360;
        const background = `hsl(${hue} 35% 22%)`;
        const accent = `hsl(${(hue + 42) % 360} 70% 60%)`;
        const label = (name || "PC component").slice(0, 28);
        const categoryLabel = (category || "component").slice(0, 20);

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
                <defs>
                    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stop-color="${background}"/>
                        <stop offset="100%" stop-color="hsl(${(hue + 24) % 360} 35% 16%)"/>
                    </linearGradient>
                </defs>
                <rect width="800" height="600" rx="36" fill="url(#g)"/>
                <rect x="54" y="54" width="692" height="492" rx="28" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 10" opacity="0.6"/>
                <text x="80" y="290" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700">${categoryLabel}</text>
                <text x="80" y="350" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" opacity="0.9">${label}</text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function handleImageError(event, item) {
        event.currentTarget.onerror = null;
        event.currentTarget.src = getFallbackImage(item.name, item.category);
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
        {#if isLoadingFeatured}
            <p class="featured-status">Kiemelt termékek betöltése...</p>
        {:else if featuredError}
            <p class="featured-status">{featuredError}</p>
        {:else}
            <div class="featured-grid">
                {#each featuredItems as item}
                    <article class="cards featured-card">
                        <img class="image featured-image" src={item.resolvedImageUrl} alt={item.name} loading="lazy" on:error={(event) => handleImageError(event, item)}>
                        <div class="cards-content">
                            <p class="featured-name">{item.name}</p>
                            <p class="featured-price">{formatPrice(item.price_huf)}</p>
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .featured-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 18px;
        align-items: stretch;
    }

    .featured-card {
        min-height: 100%;
    }

    .featured-image {
        object-fit: cover;
        aspect-ratio: 4 / 3;
        background: #f1f1f1;
    }

    .featured-status {
        color: black;
        font-weight: 600;
        margin: 12px 0 24px;
    }

    .featured-name {
        color: black;
        font-weight: 700;
        margin: 0 0 6px;
    }

    .featured-price {
        color: black;
        margin: 0;
        font-size: 0.95rem;
    }

    @media (max-width: 1100px) {
        .featured-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 700px) {
        .featured-grid {
            grid-template-columns: 1fr;
        }
    }
</style>