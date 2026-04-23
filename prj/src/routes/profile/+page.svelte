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
    <ul class="nav-links" class:open={isOpen}>
      <li><a href="/">Home</a></li>
      <li><a href="/shop">Store</a></li>
      <li><a href="/pcbuild">Pc builder</a></li>

      <!-- stay on the right-->
      <li><a href="/"><b>Profile</b></a></li> <!-- TODO profile dropwdown menu-->
      <li><a href="/login">Login</a></li>
    </ul>
  </div>
</nav>

<h1 class="inv_h" style="text-align: center;">Profilod</h1>
<div class="profile">
    <div class="hbox">
        <div class="pdata"><!--TODO formot allitva rendezni-->
            <form action="">
                <img src="white.png" alt="placeholder"><!-- TODO GET pfp -->
                <label for="item">Profilkep változtatás:</label>
                <input class="item_name_input" type="file" id="item" name="item" required>


                <label for="item"><!--GET Name from table--></label>

                <label for="email">E-mail:</label> <!--TODO Hidden-->
                <!--option for changing email-->


                <label for="address">Szállítási cím:</label>

                <!--option to change address-->
                






                <button type="submit">Hozzáadás</button>
            </form>
        </div>
    </div>
    <div class="hbox" style="color:black;">
        <table class="table">
            <thead>
                <tr>
                    <th>Termék neve:</th>
                </tr>
                <tr>
                    <th>Termék típusa:</th>
                </tr>
                <tr>
                    <th>Mukodokepes?</th>
                </tr>
            </thead>
            <tbody>
                <!-- Table rows will be populated dynamically -->
            </tbody>
        </table>
    </div>
</div>    