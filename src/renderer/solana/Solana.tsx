import * as bs58 from 'bs58';
import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import * as cmv2 from './candy-machine';
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";
import { getCandyMachineMEState, mintOneMEToken, awaitTransactionSignatureConfirmation, mintMultipleMEToken } from './candy-machine-me';

const magicEdenApiUrl = 'https://api-mainnet.magiceden.io/';
export const phantasiaRpcUrl = 'https://long-bold-resonance.solana-mainnet.quiknode.pro/157aff47a7efe058928692467604f8d7e72658c8/';

export function VerifyPrivateKey(privateKey: any) {
    try {
        const privateKeyAsBuffer = bs58.decode(privateKey);
        const fromSecretKey = new Uint8Array(privateKeyAsBuffer);
        web3.Keypair.fromSecretKey(fromSecretKey);

        return true;
    } catch {
        return false;
    }
}

export async function WalletDetails(privateKey: any, rpcUrl: string, isDevelopment: boolean) {
    try {
        var connection = null;
        if (isDevelopment) {
            connection = new web3.Connection(
                phantasiaRpcUrl,
                'confirmed',
            );
        } else {
            connection = new web3.Connection(
                //rpcUrl ? rpcUrl : web3.clusterApiUrl("mainnet-beta"),
                rpcUrl ? rpcUrl : phantasiaRpcUrl,
                'confirmed',
            );
        }

        var fromKeypair = null;

        if (privateKey !== '') {
            const privateKeyAsBuffer = bs58.decode(privateKey);
            const fromSecretKey = new Uint8Array(privateKeyAsBuffer);

            fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        } else {
            fromKeypair = web3.Keypair.generate();
        }

        var balance = await connection.getBalance(fromKeypair.publicKey);
        balance = balance / web3.LAMPORTS_PER_SOL;
        return {
            address: fromKeypair.publicKey.toBase58(),
            private: privateKey ? privateKey : bs58.encode(Uint8Array.from(fromKeypair.secretKey)),
            balance
        };
    } catch (e) {
        return null;
    }
}

export async function CandyMachine(fromWallet: anchor.Wallet, candyMachineId: any, rpcUrl: string, isDevelopment: any) {
    try {
        console.log(rpcUrl, isDevelopment);
        var connection = null;
        if (isDevelopment) {
            connection = new web3.Connection(
                rpcUrl ? rpcUrl : phantasiaRpcUrl,
                'confirmed',
            );
        } else {
            connection = new web3.Connection(
                //rpcUrl ? rpcUrl : web3.clusterApiUrl("mainnet-beta"),
                rpcUrl ? rpcUrl : phantasiaRpcUrl,
                'confirmed',
            );
        }

        const candyMachine = await cmv2.getCandyMachineState(fromWallet, candyMachineId, connection);
        return candyMachine;
    } catch (e) {
        console.log(`CandyMachine`, e);
        return null;
    }
}

export async function MintToken(candyMachineId: any, rpcUrl: any, isDevelopment: any, privateKey: any, mintCount: any) {
    try {
        const privateKeyAsBuffer = bs58.decode(privateKey);
        const fromSecretKey = new Uint8Array(privateKeyAsBuffer);
        let fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const fromWallet = new anchor.Wallet(fromKeypair);

        const candyMachine: any = await CandyMachine(fromWallet, candyMachineId, rpcUrl, isDevelopment);
        if (candyMachine !== null) {
            if (candyMachine.state.isActive && !candyMachine.state.isSoldOut) {
                //const txn = await cmv2.mintOneToken(candyMachine, fromKeypair.publicKey, candyMachineId);
                console.log('cmid', candyMachineId)
                const txn = await cmv2.mintMultipleCM2Token(candyMachine, fromKeypair.publicKey, mintCount);
                console.log('txn', txn);
                let status: any = { err: true };
                const conn = new web3.Connection(
                    rpcUrl,
                    'confirmed',
                );
                if (txn[0]) {
                    status = await awaitTransactionSignatureConfirmation(
                        txn[0],
                        15000,
                        conn,
                        'singleGossip',
                        true,
                    );
                }
                console.log('status', status)
                if (txn && txn.length > 0) {
                    return {
                        state: true,
                        txn: txn,
                        msg: ``,
                        status: 1,
                        err: '',
                    }
                }
                else {
                    return {
                        state: false,
                        txn: null,
                        msg: 'Transaction failed. Please try again.',
                        status: 2,
                        err: 'Transaction simulation failed.',
                    }
                }
            } else {
                return {
                    state: false,
                    txn: null,
                    msg: !candyMachine.state.isSoldOut ? 'CandyMachine not active. Please select another.' : 'Sold out!',
                    status: !candyMachine.state.isSoldOut ? -1 : 0,
                    err: !candyMachine.state.isSoldOut ? 'CandyMachine not active. Please select another.' : 'Sold out!',
                }
            }
        }
        else {
            return {
                state: false,
                txn: null,
                msg: 'Not found collection. Please confirm collection ID.',
                status: -1,
                err: 'Not found collection.',
            }
        }
    } catch (e) {
        console.log(`MintToken -- error -- e: ${e}`);
        return {
            state: false,
            txn: null,
            msg: 'Mint failed, Please try again later.',
            status: 2,
            err: `MintToken -- error : ${e}`
        }
    }
}

export async function MintMEToken(candyMachineId: any, rpcUrl: any, privateKey: any, mintCount: any) {
    try {
        const privateKeyAsBuffer = bs58.decode(privateKey);
        const fromSecretKey = new Uint8Array(privateKeyAsBuffer);
        let fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const fromWallet = new anchor.Wallet(fromKeypair);
        let connection = new anchor.web3.Connection(rpcUrl);
        const candyMachine = await getCandyMachineMEState(fromWallet, new anchor.web3.PublicKey(candyMachineId), connection);
        console.log('Magiceden CandyMachine', candyMachine);
        if (candyMachine !== null || candyMachine != false) {
            if (!candyMachine?.state?.isSoldOut) {
                const candyMachineId = new web3.PublicKey(candyMachine.id);
                //const txn = await mintOneMEToken(candyMachine, candyMachine.state.config, fromKeypair.publicKey, candyMachine.state.treasury, 0);
                const txn = await mintMultipleMEToken(candyMachine, candyMachine.state.config, fromKeypair.publicKey, candyMachine.state.treasury, mintCount);
                const conn = new web3.Connection(
                    rpcUrl,
                    'confirmed',
                );
                let status: any = { err: true };
                if (txn[0]) {
                    status = await awaitTransactionSignatureConfirmation(
                        txn[0],
                        15000,
                        conn,
                        'singleGossip',
                        true,
                    );
                }
                console.log(`txn`, txn);
                console.log(`status`, status);
                if (!status?.err) {
                    console.log(`MintOneMEToken success`, txn);
                    return {
                        state: true,
                        txn: txn[0],
                        msg: `Congratulations! Mint succeeded!`,
                        status: 1,
                        err: ``
                    }
                }
                else {
                    console.log(`mintOneMEToken error`, txn);
                    return {
                        state: false,
                        txn: null,
                        msg: 'Transaction simulation error.',
                        status: 2,
                        err: `Transaction simulation error.`
                    }
                }
            } else {
                return {
                    state: false,
                    txn: null,
                    msg: `SOLD OUT!`,
                    status: 0,
                    err: `SOLD OUT!`
                }
            }
        }
        else {
            return {
                state: false,
                txn: null,
                msg: 'Not found collection. Please confirm collection ID.',
                status: -1,
                err: 'Not found collection.',
            }
        }
    } catch (error: any) {
        console.log(`MintMEToken error: ${error}`);
        console.log(error);
        return {
            state: false,
            txn: null,
            msg: 'Minting error, Please try again.',
            status: 2,
            err: `MintMEToken error: ${error}`
            // msg: `${error?.message ? error?.message : error}`
        }
    }
}

export async function MEDetails() {
    const agent = HttpsProxyAgent(`http://galbanese91_gmail_com:UYBYEpXgMW@65.215.107.172:3128`);

    const res = await fetch(`${magicEdenApiUrl}/launchpad_collections`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PostmanRunetime/7.29.0',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        },
        agent
    });
    if (res.status === 200) {
        const jsonRes = await res.json();
        return jsonRes;
    }

    return res;
}

export async function ME_AccountInfo() {
    const agent = HttpsProxyAgent(`http://galbanese91_gmail_com:UYBYEpXgMW@65.215.107.172:3128`);

    const body = JSON.stringify(
        {
            "response": "2EE2Hhoe8fVAYn7J5qwuayNmrEgmTPskLyszojv",
            "message": "HeAAwA6UY4e5strw4Eg5SgpDkEmuM4SXTBvwnf7yiUzuofj5sXboQ8e3kmw16v1xQYVF3h9WgHqcyz4HRHbEM7xJpdJMzjBRZdE9YutSqpnctbHC53opqSYnCdXW6vffKMTS93vXH1bNETbgbmzYFn6sUvkzQf86L8PvpUsr5f8VCGKc4sNrXpVDsGCQmvVt7QjsosPbmoXN9SDsnZcWTsZgVYDoQezoFz5wc5Rh2v8pvQK8WAnymfhqJWnki6qvggxfLkrjJ1g8zFsayuGUTnnbZJcokA9BRoxVXwFPcY52fwwz76Hic65gr5BCS7TigXKLqvTDXts8Aab8mzwDEgRukXvZebMCfMEFMjn2Hic7wCBdBMtuu6a5sJaFGvppvyQai2BQNmR93kQZHcJxqLgzy8Qcekf1137YQKMUz69ogbNKqPFmZ45BJmtssrA8vZtyGormM1KEwF6djz1quBkKPn7rZuuUDdpPVt9tgM1i8Ei7dL6XjtJxiKKVyRcrYWLuGfATkfw9erqWnXY71BiYDu6Hu6p77USkGERpyzPKGUuwQJvuzdaXjW1tT6s4FHQrbMyJ91X362x1ZNL4x3JTjWDJ6zuk7DXav7tCwfMc9EDNHWrV9GBf5AS31rgkN61CPyc4s5KRt9F6mqsooAwpL9Xh8hfc8FAyz5SsjtHE9Gh5oRxAhSUwyjFhyL5mSFn1KE6PYobbeyq3K3vmdQu8EAWBGThjWWaJ8DUMaicWgkdYHTgnNspJC6QtZGrfe3VhHg3wHcAo6TJSMsmwgJnpwWLxYpaWUuwMGN4D2SRoTCEATN2CU6GdReWL5svVFcQh7HvHR3yrHconKRi7FHHi5shrPSfRm7Ukd65tD5fc3tYe6rQmBWBuYDKziqS4y5fCCe8fNRdsMumsMbArvN3vp6qKdj7scQua1xioY2z4tqpo6R4bYwH4wf7cPooEeaqU7h49Ps2V1F9ohe35PA75FDWGELEQbsZaxFBMEyNYcr7eFkKvJpQm6wSrESVt9rAKfdcxHPDSvAFMADUDiRMRdZreZzZFqC7vMHH57bh9Cds6KFgJQJXcPp4rzBgS1WsVkezuFEF4dEui8S7HsfDzX4S8UuVx9Qew8tw73yFpasCaPG9WAXfHg"
        }
    );

    const res = await fetch(`https://wk-notary-prod.magiceden.io/sign`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PostmanRunetime/7.29.0',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        },
        agent,
        body
    });
    if (res.status === 200) {
        const jsonRes = await res.json();
        return jsonRes;
    }

    return res;
}