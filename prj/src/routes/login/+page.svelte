<!--login-->
<script>
  import { goto } from "$app/navigation";

  let identifier = "";
  let password = "";
  let message = "";

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json().catch(() => ({}));
      message = data.message || "Request failed.";

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Check user role and redirect accordingly
        if (data.user?.isadmin) {
          goto("/users");
        } else if (data.user?.isemployee) {
          goto("/inventory");
        } else {
          goto("/");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      message = "Cannot reach the server. Make sure backend is running on http://localhost:3001.";
    }
  }
</script>

<div style="align-items: center; justify-content: center; display: flex; height: 100vh;">
    <div style="background: rgba(0, 0, 0, 0.5); min-width: 300px; min-height: 300px; align-items: center; justify-content: center; display: flex; flex-direction: column; padding: 20px; border-radius: 10px;">
      <h1>Bejelentkezés</h1>
      <form on:submit={handleSubmit} style="display: flex; flex-direction: column;">
        <input bind:value={identifier} type="text" placeholder="E-mail vagy felhasználónév" style="border: none; padding: 10px; border-radius: 5px;" />
        <input bind:value={password} type="password" placeholder="Jelszó" style="border: none; padding: 10px; border-radius: 5px; margin: 10px 0;" />
        <button type="submit" style="background-color: rgb(79, 7, 107); color: white; border: none; padding: 10px; border-radius: 5px;">Bejelentkezés</button>
        <p>{message}</p>
        <p>Nincs fiókod? <a href="/register" id="reg">Regisztrálj</a> itt.</p>
      </form>
    </div>
</div>