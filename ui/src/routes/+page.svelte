<script lang="ts">
	import { MINA_BERKELEY_CHAIN } from 'mina-wallet-standard';
	import { WalletProvider, WalletMultiButton, walletStore } from '@mina-wallet-adapter/ui-svelte';
	import '@mina-wallet-adapter/ui-svelte/dist/wallet-adapter.css';
	import '$lib/global.css';
	import '$lib/page.css';

	let zk: any;
	let value: number = 0;
	let txnId: string | undefined;
	let statusMsg = '';

	async function initZkApp() {
		if (zk) return;
		zk = await import('$lib/zkapp');
		await zk.initContract();
	}

	async function getValue() {
		await initZkApp();
		value = await zk!.getOnChainValue();
		return value;
	}

	async function submit(e: { currentTarget: any }) {
		const button = e.currentTarget;

		try {
			txnId = '';
			button.disabled = true;
			button.style.cursor = 'wait';
			document.body.style.cursor = 'wait';

			statusMsg = 'Compiling zkApp contract ... (This might take several minutes)';
			await zk!.compileContract();

			statusMsg = 'Creating transaction ... (This might take several minutes)';
			const txn = await zk!.createTransaction($walletStore.publicKey!);

			statusMsg = 'Signing transaction ...';
			txnId = await $walletStore.signAndSendTransaction(txn.toJSON());

			statusMsg =
				'Waiting for transaction to be included in a block ... (This might take several minutes)';
			await zk!.waitTransaction(txnId!);

			await getValue();
		} catch (error: any) {
			console.log('Error:', error.message);
			alert('Error: ' + error.message);
		} finally {
			statusMsg = '';
			document.body.style.cursor = '';
			button.style.cursor = '';
			button.disabled = false;
		}
	}
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
			This is a project template for creating zkApps built with
			<a
				href="https://github.com/mina-wallet-adapter/wallet-adapter"
				target="_blank"
				rel="noreferrer"
			>
				<b>mina-wallet-adapter</b></a
			>,
			<b>o1js</b>,
			<b>Svelte</b> and
			<b>SvelteKit</b>.
		</p>

		<div class="callout">
			{#if $walletStore?.connected}
				{#if $walletStore?.chain === MINA_BERKELEY_CHAIN}
					{#await getValue()}
						<p>loading ...</p>
					{:then}
						<p>
							<span class="mr-2">Chain: <strong>{$walletStore?.chain}</strong></span>
							<span>On-chain state: <strong>{value}</strong></span>
						</p>
						<p>Click below button to add 2 to the on-chain state.</p>
						<button class="wallet-adapter-button wallet-adapter-button-trigger" on:click={submit}>
							Add 2
						</button>
						{#if txnId}
							<p>Transaction ID: {txnId}</p>
						{/if}
						{#if statusMsg}
							<p class="warning">{statusMsg}</p>
						{/if}
					{:catch error}
						<p class="warning">Failed to fetch on-chain state. {error.message}</p>
					{/await}
				{:else}
					<p class="warning">You are connected to {$walletStore?.chain}</p>
					<p>Switch to Berkeley chain on {$walletStore.name} wallet.</p>
				{/if}
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
