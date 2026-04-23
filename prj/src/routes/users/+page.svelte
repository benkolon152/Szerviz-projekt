<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	const API_BASE = "http://localhost:3001";

	let isOpen = false;
	let isProfileOpen = false;
	let isLoggedIn = false;
	let displayName = "Profile";
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
			message = "Only admins can manage users.";
			return;
		}

		await fetchUsers();
	});

	function hydrateAuthState() {
		const rawUser = localStorage.getItem("user");
		isLoggedIn = Boolean(rawUser);

		if (!rawUser) {
			displayName = "Profile";
			isAdmin = false;
			canViewInventory = false;
			return;
		}

		try {
			const parsedUser = JSON.parse(rawUser);
			displayName = parsedUser?.username || "Profile";
			isAdmin = Boolean(parsedUser?.isadmin);
			canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
		} catch {
			displayName = "Profile";
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
			displayName = "Profile";
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
				message = data.message || "Failed to load users.";
				users = [];
				return;
			}

			users = data.users || [];
		} catch (error) {
			console.error("Error loading users:", error);
			message = "Cannot reach backend server on http://localhost:3001.";
			users = [];
		} finally {
			loading = false;
		}
	}

	function getRoleLabel(user) {
		if (user.isadmin) return "Admin";
		if (user.isemployee) return "Employee";
		return "User";
	}

	function getAvatarUrl(user) {
		return user.avatarUrl || user.avatarurl || "white.png";
	}

	function resolveRoleFlags(roleValue) {
		if (roleValue === "admin") return { isadmin: true, isemployee: true };
		if (roleValue === "employee") return { isadmin: false, isemployee: true };
		return { isadmin: false, isemployee: false };
	}

	async function handleCreateUser(event) {
		event.preventDefault();

		if (!isAdmin) {
			message = "Only admins can create users.";
			return;
		}

		if (!isValidUserEmail(newEmail)) {
			message = "Email must be in the format name@mail.com.";
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
				message = data.message || "Failed to create user.";
				return;
			}

			newUsername = "";
			newEmail = "";
			newPassword = "";
			newRole = "user";
			message = "User created successfully.";
			await fetchUsers();
		} catch (error) {
			console.error("Error creating user:", error);
			message = "Cannot reach backend server on http://localhost:3001.";
		}
	}

	async function handleDeleteUser(userId) {
		if (!isAdmin) {
			message = "Only admins can delete users.";
			return;
		}

		const shouldDelete = confirm("Delete this user permanently?");
		if (!shouldDelete) return;

		try {
			const response = await fetch(`${API_BASE}/api/users/${userId}`, {
				method: "DELETE",
			});
			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				message = data.message || "Failed to delete user.";
				return;
			}

			message = "User deleted successfully.";
			users = users.filter((user) => user.id !== userId);
		} catch (error) {
			console.error("Error deleting user:", error);
			message = "Cannot reach backend server on http://localhost:3001.";
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
			<li><a href="/">Home</a></li>
			<li><a href="/shop">Store</a></li>
			<li><a href="/pcbuild">Pc builder</a></li>
			{#if isAdmin}
				<li><a href="/users"><b>Users</b></a></li>
			{/if}
			{#if canViewInventory}
				<li><a href="/inventory">Inventory</a></li>
			{/if}

			<li class="profile-dropdown">
				<button class="dropdown-trigger" on:click={toggleProfile}>
					{displayName} ▾
				</button>

				{#if isProfileOpen}
					<div class="dropdown-menu">
						<a href="/profile">My Account</a>
						<a href="/orders">Orders</a>
						<hr />
						<button class={isLoggedIn ? "logout" : "login-action"} on:click={handleAuthAction}>
							{isLoggedIn ? "Logout" : "Login"}
						</button>
					</div>
				{/if}
			</li>
		</ul>
	</div>
</nav>

<section class="users-page">
	<div class="users-header">
		<h1>User Management</h1>
		<p>Create, review and delete platform users.</p>
	</div>

	{#if !isAdmin}
		<div class="users-alert">
			<p>{message || "Only admins can open this page."}</p>
		</div>
	{:else}
		<div class="users-grid">
			<div class="users-panel">
				<h2>Add User</h2>
				<form class="users-form" on:submit={handleCreateUser}>
					<label for="newUsername">Username</label>
					<input id="newUsername" bind:value={newUsername} type="text" required />

					<label for="newEmail">Email</label>
					<input
						id="newEmail"
						bind:value={newEmail}
						type="email"
						pattern="^[^\s@]+@mail\.com$"
						title="Use an email address ending in @mail.com"
						required
					/>

					<label for="newPassword">Password</label>
					<input id="newPassword" bind:value={newPassword} type="password" minlength="6" required />

					<label for="newRole">Role</label>
					<select id="newRole" bind:value={newRole}>
						<option value="user">User</option>
						<option value="employee">Employee</option>
						<option value="admin">Admin</option>
					</select>

					<button type="submit">Create user</button>
				</form>
			</div>

			<div class="users-panel">
				<div class="users-list-header">
					<h2>Users</h2>
					<button type="button" class="secondary" on:click={fetchUsers}>Refresh</button>
				</div>

				{#if loading}
					<p>Loading users...</p>
				{:else if users.length === 0}
					<p>No users found.</p>
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
