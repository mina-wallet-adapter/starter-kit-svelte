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
	await Add.compile();
	compiled = true;
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
	maxAttempts = 45,
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
