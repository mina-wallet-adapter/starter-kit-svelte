import { Mina, PublicKey, fetchAccount, checkZkappTransaction } from 'o1js';
import { Add } from '../../../contracts/build/src/Add.js';

const BERKELEY_ENDPOINT: string = 'https://api.minascan.io/node/berkeley/v1/graphql';
const ZKAPP_CONTRACT_ADDRESS: string = 'B62qkr2pLU4KeNEhc6m3KYDcMFMCbryVoZvXTAnjUkqpbnbWVtz3qxr';

let zkApp: Add;
let zkAppAddress: PublicKey;
let compiled = false;

export function initContract() {
	if (zkApp) return;
	const berkeley = Mina.Network(BERKELEY_ENDPOINT);
	Mina.setActiveInstance(berkeley);
	zkAppAddress = PublicKey.fromBase58(ZKAPP_CONTRACT_ADDRESS);
	zkApp = new Add(zkAppAddress);
}

export async function getOnChainValue() {
	await fetchAccount({ publicKey: zkAppAddress });
	const num = Number(zkApp.num.get().toBigInt());
	return num;
}

export async function compileContract() {
	if (compiled) return;
	const cache = await fetchCache();
	await Add.compile({ cache: handleCache(cache) });
	compiled = true;
}

async function fetchCache() {
	const { files } = await fetch('/cache/list.json').then((res) => res.json());

	return Promise.all(
		files.map(async (file: string) => {
			const [header, data] = await Promise.all([
				fetch(`/cache/${file}.header`).then((res) => res.text()),
				fetch(`/cache/${file}`).then((res) => res.text())
			]);
			return { file, header, data };
		})
	).then((cacheList) =>
		cacheList.reduce((acc: any, cur) => {
			acc[cur.file] = cur;
			return acc;
		}, {})
	);
}

function handleCache(files: any) {
	return {
		read({ persistentId, uniqueId, dataType }: any) {
			if (!files[persistentId]) return undefined;

			if (files[persistentId].header !== uniqueId) return undefined;

			if (dataType === 'string' || dataType === 'bytes')
				return new TextEncoder().encode(files[persistentId].data);

			return undefined;
		},
		write({ persistentId, uniqueId, dataType }: never, _data: never) {},
		canWrite: true
	};
}

export async function createTransaction(publicKey: string) {
	const sender = PublicKey.fromBase58(publicKey);
	const txn = await Mina.transaction(sender, () => {
		zkApp.update();
	});

	await txn.prove();
	return txn;
}

export async function waitTransaction(
	txId: string,
	maxAttempts = 100,
	interval = 20000
): Promise<void | Error> {
	let attempts = 0;

	const executePoll = async (resolve: () => void, reject: (err: Error) => void | Error) => {
		let res;
		try {
			res = await checkZkappTransaction(txId);
		} catch (error) {
			return reject(error as Error);
		}
		attempts++;
		if (res.success) {
			return resolve();
		} else if (res.failureReason) {
			return reject(
				new Error(
					`Transaction failed.\nTransactionId: ${txId}\nAttempts: ${attempts}\nfailureReason(s): ${res.failureReason}`
				)
			);
		} else if (maxAttempts && attempts === maxAttempts) {
			return reject(
				new Error(
					`Exceeded max attempts.\nTransactionId: ${txId}\nAttempts: ${attempts}\nLast received status: ${res}`
				)
			);
		} else {
			setTimeout(executePoll, interval, resolve, reject);
		}
	};

	return new Promise(executePoll);
}
