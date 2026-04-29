<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import CartDrawer from "$lib/components/CartDrawer.svelte";

	const API_BASE = "http://localhost:3001";

	let isOpen = false;
	let isProfileOpen = false;
	let isLoggedIn = false;
	let displayName = "Profil";
	let userPfp = "";
	let isAdmin = false;
	let canViewInventory = false;

	let loading = false;
	let message = "";
	let users = [];

	let newUsername = "";
	let newEmail = "";
	let newPassword = "";
	let newRole = "user";

	function isValidUserEmail(email) {
		return /^[^\s@]+@mail\.com$/i.test(email.trim());
	}

	onMount(async () => {
		hydrateAuthState();

		if (!isAdmin) {
			message = "Csak adminok kezelhetik a felhasználókat.";
			return;
		}

		await fetchUsers();
	});

	function hydrateAuthState() {
		const rawUser = localStorage.getItem("user");
		isLoggedIn = Boolean(rawUser);

		if (!rawUser) {
			displayName = "Profil";
			userPfp = "";
			isAdmin = false;
			canViewInventory = false;
			return;
		}

		try {
			const parsedUser = JSON.parse(rawUser);
			displayName = parsedUser?.username || "Profil";
			userPfp = parsedUser?.pfp || "";
			isAdmin = Boolean(parsedUser?.isadmin);
			canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
		} catch {
			displayName = "Profil";
			userPfp = "";
			isAdmin = false;
			canViewInventory = false;
		}
	}

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
			displayName = "Profil";
			userPfp = "";
			isAdmin = false;
			canViewInventory = false;
		}

		isProfileOpen = false;
		goto("/login");
	}

	async function fetchUsers() {
		loading = true;
		message = "";

		try {
			const response = await fetch(`${API_BASE}/api/users`);
			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				message = data.message || "A felhasználók betöltése sikertelen.";
				users = [];
				return;
			}

			users = data.users || [];
		} catch (error) {
			console.error("Error loading users:", error);
			message = "Nem érem el a backend szervert a http://localhost:3001 címen.";
			loading = false;
		}
	}

	function getRoleLabel(user) {
		if (user.isadmin) return "Admin";
		if (user.isemployee) return "Alkalmazott";
		return "Felhasználó";
	}

	function getAvatarUrl(user) {
		return user.pfp || "white.png";
	}

	function resolveRoleFlags(roleValue) {
		if (roleValue === "admin") return { isadmin: true, isemployee: true };
		if (roleValue === "employee") return { isadmin: false, isemployee: true };
		return { isadmin: false, isemployee: false };
	}

	async function handleCreateUser(event) {
		event.preventDefault();

		if (!isAdmin) {
			message = "Csak adminok hozhatnak létre felhasználókat.";
			return;
		}

		if (!isValidUserEmail(newEmail)) {
			message = "Az e-mailnek a következő formátumban kell lennie: név@mail.com.";
			return;
		}

		const roleFlags = resolveRoleFlags(newRole);

		try {
			const response = await fetch(`${API_BASE}/api/users`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: newUsername,
					email: newEmail,
					password: newPassword,
					isadmin: roleFlags.isadmin,
					isemployee: roleFlags.isemployee,
				}),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				message = data.message || "Nem sikerült létrehozni a felhasználót.";
				return;
			}

			newUsername = "";
			newEmail = "";
			newPassword = "";
			newRole = "user";
			message = "Felhasználó sikeresen létrehozva.";
			await fetchUsers();
		} catch (error) {
			console.error("Error creating user:", error);
			message = "A backend nem érhető el a http://localhost:3001 címen.";
		}
	}

	async function handleDeleteUser(userId) {
		if (!isAdmin) {
				message = "Csak adminok törölhetnek felhasználókat.";
				return;
			}

			const shouldDelete = confirm("Biztosan törlöd ezt a felhasználót véglegesen?");
		if (!shouldDelete) return;

		try {
			const response = await fetch(`${API_BASE}/api/users/${userId}`, {
				method: "DELETE",
			});
			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				message = data.message || "Nem sikerült törölni a felhasználót.";
				return;
			}

			message = "Felhasználó sikeresen törölve.";
			users = users.filter((user) => user.id !== userId);
		} catch (error) {
			console.error("Error deleting user:", error);
			message = "A backend nem érhető el a http://localhost:3001 címen.";
		}
	}
</script>

<nav class="navbar">
	<div class="nav-container">
		<a href="/" class="logo">MyApp</a>

		<button class="hamburger" on:click={toggle}>
			☰
		</button>

		<ul class="nav-links" class:open={isOpen}>
			<li><a href="/">Kezdőlap</a></li>
			<li><a href="/shop">Bolt</a></li>
			<li><a href="/pcbuild">PC építő</a></li>
			{#if isAdmin}
				<li><a href="/users"><b>Users</b></a></li>
			{/if}
			{#if canViewInventory}
				<li><a href="/inventory">Raktárkészlet</a></li>
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
							<a href="/profile">Fiókom</a>
							<a href="/orders">Rendeléseim</a>
							<hr />
						{/if}
						<button class={isLoggedIn ? "logout" : "login-action"} on:click={handleAuthAction}>
							{isLoggedIn ? "Kijelentkezés" : "Bejelentkezés"}
						</button>
					</div>
				{/if}
			</li>
		</ul>
	</div>
</nav>

<section class="users-page">
		<div class="users-header">
			<h1>Felhasználókezelés</h1>
			<p>Felhasználók létrehozása, áttekintése és törlése.</p>
		</div>

	{#if !isAdmin}
			<div class="users-alert">
				<p>{message || "Csak adminok érhetik el ezt az oldalt."}</p>
			</div>
	{:else}
		<div class="users-grid">
			<div class="users-panel">
				<h2>Felhasználó létrehozása</h2>
				<form class="users-form" on:submit={handleCreateUser}>
					<label for="newUsername">Felhasználónév</label>
					<input id="newUsername" bind:value={newUsername} type="text" required />

					<label for="newEmail">E-mail</label>
					<input
						id="newEmail"
						bind:value={newEmail}
						type="email"
						pattern="^[^\s@]+@mail\.com$"
						title="Használj @mail.com végződésű e-mail címet"
						required
					/>

					<label for="newPassword">Jelszó</label>
					<input id="newPassword" bind:value={newPassword} type="password" minlength="6" required />

					<label for="newRole">Szerep</label>
					<select id="newRole" bind:value={newRole}>
						<option value="user">Felhasználó</option>
						<option value="employee">Alkalmazott</option>
						<option value="admin">Admin</option>
					</select>

					<button type="submit">Felhasználó létrehozása</button>
				</form>
			</div>

			<div class="users-panel">
				<div class="users-list-header">
					<h2>Felhasználók</h2>
					<button type="button" class="secondary" on:click={fetchUsers}>Frissítés</button>
				</div>

					{#if loading}
						<p>Felhasználók betöltése...</p>
					{:else if users.length === 0}
						<p>Nincsenek felhasználók.</p>
				{:else}
					<div class="users-list">
						{#each users as user}
							<article class="user-card">
								<img src={getAvatarUrl(user)} alt={user.username} class="user-avatar" />

								<div class="user-main">
									<h3>{user.username}</h3>
									<p>{user.useremail}</p>
									<span class="role-chip">{getRoleLabel(user)}</span>
								</div>

								<button type="button" class="danger" on:click={() => handleDeleteUser(user.id)}>
									Delete
								</button>
							</article>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if message}
		<p class="users-message">{message}</p>
	{/if}
</section>
