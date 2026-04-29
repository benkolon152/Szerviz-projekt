<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import CartDrawer from "$lib/components/CartDrawer.svelte";

	const API_BASE = "http://localhost:3001";

	let isOpen = false;
	let isProfileOpen = false;
	let isLoggedIn = false;
	let displayName = "Profile";
	let userPfp = "";
	let isAdmin = false;
	let canViewInventory = false;
	let userId = null;

	let customerName = "";
	let customerEmail = "";
	let phoneNumber = "";
	let repairDevice = "";
	let repairIssue = "";

	let submitMessage = "";
	let submitMessageIsError = false;
	let submitting = false;

	onMount(() => {
		const rawUser = localStorage.getItem("user");
		isLoggedIn = Boolean(rawUser);

		if (rawUser) {
			try {
				const parsedUser = JSON.parse(rawUser);
				displayName = parsedUser?.username || "Profile";
				userPfp = parsedUser?.pfp || "";
				userId = parsedUser?.id ?? null;
				isAdmin = Boolean(parsedUser?.isadmin);
				canViewInventory = isAdmin || Boolean(parsedUser?.isemployee);
				customerName = parsedUser?.username || "";
				customerEmail = parsedUser?.email || "";
			} catch {
				displayName = "Profile";
				userPfp = "";
				userId = null;
				isAdmin = false;
				canViewInventory = false;
			}
		}
	});

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
			userPfp = "";
			userId = null;
			isAdmin = false;
			canViewInventory = false;
		}

		isProfileOpen = false;
		goto("/login");
	}

	async function handleSubmit(event) {
		event.preventDefault();

		if (!isLoggedIn || !userId) {
			submitMessage = "A szerviz kérés mentéséhez jelentkezz be.";
			submitMessageIsError = true;
			return;
		}

		if (!customerName.trim() || !customerEmail.trim() || !repairDevice.trim() || !repairIssue.trim()) {
			submitMessage = "Töltsd ki a nevet, e-mailt, eszközt és a hiba leírását.";
			submitMessageIsError = true;
			return;
		}

		submitting = true;
		submitMessage = "";

		try {
			const response = await fetch(`${API_BASE}/api/orders`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					user_id: userId,
					order_type: "repair_request",
					status: "needs_repair",
					customer_name: customerName.trim(),
					customer_email: customerEmail.trim().toLowerCase(),
					shipping_address: "",
					phone_number: phoneNumber.trim(),
					repair_device: repairDevice.trim(),
					repair_issue: repairIssue.trim(),
					items: [],
				}),
			});

			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				submitMessage = data.message || "Nem sikerült elmenteni a szerviz kérését.";
				submitMessageIsError = true;
				return;
			}

			goto("/orders");
		} catch (error) {
			console.error("Error submitting repair request:", error);
			submitMessage = "A backend nem érhető el.";
			submitMessageIsError = true;
		} finally {
			submitting = false;
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
				<li><a href="/users">Users</a></li>
			{/if}
			{#if canViewInventory}
				<li><a href="/inventory">Inventory</a></li>
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
							<a href="/profile">My Account</a>
							<a href="/orders">Orders</a>
							<hr />
						{/if}
						<button class={isLoggedIn ? "logout" : "login-action"} on:click={handleAuthAction}>
							{isLoggedIn ? "Logout" : "Login"}
						</button>
					</div>
				{/if}
			</li>
		</ul>
	</div>
</nav>

<section class="repair-page">
	<div class="repair-hero">
		<p class="eyebrow">Szerviz és javítás</p>
		<h1>Adj le javítási kérést</h1>
		<p>Írd le, milyen gépről van szó és mi a probléma. Ez a kérés a rendeléseid között jelenik meg.</p>
	</div>

	<div class="repair-grid">
		<form class="repair-form" on:submit={handleSubmit}>
			<label>
				Név
				<input type="text" bind:value={customerName} placeholder="Teljes név" required />
			</label>

			<label>
				E-mail
				<input type="email" bind:value={customerEmail} placeholder="email@example.com" required />
			</label>

			<label>
				Telefonszám
				<input type="tel" bind:value={phoneNumber} placeholder="+36 ..." />
			</label>

			<label>
				Javítandó eszköz
				<input type="text" bind:value={repairDevice} placeholder="Pl. MSI laptop, gamer PC" required />
			</label>

			<label>
				Hiba leírása
				<textarea bind:value={repairIssue} rows="7" placeholder="Mi a probléma, mióta áll fenn, milyen hibajelenség van?" required></textarea>
			</label>

			<button class="submit-button" type="submit" disabled={submitting}>
				{submitting ? "Küldés..." : "Szerviz kérés elküldése"}
			</button>

			{#if submitMessage}
				<p class:success-message={!submitMessageIsError} class:error-message={submitMessageIsError}>
					{submitMessage}
				</p>
			{/if}
		</form>

		<aside class="repair-note">
			<h2>Mit kapsz</h2>
			<ul>
				<li>Rögzített szerviz kérés a rendelési listában</li>
				<li>Nyomon követhető a profilod Orders menüpontjából</li>
			</ul>
		</aside>
	</div>
</section>

<style>
	.repair-page {
		width: min(1180px, 94%);
		margin: 42px auto 72px;
		color: #14204f;
	}

	.repair-hero {
		margin-bottom: 20px;
	}

	.repair-hero h1 {
		margin: 0 0 10px;
		color: #fff;
		font-size: clamp(2rem, 4vw, 3rem);
	}

	.repair-hero p {
		margin: 0;
		color: rgba(255, 255, 255, 0.84);
		max-width: 760px;
	}

	.eyebrow {
		margin: 0 0 8px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.68);
	}

	.repair-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
		gap: 18px;
		align-items: start;
	}

	.repair-form,
	.repair-note {
		background: rgba(255, 255, 255, 0.96);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 18px;
		box-shadow: 0 22px 40px rgba(10, 16, 46, 0.14);
		padding: 20px;
	}

	.repair-form {
		display: grid;
		gap: 14px;
	}

	.repair-form label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		color: #20306a;
	}

	.repair-form input,
	.repair-form textarea {
		border-radius: 12px;
		border: 1px solid #d6dcee;
		background: white;
		padding: 12px 14px;
		font: inherit;
	}

	.submit-button {
		border: none;
		border-radius: 999px;
		padding: 13px 20px;
		background: linear-gradient(135deg, #1b5cff, #4d79ff);
		color: white;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.submit-button:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.repair-note h2 {
		margin: 0 0 10px;
		color: #121a43;
	}

	.repair-note ul {
		margin: 0;
		padding-left: 18px;
		display: grid;
		gap: 10px;
		color: #5d668d;
	}

	.success-message,
	.error-message {
		margin: 0;
		padding: 10px 12px;
		border-radius: 12px;
		font-weight: 600;
	}

	.success-message {
		background: #e7f6e7;
		color: #1f5f1f;
	}

	.error-message {
		background: #fdeaea;
		color: #8b2f2f;
	}

	@media (max-width: 900px) {
		.repair-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 700px) {
		.repair-page {
			width: min(100%, 95%);
			margin-top: 20px;
		}
	}
</style>