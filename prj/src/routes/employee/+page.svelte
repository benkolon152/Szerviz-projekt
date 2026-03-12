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
      <li><a href="/"><b>Home</b></a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>
      <li><a href="/inventory">Inventory</a></li>

      <!-- stay on the right-->
      <li><a href="/">Profile</a></li> <!-- TODO profile dropwdown menu-->
      <li><a href="/login">Login</a></li>
    </ul>
  </div>
</nav>