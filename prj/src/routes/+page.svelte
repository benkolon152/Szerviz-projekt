<script>
  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a>

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>
    
    <ul class:open={isOpen}>
      <li><a href="/"><b>Home</b></a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>
      <li><a href="/">Profile</a></li> 
      <li><a href="/login">Login</a></li>
    </ul>
  </div>
</nav>

<div class="home">
  <img class="banner" src="white.png" alt="kep" />
  
  <h1 class="cimek">Kiemelt</h1>
  <div class="highlight">
    <div class="cards-container">
      <div class="cards">
        <img class="image" src="white.png" alt="kep">
        <div class="cards-content">
            <h4>Előre összeszerelt PC-k</h4>
            <p>Minőségi, előre összeszerelt számítógépek a kedvező árú modellektől a legerősebb konfigurációkig.</p>
        </div>
      </div>
      <div class="cards">
        <img class="image" src="white.png" alt="kep">
        <div class="cards-content">
            <h4>Szerviz és javítás</h4>
            <p>Bármilyen számítógépes probléma megoldható.</p>
        </div>
      </div>
      <div class="cards">
        <img class="image" src="white.png" alt="kep">
        <div class="cards-content">
            <h4>Használt és új alkatrészek</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
    </div>
  </div>
  
<h1 class="cimek">PC Buildek</h1>
  <div class="pck">
    <div class="cards-container">
      <div class="cards wide-card">
        <img class="image" src="white.png" alt="kep">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
      <div class="cards wide-card">
        <img class="image" src="white.png" alt="kep">
        <div class="cards-content">
            <h4>Alcím</h4>
            <p>Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
        </div>
      </div>
    </div>
  </div>

  <h1 class="cimek">Egyéb Buildek</h1>
  <div class="grid-double">
    <div class="cards wide-card">
      <img class="image" src="white.png" alt="Build">
      <div class="cards-content">
        <h4>Alcím</h4>
        <p>Szöveg helye – részletek az ajánlatról.</p>
      </div>
    </div>
    <div class="cards wide-card">
      <img class="image" src="white.png" alt="Build">
      <div class="cards-content">
        <h4>Alcím</h4>
        <p>Szöveg helye – részletek az ajánlatról.</p>
      </div>
    </div>
  </div>

<section class="about">
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
      <img class="image" src="white.png" alt="About image" />
    </div>
  </section>

<h1 class="cimek">Értékelések</h1>
  <div class="rewiews">
    <div class="hbox wrap" style="justify-content: center;">
      
      <div class="cards">
        <div class="vbox h-100">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div style="overflow: hidden; border-radius: 50%; background: black; width: 50px; height: 50px;">
              <img style="height: 100%; width: 100%; object-fit: cover;" src="white.png" alt="kep" />
            </div>
            <div class="name">
              <h5 style="color: black; margin: 0;">Name</h5>
            </div>
          </div>
        </div>
      </div>

      <div class="cards">
        <div class="vbox h-100">
          <p class="comment">Szöveg helye – itt megoszthat bővebb információkat az ajánlatról vagy szolgáltatásról.</p>
          <div class="hbox reviewer">
            <div style="overflow: hidden; border-radius: 50%; background: black; width: 50px; height: 50px;">
              <img style="height: 100%; width: 100%; object-fit: cover;" src="white.png" alt="kep" />
            </div>
            <div class="name">
              <h5 style="color: black; margin: 0;">Name</h5>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

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