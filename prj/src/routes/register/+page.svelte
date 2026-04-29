<!--register-->
<script>
  import { goto } from "$app/navigation";

  let username = "";
  let email = "";
  let password = "";
  let message = "";

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      message = data.message || "Request failed.";

      if (response.ok) {
        goto("/");
      }
    } catch (error) {
      console.error("Error:", error);
      message = "Cannot reach the server. Make sure backend is running on http://localhost:3001.";
    }
  }

</script>

<div style="align-items: center; justify-content: center; display: flex; height: 100vh;">
    <div style="background: rgba(0, 0, 0, 0.5); min-width: 300px; min-height: 300px; align-items: center; justify-content: center; display: flex; flex-direction: column; padding: 20px; border-radius: 10px;">
      <h1>Register</h1>
      <form on:submit={handleSubmit} style="display: flex; flex-direction: column;">
        <input bind:value={username} type="text" placeholder="Username" style="border: none; padding: 10px; border-radius: 5px;" />
        <input bind:value={email} type="email" placeholder="Email" style="border: none; padding: 10px; border-radius: 5px; margin: 10px 0;" />
        <input bind:value={password} type="password" placeholder="Password" style="border: none; padding: 10px; border-radius: 5px;" />
        <button type="submit" style="background-color: rgb(79, 7, 107); color: white; border: none; padding: 10px; border-radius: 5px; margin: 10px 0;">Register</button>
        <p>{message}</p>
        <p>Van már fiókod? <a href="/login" id="reg">Bejelentkezés</a> itt.</p>
      </form>
    </div>
</div>