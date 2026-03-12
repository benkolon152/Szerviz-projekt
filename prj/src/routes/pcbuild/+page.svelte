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
      <li><a href="/pcbuild"><b>Pc builder</b></a></li>

      <!-- stay on the right-->
      <li><a href="/">Profile</a></li> <!-- TODO profile dropwdown menu-->
      <li><a href="/login">Login</a></li>
    </ul>
  </div>
</nav>

<div class="pc_build_container">
    <div class="vbox">
        <div class="hbox cards-container">
            <form action="">
                <label for="case">Gépház:</label>
                <label for="cpu">Processzor:</label>
                <label for="motherboard">Alaplap:</label>
                <label for="gpu">Videokartya:</label>
                <label for="ram">RAM:</label>
                <label for="psu">Tápegység:</label>
                <label for="storage">Háttertar:</label>
                <label for="storage_two">Masodlagos háttértár:</label><!--TODO ez alapbol hidden csak ha mar az elsodleges tarolo ki lett valasztva akkor jelenjen meg-->
                <label for="cooling">Hűtés(Opcionális):</label><!--TODO ez pedig eleve opcionalis-->

                <p><b>Választható extrák</b></p>
                <!--TODO Ezek alapból kiszurkitve egy tickbox-al lesznek aktivak-->
                <label for="os">Operációs rendszer:</label>
                <label for="keyboard">Billentyűzet:</label>
                <label for="mouse">Egér:</label>
            </form>
        </div>

        <div class="hbox cards-container">
           <form action="">
                <label for="build">Kérek összeszerelest</label><!--TODO tickbox--> 
                <label for="bios">Kérek bios frissitest</label>
           
            

           </form> 
        </div>

    </div>
</div>