<script lang="ts">
	import { WalletProvider, WalletMultiButton, walletStore } from '@mina-wallet-adapter/ui-svelte';
	import '@mina-wallet-adapter/ui-svelte/dist/wallet-adapter.css';
	import '$lib/global.css';
	import '$lib/page.css';

	let value: number = 0;

	async function submit() {}
</script>

<main>
	<header>
		<p class="callout">Get started by editing <b>ui/src/routes/+page.svelte</b></p>
		<div>
			<WalletProvider autoConnect={true} />
			<WalletMultiButton />
		</div>
	</header>

	<section>
		<h1>zkApp Starter-Kit with <i>Svelte</i></h1>
		<p>
			This is a project template built with
			<a
				href="https://github.com/mina-wallet-adapter/wallet-adapter"
				target="_blank"
				rel="noreferrer"
			>
				<b>mina-wallet-adapter</b></a
			>,
			<b>o1js</b>,
			<b>Svelte</b> and
			<b>SvelteKit</b> for creating zkApps.
		</p>

		<div class="callout">
			{#if $walletStore?.connected}
				<p>On-chain state: <strong>{value}</strong></p>
				<p>Click below button to add 2 to the on-chain state.</p>
				<button class="wallet-adapter-button wallet-adapter-button-trigger" on:click={submit}>
					Add 2
				</button>
			{:else}
				<p class="warning">No wallet connected</p>
				<p>Click on the <b>Connect Wallet</b> button above to connect.</p>
			{/if}
		</div>
	</section>

	<footer class="callout">
		<h2>Next steps ...</h2>
		<p>
			- Learn more about Mina Wallet Adapter features, components and hooks from the
			<a
				href="https://mina-wallet-adapter.github.io/wallet-adapter/"
				target="_blank"
				rel="noreferrer"
			>
				docs</a
			>.
		</p>
		<p>
			- Explore this
			<a
				href="https://github.com/mina-wallet-adapter/starter-kit-svelte"
				target="_blank"
				rel="noreferrer"
			>
				starter template
			</a> code on GitHub.
		</p>
	</footer>
</main>
