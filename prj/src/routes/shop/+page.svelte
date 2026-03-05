<script>
  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="logo">MyApp</a> <!-- TODO logo-->

    <button class="hamburger" on:click={toggle}>
      ☰
    </button>
    <!--TODO this should be on the left side-->
    <ul class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop"><b>Store</b></a></li>
      <li><a href="/pcbuild">Pc builder</a></li>

      <!-- stay on the right-->
      <li><a href="/">Profile</a></li> <!-- TODO profile dropwdown menu-->
      <li><a href="/login">Login</a></li>
    </ul>
  </div>
</nav>

<div class="shop" style="text-align: center;">
    <div class="vbox" style="overflow-y: auto;">
        <div><h2><b style="color: black; margin-bottom: 35px;">Kiemelt Termékeink</b></h2>
            <button class="hamburger_sort" on:click={toggle}> ☰</button>
        
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