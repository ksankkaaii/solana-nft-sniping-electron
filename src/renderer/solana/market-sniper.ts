import * as anchor from "@project-serum/anchor";
import nacl from "tweetnacl";

import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  MAGICEDEN_API,
  CORS_BUY_PROXY,
  SNIPING_RANGE,
  INSTRUCTION_SIGN_LENGHT,
  HADES_SERVER,
} from "./../components/helper/Constants";

import {
  awaitTransactionSignatureConfirmation,
  simulateTransaction,
  sleep,
} from "./connection";

import axios from "axios";
import fetchDataWithAxios from "../components/helper/fetchDataWithAxios";
import { text } from "node:stream/consumers";

const {
  SystemProgram,
  Transaction,
  PublicKey,
  Connection,
} = anchor.web3;

const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

export const quickMultiBuy = async (
  items: any,
  walletAddr: any,
  provider: any,
  count: any
) => {
  let bought = 0;
  try {
    let txsMatrix: anchor.web3.Transaction[] = [];
    console.log(`items`, items)
    for (let i = 0; i < items.length; i++) {
      if (i >= count) {
        break;
      }
      const uri = `https://api-mainnet.magiceden.dev/v2/instructions/buy_now?buyer=${walletAddr.toString()}&seller=${items[i].seller}&auctionHouseAddress=${items[i].auctionHouse}&tokenMint=${items[i].tokenMint}&tokenATA=${items[i].tokenAddress}&price=${items[i].price}&buyerReferral=&sellerReferral=${items[i].sellerReferral}&buyerExpiry=&sellerExpiry=${items[i].expiry}`;

      const decodedTx: any = await fetchDataWithAxios({
        method: `post`,
        route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.GET_MAGIC_DATA}`,
        data: {
          uri: `${uri}`
        }
      });
      console.log(`decodedTx`, decodedTx);
      let tx = anchor.web3.Transaction.from(
        Buffer.from(decodedTx.txSigned.data)
      );
      // provider.wallet.signTransaction(tx);
      // await anchor.web3.sendAndConfirmRawTransaction(provider.connection, tx.serialize());
      console.log(`tx`, tx);
      txsMatrix.push(tx);
    }

    const signedTxns = await provider.wallet.signAllTransactions(txsMatrix);
    for (let i = 0; i < signedTxns.length; i++) {
      const sendTx = signedTxns[i].serialize();
      const startTime = getUnixTs();
      const txid: any = await provider.connection.sendRawTransaction(sendTx, {
        skipPreflight: true,
      });
      console.log(`txid`, txid);
      let done = false;
      let slot = 0;
      (async () => {
        while (!done && getUnixTs() - startTime < SNIPING_RANGE) {
          provider.connection.sendRawTransaction(sendTx, {
            skipPreflight: true,
          });
          await sleep(500);
        }
      })();

      try {
        const confirmation = await awaitTransactionSignatureConfirmation(
          txid,
          15000,
          provider.connection,
          "recent",
          true
        );
        console.log(`confirmation`, confirmation);
        if (!confirmation) {
          console.error(
            "Transaction failed. Timed out awaiting confirmation on transaction"
          );
        } else {
          if (confirmation?.err) {
            console.error("Transaction failed. Custom instruction error");
          } else {
            console.log(
              `Sniped: ${items[i].tokenMint}`,
            );
            bought++;
          }
        }
        slot = confirmation?.slot || 0;
      } catch (err: any) {
        console.error("Timeout Error caughted.", err);
        if (err.timeout) {
          console.error(
            "Transaction failed. Timed out awaiting confirmation on transaction"
          );
        }

        let simulateResult: anchor.web3.SimulatedTransactionResponse | null = null;
        try {
          simulateResult = (
            await simulateTransaction(provider.connection, sendTx, "single")
          ).value;
        } catch (e) { }

        if (simulateResult && simulateResult.err) {
          if (simulateResult.logs) {
            for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
              const line = simulateResult.logs[i];
              if (line.startsWith("Program log: ")) {
                console.error(
                  "Transaction failed: " + line.slice("Program log: ".length)
                );
              }
            }
          }
          console.error(JSON.stringify(simulateResult.err));
        }
      } finally {
        done = true;
      }
    }
  }

  catch (err) {
    console.error(`${err}`);
  } finally {
    return bought;
  }
};

export async function signAndSendTransaction(connection: anchor.web3.Connection, wallet: any, transaction: anchor.web3.Transaction, commitment: anchor.web3.Commitment = 'singleGossip') {
  // transaction.addSignature(wallet.publicKey, transaction.signature);
  try {
    let signedTx = await wallet.signTransaction(transaction);

    console.log('signedTx', signedTx);
    let options = {
      skipPreflight: true,
      commitment,
    };
    const rawTransaction = signedTx.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, options);
    const timeout = 15000;

    console.log('Started awaiting confirmation for', txid);
    const startTime = getUnixTs();
    let slot = 0;
    let done = false;
    (async () => {
      while (!done && getUnixTs() - startTime < timeout) {
        connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        });
        await sleep(500);
      }
    })();
    try {
      const confirmation = await awaitTransactionSignatureConfirmation(
        txid,
        timeout,
        connection,
        'recent',
        true,
      );

      if (!confirmation)
        throw new Error('Timed out awaiting confirmation on transaction');

      if (confirmation.err) {
        console.error(confirmation.err);
        throw new Error('Transaction failed: Custom instruction error');
      }

      slot = confirmation?.slot || 0;
    } catch (err: any) {
      console.error('Timeout Error caught', err);
      if (err.timeout) {
        throw new Error('Timed out awaiting confirmation on transaction');
      }
      let simulateResult: anchor.web3.SimulatedTransactionResponse | null = null;
      try {
        simulateResult = (
          await simulateTransaction(connection, signedTx, 'single')
        ).value;
      } catch (e) { }
      if (simulateResult && simulateResult.err) {
        if (simulateResult.logs) {
          for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
            const line = simulateResult.logs[i];
            if (line.startsWith('Program log: ')) {
              throw new Error(
                'Transaction failed: ' + line.slice('Program log: '.length),
              );
            }
          }
        }
        throw new Error(JSON.stringify(simulateResult.err));
      }
      // throw new Error('Transaction failed');
    } finally {
      done = true;
    }

    console.log('Latency', txid, getUnixTs() - startTime);
    return { txid, slot };
  }
  catch (error) {
    console.log('tx error', error);
    return { txid: null, slot: 0 };
  }

}
