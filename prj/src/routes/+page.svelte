<script>

  let isNavOpen = false;
  let isProfileOpen = false;
  let isLoggedIn = false;

  function toggle() {
    isNavOpen = !isNavOpen;
  }

  function toggleProfile(){
    isProfileOpen = !isProfileOpen;
  }

  function handleLogout() {
    isLoggedIn = false;
    isProfileOpen = false;
  }
</script>

<!-- ---------------------------------NAV-------------------------------- -->
<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a> <!-- TODO logo-->

    <button class="hamburger" type="button" on:click={toggle}>
      ☰
    </button>
    <!--TODO this should be on the left side-->
    <ul class="nav-links" class:open={isNavOpen}>
      <li><a href="/"><b>Home</b></a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>

      <!-- stay on the right-->
      <li class="profile-menu">
        <button class="profile-toggle" type="button" aria-expanded={isProfileOpen} on:click={toggleProfile}>
          Profile
        </button>

        <ul class="profile-dropdown" class:open={isProfileOpen}>
          {#if isLoggedIn}
            <li><a href="/profile">My account</a></li>
            <li><a href="/orders">Orders</a></li>
            <li><button type="button" on:click={handleLogout}>Logout</button></li>
          {:else}
            <li><a href="/login">Login</a></li>
          {/if}
        </ul>
      </li>
    </ul>
  </div>
</nav>

<!-- ---------------------------------HOME-------------------------------- -->
<div class="home">
<img src="white.png" alt="" style="width: 100%; height: 400px; object-fit: cover; margin: 20px 0;" />
    <h1 class="cimek">Kiemelt</h1>
    <div class="hbox cards-container">
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Előre összeszerelt PC-k</h4>
            <p>Minőségi, előre összeszerelt számítógépek a kedvező árú modellektől a legerősebb konfigurációkig.</p>
        </div>
      </div>
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Szerviz és javítás</h4>
            <p>Bármilyen számítógépes probléma megoldható.</p>
        </div>
      </div>
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Használt és új alkatrészek</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
    </div>
<!-- ---------------------------------PC BUILDEK-------------------------------- -->
  <h1 class="cimek">PC Buildek</h1>

  <div class="pck pck-top">
    <div class="hbox cards-container">
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
    </div>
  </div>
  <div class="pck pck-bottom">
    <div class="hbox cards-container">
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
      <div class="cards">
        <img src="white.png" alt="Avatar" style="width:100%">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
    </div>
  </div>

<!-- ---------------------------------Rólunk-------------------------------- -->

  <section class="about">
    <div class="hbox">
      <div class="about-content">
        <h2>Rólunk</h2>

        <div class="about-text">
          <h4>Subheading</h4>
          <p>Body text for whatever you'd like to expand on the main point.</p>
        </div>

        <div class="about-text">
          <h4>Subheading</h4>
          <p>Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes.</p>
        </div>

        <div class="about-text">
          <h4>Subheading</h4>
          <p>Body text for whatever you'd like to add more to the main point. It provides details, explanations, and context.</p>
        </div>
      </div>

      <div class="image-container">
        <img class="image" src="white.png" alt="About illustration" />
      </div>
    </div>
  </section>

<!-- ---------------------------------FOOTER-------------------------------- -->
  <h1 class="cimek">Értékelések</h1>
  <div class="rewiews">
    <div class="hbox">
      <div class="cards">
        <div class="vbox">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div class="image-container" style="overflow: hidden; border-radius: 50%; background: black;">
              <img class="image" style="color:transparent; height: 50px; width: 50px; object-fit: cover;" src="white.png" alt="placeholder" />
            </div>
            <div class="name">
              <h5 style="color: black;">Name</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="cards">
        <div class="vbox">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div class="image-container" style="overflow: hidden; border-radius: 50%; background: black;">
              <img class="image" style="color:transparent; height: 50px; width: 50px; object-fit: cover;" src="white.png" alt="placeholder" />
            </div>
            <div class="name">
              <h5 style="color: black;">Name</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="cards">
        <div class="vbox">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div class="image-container" style="overflow: hidden; border-radius: 100%; background: black;">
              <img class="image" style="color:transparent; height: 50px; width: 50px; object-fit: cover;" src="white.png" alt="placeholder" />
            </div>
            <div class="name">
              <h5 style="color: black;">Name</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

<!-- ---------------------------------FOOTER-------------------------------- -->
  <footer class="footer">
    <div class="footer-top">
      <div>
        <h3>Site name</h3>
        <div class="socials">
          <span>🌐</span>
          <span>🔗</span>
          <span>📸</span>
        </div>
      </div>

      <div class="links">
        <div>
          <h4>Topic</h4>
          <p>Page</p>
          <p>Page</p>
          <p>Page</p>
        </div>
        <div>
          <h4>Topic</h4>
          <p>Page</p>
          <p>Page</p>
          <p>Page</p>
        </div>
        <div>
          <h4>Topic</h4>
          <p>Page</p>
          <p>Page</p>
          <p>Page</p>
        </div>
      </div>
    </div>
  </footer>
</div>