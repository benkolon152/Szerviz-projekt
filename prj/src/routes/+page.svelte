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
  let userId = null;
  let reviewText = "";
  let reviewError = "";
  let reviews = [];

  const API_BASE = "http://localhost:3001";

  function normalizeReview(rawReview) {
    const createdAt = String(rawReview?.created_at || rawReview?.createdAt || new Date().toISOString());
    const text = String(rawReview?.content || rawReview?.text || "").trim();

    if (!text) {
      return null;
    }

    return {
      id: String(rawReview?.id || `${Date.now()}-${Math.random()}`),
      user_id: Number(rawReview?.user_id) || null,
      username: String(rawReview?.user || rawReview?.username || "Felhasználó"),
      pfp: String(rawReview?.pfp || "").trim(),
      text,
      createdAt
    };
  }

  async function loadReviews() {
    reviewError = "";

    try {
      const response = await fetch(`${API_BASE}/api/comments`);
      const data = await response.json();

      if (!response.ok) {
        reviewError = data?.message || "Az értékelések betöltése sikertelen.";
        reviews = [];
        return;
      }

      const rawReviews = Array.isArray(data?.comments) ? data.comments : [];
      reviews = rawReviews.map(normalizeReview).filter(Boolean).slice(0, 6);
    } catch {
      reviewError = "A backend nem érhető el a kommentek betöltéséhez.";
      reviews = [];
    }
  }

  async function deleteReview(commentId) {
    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, isadmin: isAdmin })
      });

      const data = await response.json();

      if (!response.ok) {
        reviewError = data?.message || "A komment törlése sikertelen.";
        return;
      }

      reviews = reviews.filter(r => r.id !== commentId);
      reviewError = "";
    } catch {
      reviewError = "A backend nem érhető el a komment törléséhez.";
    }
  }

  function formatReviewDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  async function submitReview() {
    if (!isLoggedIn) {
      reviewError = "Komment írásához jelentkezz be.";
      return;
    }

    const trimmedText = reviewText.trim();
    if (!trimmedText) {
      reviewError = "A komment nem lehet üres.";
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          pfp: userPfp || "",
          content: trimmedText,
          user: displayName || "Felhasználó"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        reviewError = data?.message || "A komment mentése sikertelen.";
        return;
      }

      const nextReview = normalizeReview(data?.comment);
      if (nextReview) {
        reviews = [nextReview, ...reviews].slice(0, 6);
      }

      reviewText = "";
      reviewError = "";
    } catch {
      reviewError = "A backend nem érhető el a komment mentéséhez.";
    }
  }

  onMount(() => {
    const rawUser = localStorage.getItem("user");
    isLoggedIn = Boolean(rawUser);

    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        userId = Number(parsedUser?.id) || null;
        displayName = parsedUser?.username || "Profile";
        userPfp = parsedUser?.pfp || "";
        isAdmin = Boolean(parsedUser?.isadmin);
        canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
      } catch {
        userId = null;
        displayName = "Profile";
        userPfp = "";
        isAdmin = false;
        canViewInventory = false;
      }
    }

    loadReviews();
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
      userId = null;
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
        <img class="image" src="pcreapair.png" alt="kep">
        <div class="cards-content">
            <h4>Szerviz és javítás</h4>
            <p>Bármilyen számítógépes probléma megoldható.</p>
        </div>
      </a>
      <a class="cards featured-link-card" href="/shop" on:click|preventDefault={() => goto("/shop")}>
        <img class="image" src="pcParts.png" alt="kep">
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
        <h4>Szakértelem és Megbízhatóság</h4>
        <p>Több mint 15 éve szolgáljuk az informatika szerelmeseit a legmagasabb szintű szolgáltatással. Csapatunk elkötelezett a minőségi alkatrészek és professzionális szerviz nyújtása mellett, hogy Ön mindig a legjobb teljesítményt kapja.</p>
      </div>
      <div class="about-text">
        <h4>Teljes Körű Megoldások</h4>
        <p>Legyen szó az új gépek összeállításáról, szétöregedett komponensek cseréjéről vagy bármilyen szervizelési problémáról, mi itt vagyunk. Szállítunk használt és új alkatrészeket, előre összeszerelt PC-ket, és biztosítunk gyors, megbízható javítási szolgáltatást.</p>
      </div>
      <div class="about-text">
        <h4>Az Ön Sikere Prioritásunk</h4>
        <p>Nem csak terméket adunk el, hanem hosszú ideig tartó partnerséget kínálunk. Szakértő csapatunk bármikor segít tanácsadással, támogatással és a legjobb megoldások megtalálásával. Hiszünk abban, hogy a jó kommunikáció és az ügyfélelégedettség a siker alapja.</p>
      </div>
    </div>

    <div class="image-container">
      <img class="image" src="about.png" alt="" />
    </div>
  </section>

<h1 class="cimek">Értékelések</h1>
  <div class="rewiews">
    <div class="reviews-composer">
      <textarea
        class="review-input"
        bind:value={reviewText}
        placeholder={isLoggedIn ? "Írd meg a véleményed..." : "Kommenteléshez jelentkezz be"}
        maxlength="280"
      ></textarea>
      <button class="review-submit" on:click={submitReview}>Komment küldése</button>
      {#if reviewError}
        <p class="review-error">{reviewError}</p>
      {/if}
    </div>

    <div class="hbox wrap" style="justify-content: center;">
      {#if reviews.length === 0}
        <p class="reviews-empty">Még nincs értékelés. Légy te az első!</p>
      {:else}
        {#each reviews as review (review.id)}
          <div class="cards">
            <div class="vbox h-100">
              <p class="comment">{review.text}</p>
              <div class="hbox reviewer">
                <div class="reviewer-avatar">
                  <img
                    style="height: 100%; width: 100%; object-fit: cover;"
                    src={review.pfp || "white.png"}
                    alt="profilkép"
                    on:error={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "white.png";
                    }}
                  />
                </div>
                <div class="name">
                  <h5 style="color: black; margin: 0;">{review.username}</h5>
                  <p class="review-date">{formatReviewDate(review.createdAt)}</p>
                </div>
              </div>
              {#if isAdmin || (isLoggedIn && userId === review.user_id)}
                <button class="delete-comment-btn" on:click={() => deleteReview(review.id)}>
                  ✕ Törlés
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}

    </div>
  </div>
</div>

<footer class="footer">
  <div class="footer-top">
    <div>
      <h3>MyApp - PC Alkatrészek & Szerviz</h3>
    </div>

    <div class="links">
      <div>
        <h4>Termékek</h4>
        <p><a href="/shop">PC Komponensek</a></p>
        <p><a href="/shop?view=prebuilt">Előre Összeépített PC</a></p>
        <p><a href="/pcbuild">PC Builder</a></p>
      </div>
      <div>
        <h4>Szolgáltatások</h4>
        <p><a href="/form">Szerviz & Javítás</a></p>
        <p><a href="/form">Gépdiagnózis</a></p>
        <p><a href="/">Konzultáció</a></p>
      </div>
      <div>
        <h4>Ügyfél</h4>
        <p><a href="/profile">Profilom</a></p>
        <p><a href="/orders">Rendeléseim</a></p>
        <!-- <p><a href="/">Gyakran Ismételt Kérdések</a></p> -->
      </div>
    </div>
  </div>
  <div class="footer-credit">
    <p>© 2026 MyApp PC Alkatrészek & Szerviz. Minden jog fenntartva.</p>
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

.reviews-composer {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  max-width: 760px;
  margin: 0 auto 20px;
}

.review-input {
  min-height: 96px;
  resize: vertical;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.18);
  color: white;
  outline: none;
}

.review-input::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.review-submit {
  width: fit-content;
  align-self: flex-end;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: #1a0033;
  font-weight: 700;
  cursor: pointer;
}

.review-error {
  margin: 0;
  text-align: left;
  color: #ffd3d3;
}

.reviews-empty {
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.reviewer-avatar {
  overflow: hidden;
  border-radius: 50%;
  background: black;
  width: 50px;
  height: 50px;
}

.review-date {
  margin: 4px 0 0;
  font-size: 12px;
  color: #4b5563 !important;
}

.delete-comment-btn {
  align-self: flex-end;
  margin-top: auto;
  padding: 6px 12px;
  font-size: 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 150ms ease;
}

.delete-comment-btn:hover {
  background: #ee5a5a;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.links {
  display: flex;
  gap: 60px;
  flex: 1;
  min-width: 0;
}

.links div {
  flex: 1;
  min-width: 140px;
}
</style>