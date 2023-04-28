import React, { useState, useEffect, useRef } from 'react';
import {
    darkModePrimary,
    darkModeSecondary,
    HADES_SERVER,
    lightModePrimary,
    lightModeSecondary,
    secondaryColor,
    thirdColor,
    MAGICEDEN_API,
    DEFAULT_RPC_API,
    SNIPING_RANGE,
    CLOUD_FLARE_URI,
    CORS_PROXY_SERVER,
    MAGICEDEN_API_KEY,
    CORS_BUY_PROXY,
    CORS_PROXY_API,
} from './helper/Constants';
import { CircularBorderDiv, CustomButton, CustomDialog, CustomDialogTitle, CustomInputLabel, CustomTextField, CustomSelect } from './helper/CustomHtml';
import * as fs from 'fs';

import * as anchor from "@project-serum/anchor";
import * as web3 from '@solana/web3.js';
import * as bs58 from "bs58";
import path from 'path';
import { Alert, AppBar, Dialog, DialogContentText, DialogTitle, DialogActions, DialogContent, Divider, Grid, IconButton, MenuItem, Paper, Snackbar, Table, TableBody, TableContainer, TableHead, TableRow, Toolbar, Tooltip, Typography, Backdrop, CircularProgress } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import WysiwygIcon from '@mui/icons-material/Wysiwyg';
import { withStyles, makeStyles, createStyles } from '@mui/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import PlayArrowIcon from '@mui/icons-material/PlayArrowOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TextField from '@mui/material/TextField';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import SettingsIcon from '@mui/icons-material/Settings';

import { MEDetails, ME_AccountInfo, MintToken, MintMEToken, phantasiaRpcUrl, CandyMachine } from '../solana/Solana';

import { getCandyMachineMEState } from "./../solana/candy-machine-me";
import { quickMultiBuy } from "./../solana/market-sniper";
import { createWebhookMessage } from './helper/Discord';
import { styled } from '@mui/styles';
import { isSet } from 'util/types';
import axios from "axios";
import Countdown from 'react-countdown';
import fetchDataWithAxios from './helper/fetchDataWithAxios';

import { store, RootState } from "./../redux/store";
import { useAppSelector, useAppDispatch } from "./../redux/hooks";
import { setTheme } from "./../redux/slices/counterSlice";
import theme from '../theme';

const isDevelopment = process.env.NODE_ENV !== 'production';
const PAGECOUNT = 20;

const useStyles: any = makeStyles(() =>
    createStyles({
        root: {},
        actionButton: {
            transition: `all .3s`,
            '&:hover': {
                transform: `scale(1.2)`
            }
        }
    })
);

let sniperStatus: any[] = [];

var tasksPath = '';
var walletsPath = '';
var settingsPath = '';
var snipersPath = ``;
if (isDevelopment) {
    tasksPath = path.resolve('./', 'tasks.json');
    snipersPath = path.resolve('./', 'snipers.json');
    walletsPath = path.resolve('./', 'wallets.json');
    settingsPath = path.resolve('./', 'settings.json');
} else {
    tasksPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/tasks.json' : `${process.env.APPDATA}\\Hades\\tasks.json`;
    snipersPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/snipers.json' : `${process.env.APPDATA}\\Hades\\snipers.json`;
    walletsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/wallets.json' : `${process.env.APPDATA}\\Hades\\wallets.json`;
    settingsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/settings.json' : `${process.env.APPDATA}\\Hades\\settings.json`;
}

if (!fs.existsSync(tasksPath)) {
    fs.writeFile(tasksPath, '[]', function (err) {
        if (err) throw err;
    });
}

if (!fs.existsSync(walletsPath)) {
    fs.writeFile(walletsPath, '[]', function (err) {
        if (err) throw err;
    });
}

if (!fs.existsSync(settingsPath)) {
    fs.writeFile(settingsPath, '{}', function (err) {
        if (err) throw err;
    });
}

if (!fs.existsSync(snipersPath)) {
    fs.writeFile(snipersPath, '[]', function (err) {
        if (err) throw err;
    });
}

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

function SaveTasksFile(tasks: any) {
    fs.writeFile(snipersPath, tasks, function (err) {
        if (err) throw err;
    });
}

function createUniqueId(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: '#00000',
        color: '#FFFFFF',
        width: '150px',
        border: 0
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        width: '150px',
        color: '#FFFFFF',
        border: '1px solid #1C1C1C',
        //   borderRadius: '10px'
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {

    },
    // hide last border
    '&:last-child td, &:last-child th': {

    },
}));

function AddTaskDialog({ onClose, open, wallets, addTask }: { onClose: any, open: any, wallets: any, addTask: any }) {
    const [symbol, setSymbol] = React.useState<string>("");
    const [price, setPrice] = React.useState<number>(0);
    const [count, setCount] = React.useState<number>(0);
    const [walletValue, setWalletValue] = React.useState<string>("");

    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState<string>("");

    const validateAddTask = () => {
        return symbol && price && count && walletValue;
    }

    const clearAddTaskFields = (close: boolean) => {
        setSymbol('');
        setPrice(0);
        setCount(0);
        setWalletValue(``);
        if (close) {
            onClose();
        }
    }

    return (
        <CustomDialog
            open={open}
            onClose={() => onClose()}
            style={{ width: '800px', border: `solid 1px white` }}
        >
            <CustomDialogTitle
                onClick={() => onClose()}
            >
                Add Sniper
            </CustomDialogTitle>
            <DialogContent>
                <div className="formControl justify-content-between" style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Symbol*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={symbol}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setSymbol(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.06 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Limit Price*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={price}
                                onChange={(event: { target: { value: React.SetStateAction<number>; }; }) => setPrice(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.06 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Count*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={count}
                                onChange={(event: { target: { value: React.SetStateAction<number>; }; }) => setCount(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.06 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Wallet*</CustomInputLabel>
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
                    </div>

                </div>
            </DialogContent>
            <DialogActions>
                <CustomButton onClick={() => onClose()} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>Cancel</CustomButton>
                <CustomButton
                    onClick={async () => {
                        if (validateAddTask()) {
                            addTask(symbol, price, walletValue, count);
                            clearAddTaskFields(true);
                        } else {
                            setAlertTypeValue("error");
                            setAlertMessageValue("Empty wallet name or invalid input value! Please insert correctly.");
                            setShowAlert(true);
                        }
                    }}
                    variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}
                >
                    Add Sniper
                </CustomButton>
            </DialogActions>
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </CustomDialog>
    );
}

function EditTaskDialog({ onClose, open, wallets, rowItem, editTask }: { onClose: any, open: any, wallets: any, rowItem: any, editTask: any }) {
    const [rowId, setRowId] = React.useState<string>("");
    const [symbol, setSymbol] = React.useState<string>("");
    const [price, setPrice] = React.useState<number>(0);
    const [walletValue, setWalletValue] = React.useState<string>("");
    const [count, setCount] = React.useState<number>(0);

    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    useEffect(() => {
        setRowId(rowItem.id);
        setSymbol(rowItem.symbol);
        setPrice(rowItem.price);
        setWalletValue(rowItem.walletId);
        setCount(rowItem.count)
    }, [open]);

    const validateEditTask = () => {
        return symbol && price && count && walletValue;
    }

    const clearEditTaskFields = () => {
        setSymbol('');
        setPrice(0);
        setWalletValue('');
        setCount(0);
    }

    return (
        <CustomDialog
            open={open}
            onClose={() => onClose()}
            style={{ width: '800px', border: `solid 1px white` }}
        >
            <CustomDialogTitle
                onClick={() => onClose()}
            >
                Edit Sniper
            </CustomDialogTitle>
            <DialogContent>
                <div className="formControl" style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Symbol*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={symbol}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setSymbol(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.05 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Limit Price*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={price}
                                onChange={(event: { target: { value: React.SetStateAction<number>; }; }) => setPrice(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.05 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Count*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={count}
                                onChange={(event: { target: { value: React.SetStateAction<number>; }; }) => setCount(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.3 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Wallet*</CustomInputLabel>
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
                    </div>
                </div>
            </DialogContent>
            <DialogActions>
                <CustomButton onClick={() => onClose()} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>Cancel</CustomButton>
                <CustomButton
                    onClick={async () => {
                        if (validateEditTask()) {
                            onClose();
                            editTask(rowId, symbol, price, walletValue, count);
                            clearEditTaskFields();
                        } else {
                            setAlertTypeValue("error");
                            setAlertMessageValue("Empty wallet name or invalid input value! Please insert correctly.");
                            setShowAlert(true);
                        }
                    }} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>
                    Edit Sniper
                </CustomButton>
            </DialogActions>
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </CustomDialog>
    );
}

function OneTask(
    {
        wallets,
        settings,
        openEditTask,
        deleteTask,
        setShowAlert,
        setAlertTypeValue,
        setAlertMessageValue,
        setTasks,
        row }: {
            wallets: any,
            settings: any,
            openEditTask: any,
            deleteTask: any,
            setShowAlert: any,
            setAlertTypeValue: any,
            setAlertMessageValue: any,
            setTasks: any,
            row: any
        }) {
    const classes = useStyles();
    const snipers = useAppSelector((state: RootState) => state.isOwner.theme);
    const dispatch = useAppDispatch();
    const taskTemp = snipers.find((sniper: any) => {
        return sniper?.id == row?.id
    });

    React.useEffect(() => {
        (async () => {
            if (!taskTemp?.autoLoading) {
                let tempState = sniperStatus.map((state: any) => {
                    if (state?.id == row?.id) {
                        return {
                            ...state,
                            canceled: taskTemp?.canceled,
                            bought: taskTemp?.bought,
                            remain: taskTemp?.remain,
                            last: taskTemp?.last
                        }
                    }
                    return state;
                });
                sniperStatus = tempState;
            }
        })();
    }, []);

    const sniper = async () => {
        if (!snipers?.find((sniper: any) => { return sniper?.id == row?.id })?.autoLoading) {
            if (row?.symbol && myParseInt(row?.price, false) && row?.count && row?.walletId) {
                let tempState = sniperStatus.map((state: any) => {
                    if (state?.id == row?.id) {
                        return {
                            ...state,
                            canceled: false
                        }
                    }
                    return state;
                });
                sniperStatus = tempState;
                await startAutoSniping(0);
            }
            else {
                if (!row?.symbol) {
                    setAlertMessageValue(`Please input Collection correctly!`);
                }
                else if (!myParseInt(row?.price, false)) {
                    setAlertMessageValue(`Please input Limit Price correctly!`);
                }
                else if (!row?.count) {
                    setAlertMessageValue(`Please input Amount correctly!`);
                }
                else if (!row?.walletId) {
                    setAlertMessageValue(`Please select your Wallet!`);
                }
                else {
                    setAlertMessageValue(`Please input correctly!`);
                }
                setShowAlert(true);
                setAlertTypeValue(`error`);
                await pauseAutoSniping();
            }
        } else {
            await pauseAutoSniping();
        }
    }

    const startAutoSniping = async (i = 0) => {
        try {
            // console.log(
            //     `remain, bought, canceled`,
            //     sniperStatus.find((state: any) => { return state?.id == row?.id; })?.remain,
            //     sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought,
            //     sniperStatus.find((state: any) => { return state?.id == row?.id; })?.canceled
            // );
            if (sniperStatus.find((state: any) => { return state?.id == row?.id; })?.remain > 0) {
                if (!sniperStatus.find((state: any) => { return state?.id == row?.id; })?.canceled) {
                    let temp = sniperStatus.map((sniper: any) => {
                        if (sniper?.id == row?.id) {
                            return {
                                ...sniper,
                                autoLoading: true
                            }
                        }
                        return sniper;
                    });
                    sniperStatus = temp;
                    dispatch(setTheme([...sniperStatus]));

                    const uri = `https://api-mainnet.magiceden.dev/v2/collections/${row?.symbol}/listings?offset=${i}&limit=${PAGECOUNT}`;
                    const nfts: any = await fetchDataWithAxios({
                        method: `post`,
                        route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.GET_MAGIC_DATA}`,
                        data: {
                            uri: `${uri}`
                        }
                    });

                    if (nfts && Array.isArray(nfts) && nfts?.length > 0) {
                        const lessThanLimitPrice = nfts.filter((nft: any) => {
                            return nft?.price <= myParseInt(row?.price, false)
                        });
                        if (lessThanLimitPrice.length > 0) {
                            const boughtNft = await sniperBuyItems(lessThanLimitPrice);

                            let boughtCnt = sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought;
                            let remainCnt = sniperStatus.find((state: any) => { return state?.id == row?.id; })?.remain;
                            let tempState = sniperStatus.map((state: any) => {
                                if (state?.id == row?.id) {
                                    return {
                                        ...state,
                                        bought: boughtCnt + boughtNft,
                                        remain: remainCnt - boughtNft,
                                    }
                                }
                                return state;
                            });
                            sniperStatus = tempState;
                            dispatch(setTheme([...sniperStatus]));
                        }
                        await startAutoSniping(i + PAGECOUNT);
                    }
                    else {
                        await startAutoSniping(0);
                    }
                }
                else {
                    let boughtData = sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought;
                    setShowAlert(true);
                    setAlertTypeValue(`info`);
                    setAlertMessageValue(`${sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought} NFTs were sniped`);

                    let tempState = sniperStatus.map((state: any) => {
                        if (state?.id == row?.id) {
                            return {
                                ...state,
                                canceled: true,
                                bought: 0,
                                remain: row?.count,
                                autoLoading: false,
                                last: boughtData
                            }
                        }
                        return state;
                    });
                    sniperStatus = tempState;
                    dispatch(setTheme([...sniperStatus]));
                    await saveBought(boughtData);
                }
            }
            else {
                let boughtData = sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought;
                setShowAlert(true);
                setAlertTypeValue(`success`);
                setAlertMessageValue(`All NFTs are sniped. ${sniperStatus.find((state: any) => { return state?.id == row?.id; })?.bought} NFTs were sniped`);

                let tempState = sniperStatus.map((state: any) => {
                    if (state?.id == row?.id) {
                        return {
                            ...state,
                            canceled: true,
                            bought: 0,
                            remain: row?.count,
                            autoLoading: false,
                            last: boughtData
                        }
                    }
                    return state;
                });
                sniperStatus = tempState;
                dispatch(setTheme([...sniperStatus]));

                await saveBought(boughtData);
            }
        } catch (error) {
            await startAutoSniping(0)
        } finally {

        }
    }

    const sniperBuyItems = async (items: any) => {
        const walletArray: any = wallets.filter((x: { id: any; }) => x.id == row?.walletId);
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
                    const boughtRes = await quickMultiBuy(items, wallet?.publicKey, provider, sniperStatus.find((state: any) => { return state?.id == row?.id; })?.remain || 0);
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

    const pauseAutoSniping = async () => {
        let tempState = sniperStatus.map((state: any) => {
            if (state?.id == row?.id) {
                return {
                    ...state,
                    canceled: true
                }
            }
            return state;
        });
        sniperStatus = tempState;

        dispatch(setTheme([...sniperStatus]));
    }

    const saveBought = async (bought: any) => {
        if (row) {
            let tasksRawData = fs.readFileSync(snipersPath);
            let tasksJsonData = JSON.parse(tasksRawData.toString());
            let rowItemIndex = tasksJsonData.findIndex(((x: any) => x.id == row?.id));
            tasksJsonData[rowItemIndex] = {
                ...row,
                bought: bought
            }
            console.log(`modifed`, tasksJsonData);
            SaveTasksFile(JSON.stringify(tasksJsonData));


        }
    }

    return (
        <>
            <StyledTableRow key={row?.id} sx={{ backgroundColor: secondaryColor, border: 0 }}>
                <StyledTableCell>{row?.symbol}</StyledTableCell>
                <StyledTableCell>{row?.price}</StyledTableCell>
                <StyledTableCell>
                    {row?.count}
                </StyledTableCell>
                <StyledTableCell>
                    {
                        wallets.filter((x: { id: any; }) => x.id == row?.walletId).length > 0 ?
                            wallets.filter((x: { id: any; }) => x.id == row?.walletId)[0].walletName
                            :
                            ''
                    }
                </StyledTableCell>
                <StyledTableCell>
                    {
                        snipers?.find((sniper: any) => { return sniper?.id == row?.id })?.last
                    }
                </StyledTableCell>

                <StyledTableCell style={{ width: `20%` }}>
                    <>
                        {
                            !snipers?.find((sniper: any) => { return sniper?.id == row?.id })?.autoLoading ?
                                <IconButton onClick={
                                    async () => {
                                        await sniper();
                                    }
                                }
                                    color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary, paddingLeft: 0 }}>
                                    <PlayCircleOutlineIcon style={{ width: '20px', height: '20px' }} />
                                </IconButton>
                                :
                                <CustomButton
                                    onClick={async () => {
                                        await sniper();
                                    }}
                                    variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined}
                                    className={
                                        `twinkle pulseBox`
                                    }
                                >
                                    {
                                        `Sniping... (${snipers.find((sniper: any) => {
                                            return sniper?.id == row?.id
                                        })?.bought} were bought)`
                                    }
                                </CustomButton>
                        }

                        {
                            !snipers.find((sniper: any) => {
                                return sniper?.id == row?.id
                            })?.autoLoading ?
                                <>
                                    <IconButton
                                        onClick={async () => openEditTask(row)}
                                        color="inherit"
                                        className={`notDraggable ${classes.actionButton}`}
                                        style={{ color: lightModePrimary }}
                                    >
                                        <EditIcon style={{ width: '20px', height: '20px' }} />
                                    </IconButton>
                                    <IconButton onClick={() => deleteTask(row?.id)} color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary }}>
                                        <DeleteIcon style={{ width: '20px', height: '20px' }} />
                                    </IconButton>
                                </> : <></>
                        }

                    </>
                </StyledTableCell>
            </StyledTableRow>
        </>
    )
}

function TaskTable({
    windowHeight,
    tasks,
    wallets,
    settings,
    openEditTask,
    deleteTask,
    setShowAlert,
    setAlertTypeValue,
    setAlertMessageValue,
    setTasks,
}:
    {
        windowHeight: any,
        tasks: any,
        wallets: any,
        settings: any,
        openEditTask: any,
        deleteTask: any,
        setShowAlert: any,
        setAlertTypeValue: any,
        setAlertMessageValue: any,
        setTasks: any
    }) {

    return (
        <React.Fragment>
            <TableContainer elevation={0} style={{ maxHeight: windowHeight - 270, backgroundColor: 'transparent' }} component={Paper}>
                <Table style={{ borderCollapse: 'separate', borderSpacing: '0px 5px' }}>
                    {tasks.length > 0 &&
                        <TableHead sx={{ backgroundColor: darkModePrimary }}>
                            <TableRow style={{ border: 0 }}>
                                <StyledTableCell>Symbol</StyledTableCell>
                                <StyledTableCell>Limit Price</StyledTableCell>
                                <StyledTableCell>Count</StyledTableCell>
                                <StyledTableCell>Wallet</StyledTableCell>
                                <StyledTableCell>Current Bought</StyledTableCell>
                                <StyledTableCell style={{ width: `20%` }}>Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                    }
                    <TableBody>
                        {tasks.map((row: any) => (
                            <OneTask
                                key={row.id}
                                wallets={wallets}
                                settings={settings}
                                openEditTask={openEditTask}
                                deleteTask={deleteTask}
                                row={row}
                                setShowAlert={setShowAlert}
                                setAlertTypeValue={setAlertTypeValue}
                                setAlertMessageValue={setAlertMessageValue}
                                setTasks={setTasks}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    )
}

export default function MultiSniperSection({ windowHeight }: { windowHeight: any }) {
    const snipers = useAppSelector((state: RootState) => state.isOwner.theme);
    const dispatch = useAppDispatch();

    const [tasks, setTasks] = React.useState([] as any[]);
    const [wallets, setWallets] = React.useState([]);
    const [settings, setSettings] = React.useState([]);

    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    const [addTaskDialogOpen, setAddTaskDialogOpen] = React.useState(false);
    const [editTaskDialogOpen, setEditTaskDialogOpen] = React.useState(false);
    const [editRowItem, setEditRowItem] = React.useState({} as any);

    const classes = useStyles();

    useEffect(() => {
        let tasksRawData = fs.readFileSync(snipersPath);
        let tasksJsonData = JSON.parse(tasksRawData.toString());
        setTasks([...tasksJsonData]);

        if (Array.isArray(tasksJsonData)) {
            const newTasks = tasksJsonData.filter((task: any) => {
                if (!sniperStatus.find((sniper: any) => { return task?.id == sniper?.id })) {
                    return true;
                }
                return false;
            });

            const statesNew = newTasks.map((task: any) => {
                return {
                    id: task?.id,
                    remain: task?.count,
                    bought: 0,
                    canceled: true,
                    autoLoading: false,
                    last: task?.last
                }
            });
            sniperStatus = [...sniperStatus, ...statesNew];

            dispatch(setTheme([...sniperStatus]));
        }

        let walletsRawData = fs.readFileSync(walletsPath);
        let walletsJsonData = JSON.parse(walletsRawData.toString());
        setWallets(walletsJsonData);

        let settingsRawData = fs.readFileSync(settingsPath);
        let settingsJsonData = JSON.parse(settingsRawData.toString());
        setSettings(settingsJsonData);
    }, []);

    useEffect(() => {
        console.log(`SWAT`);
    }, [tasks]);

    const addTask = (symbol: string, price: number, walletValue: any, count: number) => {
        var updatedTasks = [];
        updatedTasks.push({
            id: createUniqueId(30),
            symbol: symbol,
            price: price,
            count: count,
            walletId: walletValue,
            last: 0,
        });
        updatedTasks = tasks.concat(updatedTasks);

        SaveTasksFile(JSON.stringify(updatedTasks));
        setTasks([...updatedTasks]);

        if (Array.isArray(updatedTasks)) {
            const newTasks = updatedTasks.filter((task: any) => {
                if (!sniperStatus.find((sniper: any) => { return task?.id == sniper?.id })) {
                    return true;
                }
                return false;
            });

            const statesNew = newTasks.map((task: any) => {
                return {
                    id: task?.id,
                    remain: task?.count,
                    bought: 0,
                    canceled: true,
                    autoLoading: false,
                    last: 0
                }
            });
            sniperStatus = [...sniperStatus, ...statesNew];

            dispatch(setTheme([...sniperStatus]));
        }

        setAlertTypeValue("success");
        setAlertMessageValue("Adding new sniper is successed!");
        setShowAlert(true);
    }

    const openEditTask = (row: any) => {
        setEditRowItem(row);
        setEditTaskDialogOpen(true);
    }

    const editTask = (id: any, symbol: any, price: any, walletValue: any, count: any) => {
        var rowItemIndex = tasks.findIndex((x => x.id == id));
        if (rowItemIndex > -1) {
            const old = tasks[rowItemIndex];
            tasks[rowItemIndex] = {
                id,
                symbol: symbol,
                price: price,
                walletId: walletValue,
                count: count,
                last: old?.last
            }

            SaveTasksFile(JSON.stringify(tasks));
            setTasks([...tasks]);

            if (Array.isArray(tasks)) {
                let temp = sniperStatus.map((sniper: any) => {
                    if (sniper?.id == id) {
                        return {
                            ...sniper,
                            remain: count,
                            bought: 0,
                            canceled: true,
                            autoLoading: false,
                        }
                    }
                    return sniper;
                });
                sniperStatus = temp;

                dispatch(setTheme([...sniperStatus]));
            }

            setAlertTypeValue("success");
            setAlertMessageValue("The task is edited successfully.");
        } else {
            setAlertTypeValue("error");
            setAlertMessageValue("Editing task is failed. Please try again.");
        }
        setShowAlert(true);
    }

    const deleteTask = (id: any) => {
        var updatedTasks = tasks.filter(x => x.id != id);
        SaveTasksFile(JSON.stringify(updatedTasks));
        setTasks([...updatedTasks]);

        if (Array.isArray(updatedTasks)) {
            const newTasks = sniperStatus.filter((task: any) => {
                return task?.id != id
            });

            sniperStatus = newTasks;
            dispatch(setTheme([...sniperStatus]));

        }

        setAlertTypeValue("success");
        setAlertMessageValue("Task is deleted successfully.");
        setShowAlert(true);
    }

    return (
        <React.Fragment>
            <AppBar elevation={0} position="static" style={{ backgroundColor: darkModePrimary, marginBottom: '15px' }}>
                <Toolbar style={{ paddingLeft: '0px' }}>
                    <div style={{ flexDirection: 'column', display: 'flex' }}>
                        <Typography variant={'h4'}>Snipers</Typography>
                    </div>
                    <Grid item xs />
                    <Tooltip title="Add Sniper">
                        <IconButton
                            onClick={
                                () => setAddTaskDialogOpen(true)
                            }
                            color="inherit"
                            className="notDraggable"
                            style={{ color: darkModeSecondary }}
                        >
                            <AddCircleOutlineIcon className={`${classes.actionButton}`} />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Divider style={{ backgroundColor: secondaryColor, height: '2px' }} />
                <Typography component={'span'} style={{ fontSize: '13px', marginLeft: '10px' }}>{tasks.length} Total</Typography>
            </AppBar>

            <TaskTable
                windowHeight={windowHeight}
                tasks={tasks}
                wallets={wallets}
                settings={settings}
                openEditTask={
                    (row: any) => {
                        return openEditTask(row)
                    }
                }
                deleteTask={
                    (id: any) => {
                        return deleteTask(id)
                    }
                }
                setShowAlert={setShowAlert}
                setAlertTypeValue={setAlertTypeValue}
                setAlertMessageValue={setAlertMessageValue}
                setTasks={setTasks}
            />

            <AddTaskDialog
                open={addTaskDialogOpen}
                wallets={wallets}
                onClose={() => { setAddTaskDialogOpen(false) }}
                addTask={
                    (symbol: any, price: any, walletValue: any, count: any) => addTask(symbol, price, walletValue, count)}
            />

            <EditTaskDialog
                open={editTaskDialogOpen}
                wallets={wallets}
                rowItem={editRowItem}
                onClose={() => {
                    setEditTaskDialogOpen(false)
                }}
                editTask={
                    (id: any, symbol: any, price: any, walletValue: any, count: any) => editTask(id, symbol, price, walletValue, count)
                }
            />

            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </React.Fragment>
    )
}