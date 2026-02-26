<script>
  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
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
    <ul class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>

      <!-- stay on the right-->
      <li><a href="/">Profile</a></li> <!-- TODO profile dropwdown menu-->
    </ul>
  </div>
</nav>

<!-- ---------------------------------HOME-------------------------------- -->
<div class="home">


    <h1 class="cimek">Kiemelt</h1>

    <div class="card">
    <img src="white.png" alt="Avatar" style="width:100%">
    <div class="container">
        <h4><b>John Doe</b></h4>
        <p>Architect & Engineer</p>
    </div>
    </div>
</div>

