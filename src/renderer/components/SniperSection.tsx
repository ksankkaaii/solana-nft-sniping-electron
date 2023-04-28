import React, { useState, useEffect, useRef } from 'react';

import axios from "axios";

import * as fs from 'fs';

import Discord from 'discord.js';
import moment from 'moment';

import * as anchor from "@project-serum/anchor";
import * as bs58 from "bs58";

import path from 'path';

import { Alert, AppBar, Divider, DialogActions, DialogContent, FormHelperText, Grid, IconButton, Paper, Snackbar, Toolbar, Tooltip, Typography, MenuItem, Backdrop, CircularProgress } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddBoxIcon from '@mui/icons-material/AddBox';

import { CircularBorderDiv, CustomButton, CustomInputLabel, CustomTextField, CustomSelect } from './helper/CustomHtml';

import { createWebhookMessage } from './helper/Discord';

import { quickMultiBuy } from "./../solana/market-sniper";

import fetchDataWithAxios from './helper/fetchDataWithAxios'

import {
    darkModePrimary,
    darkModeSecondary,
    lightModePrimary,
    lightModeSecondary,
    secondaryColor,
    CORS_BUY_PROXY,
    CORS_PROXY_API,
    MAGICEDEN_API,
    DEFAULT_RPC_API,
    SNIPING_RANGE,
    CLOUD_FLARE_URI,
    CORS_PROXY_SERVER,
    MAGICEDEN_API_KEY,
    HADES_SERVER
} from './helper/Constants';

const isDevelopment = process.env.NODE_ENV !== 'production';
const PAGECOUNT = 20;

const myParseInt = (value: any, isInt: boolean = false) => {
    const parsedValue = isInt ? parseInt(value) : parseFloat(value);
    if (isNaN(parsedValue)) {
        return 0;
    }
    else {
        if (parsedValue < 0) {
            return 0;
        }
    }
    return parsedValue;
}

var settingsPath = '';
var walletsPath = '';
if (isDevelopment) {
    walletsPath = path.resolve('./', 'wallets.json');
    settingsPath = path.resolve('./', 'settings.json');
} else {
    walletsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/wallets.json' : `${process.env.APPDATA}\\Hades\\wallets.json`;
    settingsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/settings.json' : `${process.env.APPDATA}\\Hades\\settings.json`;
}

if (!fs.existsSync(settingsPath)) {
    fs.writeFile(settingsPath, '{}', function (err) {
        if (err) throw err;
    });
}

if (!fs.existsSync(walletsPath)) {
    fs.writeFile(walletsPath, '[]', function (err) {
        if (err) throw err;
    });
}

let bought = 0;
let remain = 0;
let canceled = true;
let isLoading = false;

export default function SniperSection() {
    const [settings, setSettings] = React.useState({} as any);

    const [symbol, setSymbol] = React.useState<string>(``);
    const [sniperLimitPrice, setSniperLimitPrice] = useState(0);
    const [sniperLimitNumber, setSniperLimitNumber] = useState(0);
    const [walletValue, setWalletValue] = React.useState("");

    const [autoLoading, setAutoLoading] = useState(isLoading);
    const [boughtState, setBoughtState] = useState(bought);
    const [wallets, setWallets] = React.useState([]);

    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    useEffect(() => {
        let settingsRawData = fs.readFileSync(settingsPath);
        let settingsJsonData = JSON.parse(settingsRawData.toString());
        setSettings(settingsJsonData);
        let walletsRawData = fs.readFileSync(walletsPath);
        let walletsJsonData = JSON.parse(walletsRawData.toString());
        setWallets(walletsJsonData);

    }, []);

    const sniperBuyItems = async (items: any) => {
        const walletArray: any = wallets.filter((x: { id: any; }) => x.id === walletValue);
        try {
            if (walletArray.length > 0) {
                const connection = new anchor.web3.Connection(settings.rpcUrl ? settings.rpcUrl : DEFAULT_RPC_API);

                const privateKeyFromWallet = walletArray[0].privateKey;
                const secretKey = bs58.decode(privateKeyFromWallet);
                const keyPair = anchor.web3.Keypair.fromSecretKey(secretKey);
                const wallet = new anchor.Wallet(keyPair);

                if (wallet && wallet?.payer) {
                    const provider = new anchor.AnchorProvider(connection, wallet, {
                        preflightCommitment: 'recent',
                    });
                    const boughtRes = await quickMultiBuy(items, wallet?.publicKey, provider, remain);
                    return boughtRes;
                }
                else {
                    setShowAlert(true);
                    setAlertTypeValue(`error`);
                    setAlertMessageValue(`Wallet not found, Please check your wallet.`);
                    await pauseAutoSniping();
                }
            }
            else {
                setShowAlert(true);
                setAlertTypeValue(`error`);
                setAlertMessageValue(`Wallet not found, Please check your wallet.`);
                await pauseAutoSniping();
            }
            return 0;
        }
        catch (err) {
            return 0
        }
    }

    const startAutoSniping = async (i = 0) => {
        try {
            if (remain > 0) {
                if (!canceled) {
                    setAutoLoading(true);
                    isLoading = true;
                    const uri = `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/listings?offset=${i}&limit=${PAGECOUNT}`;
                    const nfts: any = await fetchDataWithAxios({
                        method: `post`,
                        route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.GET_MAGIC_DATA}`,
                        data: {
                            uri: `${uri}`
                        }
                    });
                    if (nfts && Array.isArray(nfts) && nfts?.length > 0) {
                        const lessThanLimitPrice = nfts.filter((nft: any) => {
                            return nft?.price <= myParseInt(sniperLimitPrice, false)
                        });
                        if (lessThanLimitPrice.length > 0) {
                            const boughtNft = await sniperBuyItems(lessThanLimitPrice);
                            bought += boughtNft;
                            remain -= boughtNft;
                            setBoughtState(bought)
                        }
                        setBoughtState(bought)
                        await startAutoSniping(i + PAGECOUNT);
                    }
                    else {
                        await startAutoSniping(0);
                    }
                }
                else {
                    setShowAlert(true);
                    setAlertTypeValue(`info`);
                    setAlertMessageValue(`${bought} NFTs were sniped`);

                    setAutoLoading(false);
                    isLoading = false;
                    remain = sniperLimitNumber;
                    bought = 0;
                    setBoughtState(0);
                    await pauseAutoSniping();
                }
            }
            else {
                setShowAlert(true);
                setAlertTypeValue(`success`);
                setAlertMessageValue(`All NFTs are sniped. ${bought} NFTs were sniped`);

                setAutoLoading(false);
                isLoading = false;
                remain = sniperLimitNumber;
                bought = 0;
                setBoughtState(0);
                await pauseAutoSniping();
            }
        } catch (error) {
            await startAutoSniping(0)
        } finally {

        }
    }

    const sniper = async () => {
        if (!autoLoading) {
            if (symbol && myParseInt(sniperLimitPrice, false) && sniperLimitNumber && walletValue) {
                canceled = false;
                await startAutoSniping(0);
            }
            else {
                if (!symbol) {
                    setAlertMessageValue(`Please input Collection correctly!`);
                }
                else if (!myParseInt(sniperLimitPrice, false)) {
                    setAlertMessageValue(`Please input Limit Price correctly!`);
                }
                else if (!sniperLimitNumber) {
                    setAlertMessageValue(`Please input Amount correctly!`);
                }
                else if (!walletValue) {
                    setAlertMessageValue(`Please select your Wallet!`);
                }
                else {
                    setAlertMessageValue(`Please input correctly!`);
                }
                setShowAlert(true);
                setAlertTypeValue(`error`);

            }
        } else {
            await pauseAutoSniping();
        }
    }

    const pauseAutoSniping = async () => {
        setAutoLoading(false);
        // isLoading = false;
        canceled = true;
        // remain = sniperLimitNumber;
        // bought = 0;
    }

    return (
        <>
            <AppBar elevation={0} position="static" style={{ backgroundColor: darkModePrimary, marginBottom: '15px' }}>
                <Toolbar style={{ paddingLeft: '0px' }}>
                    <div style={{ flexDirection: 'column', display: 'flex' }}>
                        <Typography variant={'h4'}>Settings</Typography>
                    </div>
                </Toolbar>
                <Divider style={{ backgroundColor: secondaryColor, height: '2px' }} />
            </AppBar>

            <Grid container direction="row" alignItems="center" spacing={3}>
                <Grid item md={1}></Grid>
                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary }}>
                        Collection Symbol
                    </Typography>
                </Grid>
                <Grid item md={6}>
                    <CircularBorderDiv style={undefined}>
                        <CustomTextField
                            value={symbol}
                            onChange={(event: { target: { value: any; }; }) => {
                                setSymbol(event.target.value);
                            }}
                            onKeyPress={undefined}
                            style={undefined}
                            onBlur={(event: { target: { value: any; }; }) => { }}
                            startAdornment={undefined}
                            endAdornment={undefined}
                            disabled={false}
                        />
                    </CircularBorderDiv>
                </Grid>
                <Grid item md={3}>
                </Grid>

                <Grid item md={1}></Grid>
                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary }}>
                        Limit Max Price *
                    </Typography>
                </Grid>

                <Grid item md={2}>
                    <CircularBorderDiv style={undefined}>
                        <CustomTextField
                            value={sniperLimitPrice}
                            onChange={(event: { target: { value: any; }; }) => {
                                setSniperLimitPrice(event.target.value);
                            }}
                            onBlur={() => { }}
                            style={{ fontSize: '13px' }}
                            maxLength={500} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                    </CircularBorderDiv>
                </Grid>
                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary, textAlign: `right` }}>
                        Amount *
                    </Typography>
                </Grid>
                <Grid item md={2}>
                    <CircularBorderDiv style={undefined}>
                        <CustomTextField
                            value={sniperLimitNumber}
                            onChange={(event: { target: { value: any; }; }) => {
                                setSniperLimitNumber(myParseInt(event.target.value, true));
                                remain = myParseInt(event.target.value, true);
                            }}
                            onBlur={() => { }}
                            style={{ fontSize: '13px' }}
                            maxLength={500} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                    </CircularBorderDiv>
                </Grid>
                <Grid item md={3}></Grid>

                <Grid item md={1}></Grid>
                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary }}>
                        Select Wallet *
                    </Typography>
                </Grid>
                <Grid item md={2}>
                    <CircularBorderDiv style={undefined}>
                        <CustomSelect
                            value={walletValue}
                            onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setWalletValue(event.target.value)}
                            style={{ fontSize: '13px', height: '35px' }}
                        >
                            {wallets.map((x: { id: any; walletName: any; }) =>
                                <MenuItem key={x.id} value={x.id} style={{ fontSize: '13px' }}>{x.walletName}</MenuItem>
                            )}
                        </CustomSelect>
                    </CircularBorderDiv>
                </Grid>
                <Grid item md={7}>
                </Grid>
                <Grid item md={1}></Grid>
                <Grid item md={2}></Grid>
                <Grid item md={4}>
                    <CustomButton
                        onClick={async () => {
                            await sniper();
                        }}
                        variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined}
                        className={
                            autoLoading ? `twinkle pulseBox` : ``
                        }
                    >
                        {
                            autoLoading ?
                                (
                                    <>
                                        Sniping...&nbsp;&nbsp;({boughtState} were sniped)
                                    </>
                                )
                                :
                                'Start Sniping'
                        }
                    </CustomButton>
                </Grid>
            </Grid>

            <Snackbar open={showAlert} autoHideDuration={5000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </>

    )
}