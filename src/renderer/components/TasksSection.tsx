import React, { useState, useEffect, useRef } from 'react';
import {
    darkModePrimary,
    darkModeSecondary,
    HADES_SERVER,
    lightModePrimary,
    lightModeSecondary,
    secondaryColor,
    thirdColor
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

import { getCandyMachineMEState } from "./../solana/candy-machine-me"
import { createWebhookMessage } from './helper/Discord';
import { styled } from '@mui/styles';
import { isSet } from 'util/types';
import axios from "axios";
import Countdown from 'react-countdown';
import fetchDataWithAxios from './helper/fetchDataWithAxios';

const isDevelopment = process.env.NODE_ENV !== 'production'
const CORS_PROXY_API = `https://hades.boogle-cors.workers.dev?u=`;

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

const getStatus = (key: number) => {
    switch (key) {
        case -1:
            return {
                text: 'Not Live',
                color: 'danger'
            }
        case 0:
            return {
                text: 'Sold out',
                color: 'danger'
            }
        case 1:
            return {
                text: 'Minted',
                color: 'success'
            }
        case 2:
            return {
                text: 'Ready',
                color: ''
            }
        default:
            return {
                text: 'Ready',
                color: ''
            }
    }
}

interface MintCountdownProps {
    date: Date | undefined;
    style?: React.CSSProperties;
    status?: string;
    onComplete?: () => void;
}

interface MintCountdownRender {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
}

var tasksPath = '';
var walletsPath = '';
var settingsPath = ''
if (isDevelopment) {
    tasksPath = path.resolve('./', 'tasks.json');
    walletsPath = path.resolve('./', 'wallets.json');
    settingsPath = path.resolve('./', 'settings.json');
} else {
    tasksPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/tasks.json' : `${process.env.APPDATA}\\Hades\\tasks.json`;
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

function SaveTasksFile(tasks: any) {
    fs.writeFile(tasksPath, tasks, function (err) {
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

const scrapeMEInfo = async (candyMachineId: any) => {

    try {
        const meInfo: any = await fetchDataWithAxios({
            method: `post`,
            route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.GET_MAGIC_DATA}`,
            data: {
                uri: `https://api-mainnet.magiceden.dev/v2/launchpad/collections?offset=0&limit=200`
            }
        });

        for (let i = 0; i < meInfo.length; i++) {
            if (meInfo[i]?.mint && meInfo[i]?.mint?.candyMachineId && meInfo[i]?.mint?.candyMachineId == candyMachineId) {
                return {
                    state: true,
                    data: meInfo[i],
                    status: 2
                }
            }
        }
    }
    catch (error: any) {
        console.log(error);
        return {
            state: false,
            data: 'Magiceden API error! Please retry later.',
            status: 2
        }
    }
    return {
        state: false,
        data: 'Not found collection. Please check the collection ID.',
        status: -1
    }
}

function AddTaskDialog({ onClose, open, wallets, addTask }: { onClose: any, open: any, wallets: any, addTask: any }) {
    const [platformValue, setPlatformValue] = React.useState("");
    const [cmidValue, setCmidValue] = React.useState("");
    const [walletValue, setWalletValue] = React.useState("");
    const [qtyValue, setQtyValue] = React.useState(1);
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    const validateAddTask = () => {
        return platformValue !== "" && cmidValue !== "" && walletValue !== "";
    }

    const clearAddTaskFields = (close: boolean) => {
        setPlatformValue('');
        setCmidValue('');
        setWalletValue('');
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
                Add Task
            </CustomDialogTitle>
            <DialogContent>
                <div className="formControl justify-content-between" style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Platform*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomSelect
                                value={platformValue}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setPlatformValue(event.target.value)}
                                style={{ fontSize: '13px', height: '35px' }}
                            >
                                <MenuItem value={"CMV2"} style={{ fontSize: '13px' }}>CMV2</MenuItem>
                                <MenuItem value={"MEL"} style={{ fontSize: '13px' }}>MEL</MenuItem>
                            </CustomSelect>
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.06 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>CMID*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={cmidValue}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setCmidValue(event.target.value)}
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
                    <div style={{ flex: 0.06 }} />
                    <div style={{ flex: 0.2 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Qty*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomSelect
                                value={qtyValue}
                                onChange={(event: { target: { value: React.SetStateAction<number>; }; }) => setQtyValue(event.target.value)}
                                style={{ fontSize: '13px', height: '35px' }}
                            >
                                {[...Array.from(Array(10).keys())].filter(y => y > 0).map(x =>
                                    <MenuItem key={x} value={x} style={{ fontSize: '13px' }}>{x}</MenuItem>
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
                            addTask(platformValue, cmidValue, walletValue, qtyValue);
                            clearAddTaskFields(true);

                        } else {
                            setAlertTypeValue("error");
                            setAlertMessageValue("Empty wallet name or invalid private key! Please insert correctly.");
                            setShowAlert(true);
                        }
                    }} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>
                    Add Task
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
    const [rowId, setRowId] = React.useState("");
    const [platformValue, setPlatformValue] = React.useState("");
    const [cmidValue, setCmidValue] = React.useState("");
    const [walletValue, setWalletValue] = React.useState("");
    const [state, setState] = React.useState("");
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    useEffect(() => {
        setRowId(rowItem.id);
        setPlatformValue(rowItem.platform);
        setCmidValue(rowItem.cmid);
        setWalletValue(rowItem.walletId);
        setState(rowItem.state)
    }, [open]);

    const validateEditTask = () => {
        return platformValue !== "" && cmidValue !== "" && walletValue !== "";
    }

    const clearEditTaskFields = () => {
        setPlatformValue('');
        setCmidValue('');
        setWalletValue('');
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
                Edit Task
            </CustomDialogTitle>
            <DialogContent>
                <div className="formControl" style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 0.3 }}>
                        <CustomInputLabel title={undefined} style={undefined}>Platform*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomSelect
                                value={platformValue}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setPlatformValue(event.target.value)}
                                style={{ fontSize: '13px', height: '35px' }}
                            >
                                <MenuItem value={"CMV2"} style={{ fontSize: '13px' }}>CMV2</MenuItem>
                                <MenuItem value={"MEL"} style={{ fontSize: '13px' }}>MEL</MenuItem>
                            </CustomSelect>
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.05 }} />
                    <div style={{ flex: 0.3 }}>
                        <CustomInputLabel title={undefined} style={undefined}>CMID*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={cmidValue}
                                onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setCmidValue(event.target.value)}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.05 }} />
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
                            editTask(rowId, platformValue, cmidValue, walletValue, state);
                            clearEditTaskFields();
                        } else {
                            setAlertTypeValue("error");
                            setAlertMessageValue("Empty wallet name or invalid private key! Please insert correctly.");
                            setShowAlert(true);
                        }
                    }} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>
                    Edit Task
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

function TaskTable({ windowHeight, tasks, wallets, settings, openEditTask, duplicateTask, deleteTask }: { windowHeight: any, tasks: any, wallets: any, settings: any, openEditTask: any, duplicateTask: any, deleteTask: any }) {
    useEffect(() => {

    }, []);

    return (
        <React.Fragment>
            <TableContainer elevation={0} style={{ maxHeight: windowHeight - 270, backgroundColor: 'transparent' }} component={Paper}>
                <Table style={{ borderCollapse: 'separate', borderSpacing: '0px 5px' }}>
                    {tasks.length > 0 &&
                        <TableHead sx={{ backgroundColor: darkModePrimary }}>
                            <TableRow style={{ border: 0 }}>
                                <StyledTableCell>Platform</StyledTableCell>
                                <StyledTableCell>CMID</StyledTableCell>
                                <StyledTableCell>Wallet</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                                <StyledTableCell>Messages</StyledTableCell>
                                <StyledTableCell style={{ width: `20%` }}>Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                    }
                    <TableBody>
                        {tasks.map((row: { id?: any; platform: any; cmid: any; walletId: any; state: any }) => (
                            <OneTask
                                key={row.id}
                                wallets={wallets}
                                settings={settings}
                                openEditTask={openEditTask}
                                duplicateTask={duplicateTask}
                                deleteTask={deleteTask}
                                row={row}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    )
}

function OneTask({ wallets, settings, openEditTask, duplicateTask, deleteTask, row }: { wallets: any, settings: any, openEditTask: any, duplicateTask: any, deleteTask: any, row: { id?: any; platform: any; cmid: any; walletId: any, state: any } }) {
    const classes = useStyles();
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState<any>("");
    const [showAlert, setShowAlert] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const [isCounting, setIsCounting] = React.useState(false);
    const [countDate, setCountDate] = React.useState<any>(null);

    const [machineState, setMachineState] = React.useState<any>(null);
    const [status, setStatus] = React.useState(2);

    const [showTime, setShowTime] = React.useState(false);
    const [mintHour, setMintHour] = React.useState('');
    const [mintMinute, setMintMinute] = React.useState('');
    const [mintTime, setMintTime] = React.useState(0);
    const [mintCount, setMintCount] = React.useState(1);

    const [errorMsg, setErrorMsg] = React.useState(false);
    const [error, setError] = React.useState('');
    const showError = () => {
        setErrorMsg(true);
    };
    const closeError = () => {
        setErrorMsg(false);
    };

    const onShowSetTime = () => {
        setShowTime(true)
    }
    const onCloseSetTime = () => {
        setShowTime(false)
    }

    useEffect(() => {
        (async () => {
            let h = 0;
            let m = 0;
            if (mintHour && parseInt(mintHour, 10) != NaN) {
                h = parseInt(mintHour, 10);
            }
            if (mintMinute && parseInt(mintMinute, 10) != NaN) {
                m = parseInt(mintMinute, 10);
            }

            const t = h * 3600 * 1000 + m * 60 * 1000;
            setMintTime(t)
        })()
    }, [mintHour, mintMinute]);

    const renderCountdown = ({
        days,
        hours,
        minutes,
        seconds,
        completed,
    }: MintCountdownRender) => {
        if (completed) {
            return `Mint is started.`;
        } else {
            return (
                <>
                    {days < 10 ? `0${days}` : days} : {hours < 10 ? `0${hours}` : hours} : {minutes < 10 ? `0${minutes}` : minutes} : {seconds < 10 ? `0${seconds}` : seconds}
                </>
            );
        }
    };

    async function mintingToken(platform: any, candyMachineId: any, rpcUrl: any, isDevelopment: boolean, privateKey: any, mintCount: any) {

        try {
            const now = new Date().getTime();
            localStorage.setItem(`"${candyMachineId}"`, `"${candyMachineId}"`);
            switch (platform) {
                case 'CMV2':
                    const privateKeyAsBuffer = bs58.decode(privateKey);
                    const fromSecretKey = new Uint8Array(privateKeyAsBuffer);
                    let fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
                    const fromWallet = new anchor.Wallet(fromKeypair);
                    const candyMachine: any = await CandyMachine(fromWallet, candyMachineId, rpcUrl, isDevelopment);
                    console.log(`CM2 state`, candyMachine);
                    if (candyMachine !== null) {
                        if (!candyMachine.state.isSoldOut) {
                            if (candyMachine.state.isActive) {
                                const cmv2MintTokenResponse = await MintToken(candyMachineId, rpcUrl, isDevelopment, privateKey, mintCount);
                                return cmv2MintTokenResponse;
                            }
                            else {
                                if (candyMachine.state?.goLiveDate) {
                                    const dt = candyMachine.state.goLiveDate.toNumber() * 1000
                                    const remain = dt - new Date().getTime();
                                    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));
                                    console.log('remain', remain);
                                    if (remain > 0) {
                                        let t = dt;
                                        let d = remain;
                                        if (mintTime > 0) {
                                            t = new Date().getTime() + mintTime;
                                            d = mintTime;
                                        }
                                        setCountDate(t);
                                        setIsCounting(true);
                                        setLoading(false);

                                        await delay(d);
                                    }
                                }

                                setIsCounting(false);
                                setCountDate(null);
                                setLoading(true);

                                if (localStorage.getItem(`"${candyMachineId}"`)) {
                                    localStorage.removeItem(`${candyMachineId}`);
                                    const cmv2MintTokenResponse = await MintToken(candyMachineId, rpcUrl, isDevelopment, privateKey, mintCount);
                                    return cmv2MintTokenResponse;
                                }
                                else {
                                    return {
                                        state: -1,
                                        txn: null,
                                        msg: ``,
                                        status: 2,
                                        err: ``
                                    };
                                }
                            }
                        }
                        else {
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
                case 'MEL':
                    return await MintMEToken(candyMachineId, rpcUrl, privateKey, mintCount);
                    const meInfo = await scrapeMEInfo(candyMachineId);
                    //const temp: any = await CandyMachine(fromWallet, candyMachineId, rpcUrl, isDevelopment);
                    console.log(`candyMachine`);
                    return;
                    console.log(`meInfo`, meInfo);

                    if (!meInfo.state) {
                        return {
                            state: false,
                            txn: null,
                            msg: meInfo.data,
                            status: meInfo.status,
                            err: meInfo.data,
                        };
                    }
                    let launchDate = meInfo.data?.launchDate;
                    if (meInfo.data?.state?.stages && meInfo.data?.state?.stages.length > 0) {
                        let { [meInfo.data.state.stages.length - 1]: launch } = meInfo.data?.state?.stages;
                        launchDate = launch.startTime;
                    }

                    if (meInfo.state && launchDate) {
                        const remain = Date.parse(launchDate) - new Date().getTime();
                        const delay = (ms: any) => new Promise(res => setTimeout(res, ms));
                        console.log('remain', remain);
                        if (remain > 0) {
                            let t = Date.parse(launchDate);
                            let d = remain;
                            if (mintTime > 0) {
                                t = new Date().getTime() + mintTime;
                                d = mintTime;
                            }
                            setCountDate(t);
                            setIsCounting(true);
                            setLoading(false);

                            await delay(d);
                        }
                    }

                    setIsCounting(false);
                    setCountDate(null);
                    setLoading(true);

                    if (localStorage.getItem(`"${candyMachineId}"`)) {
                        localStorage.removeItem(`${candyMachineId}`);
                        return await MintMEToken(candyMachineId, rpcUrl, privateKey, mintCount);
                    }
                    else {
                        return {
                            state: -1,
                            txn: null,
                            msg: ``,
                            status: 2,
                            err: ``
                        };
                    }
                default:
                    return {
                        state: 0,
                        txn: null,
                        msg: `Invalid Platform. Please select platform correctly.`,
                        status: 2,
                        err: `Invalid Platform.`,
                    };
            }
        } catch (e) {
            console.log(`TasksSection.tsx -- mintToken error: ${e}`);
            return {
                state: false,
                txn: null,
                msg: `Mint failed, Please try again later.`,
                status: 2,
                err: `MintToken error: ${e}`
            };
        }
    }

    async function startTask(wallets: any[], settings: { rpcUrl: any; discordWebhookUrl: string; }, { platform, cmid, walletId }: any, mintCount: any) {
        const walletArray = wallets.filter((x: { id: any; }) => x.id === walletId);
        if (walletArray.length > 0) {
            const privateKeyFromWallet = walletArray[0].privateKey;

            try {
                const res = await mintingToken(platform, cmid, settings.rpcUrl, isDevelopment, privateKeyFromWallet, mintCount);
                //setError(res.err)
                // if (res.state == true) {
                //     console.log('mintToken success', res)
                //     const txn = res.txn ? res.txn : null;

                //     return {
                //         state: true,
                //         msg: `Mint successed, Please check your wallet.`,
                //         status: res.status
                //     };
                // }
                // else {
                //     console.log('mintToken error', res)
                //     if (res.state == -1) {
                //         return {
                //             state: -1,
                //             msg: res.msg,
                //             status: res.status
                //         };
                //     }
                //     else {
                //         return {
                //             state: false,
                //             msg: res.msg,
                //             status: res.status
                //         };
                //     }
                // }
                return {
                    state: false,
                    msg: `Mint Failed! Please retry again.`,
                    status: 2
                };
            }
            catch (err) {
                console.log('e', err)
                setError(`Mint failed. Error: ${err}`)
                return {
                    state: false,
                    msg: `Mint Failed! Please retry again.`,
                    status: 2
                };
            }
            finally {

            }

        } else {
            setError(`Wallet not found`)
            return {
                state: false,
                msg: `Wallet not found!`,
                status: 2
            };
        }
    }

    return (
        <StyledTableRow key={row.id} sx={{ backgroundColor: secondaryColor, border: 0 }}>
            <StyledTableCell>{row.platform}</StyledTableCell>
            <StyledTableCell>{row.cmid}</StyledTableCell>
            <StyledTableCell>{wallets.filter((x: { id: any; }) => x.id === row.walletId).length > 0 ? wallets.filter((x: { id: any; }) => x.id === row.walletId)[0].walletName : ''}</StyledTableCell>
            <StyledTableCell>
                <p
                    className={`${getStatus(status).color}`}
                >
                    {getStatus(status).text}
                </p>
            </StyledTableCell>
            <StyledTableCell>
                <p
                    style={{ cursor: `pointer` }}
                    onClick={() => {
                        if (error) {
                            showError()
                        }
                    }}
                >
                    {error ? <WysiwygIcon style={{ width: '20px', height: '20px' }} /> : `__`}
                </p>
                <CustomDialog
                    open={errorMsg}
                    onClose={() => closeError()}
                    style={{ width: '400px', border: `solid 1px white` }}
                >
                    <CustomDialogTitle
                        onClick={() => closeError()}
                    >
                        Error
                    </CustomDialogTitle>
                    <DialogContent>
                        <p style={{ color: darkModeSecondary }}>
                            {error}
                        </p>
                    </DialogContent>
                    <DialogActions>
                        <CustomButton onClick={() => closeError()} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>
                            Cancel
                        </CustomButton>
                    </DialogActions>
                </CustomDialog>
            </StyledTableCell>
            {wallets.filter((x: { id: any; }) => x.id === row.walletId).length > 0 &&
                <StyledTableCell style={{ width: `20%` }}>
                    {
                        !loading && isCounting && <>
                            <Countdown
                                date={countDate}
                                onComplete={() => {
                                    setCountDate(null);
                                    setIsCounting(false);
                                }}
                                renderer={renderCountdown}
                            />
                            <IconButton
                                onClick={() => {
                                    setCountDate(null);
                                    setIsCounting(false);
                                    if (localStorage.getItem(`"${row.cmid}"`)) {
                                        localStorage.removeItem(`"${row.cmid}"`);
                                    }
                                }}
                                color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary }}>
                                <HighlightOffIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                        </>
                    }
                    {
                        !loading && !isCounting && <>
                            <IconButton onClick={
                                async () => {
                                    setLoading(true);
                                    setCountDate(null);
                                    setIsCounting(false);
                                    const res = await startTask(wallets, settings, row, mintCount);
                                    if (res.state == false) {

                                    }
                                    else {
                                        setAlertTypeValue("error");
                                        if (res.state == true) {
                                            setAlertTypeValue("success");
                                        }
                                        setAlertMessageValue(res.msg ? res.msg : `Sorry, Unexpected error! Please try again later.`);
                                        setShowAlert(true);
                                    }
                                    setLoading(false);
                                    setStatus(res.status);
                                }
                            }
                                color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary, paddingLeft: 0 }}>
                                <PlayCircleOutlineIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                            <IconButton onClick={async () => openEditTask(row)} color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary }}>
                                <EditIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                            <IconButton onClick={async () => duplicateTask(row.id)} color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary }}>
                                <ContentCopyIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    onShowSetTime();
                                }}
                                color="inherit"
                                className={`notDraggable ${classes.actionButton}`}
                                style={{ color: lightModePrimary }}
                            >
                                <SettingsIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                            <IconButton onClick={() => deleteTask(row.id)} color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary }}>
                                <DeleteIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>

                            <CustomDialog
                                open={showTime}
                                onClose={() => onCloseSetTime()}
                                style={{ width: '600px', border: `solid 1px white` }}
                            >
                                <CustomDialogTitle
                                    onClick={() => onCloseSetTime()}
                                >
                                    Set Mint Time
                                </CustomDialogTitle>
                                <DialogContent>
                                    <div className="formControl justify-content-between" style={{ flex: 1, display: 'flex' }}>
                                        <div style={{ flex: 0.1 }} />
                                        <div style={{ flex: 0.2 }}>
                                            <CustomInputLabel title={undefined} style={undefined}>Mint Hours</CustomInputLabel>
                                            <CircularBorderDiv style={undefined}>
                                                <CustomTextField
                                                    value={mintHour}
                                                    onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setMintHour(event.target.value)}
                                                    style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                                            </CircularBorderDiv>
                                        </div>
                                        <div style={{ flex: 0.1 }} />
                                        <div style={{ flex: 0.2 }}>
                                            <CustomInputLabel title={undefined} style={undefined}>Mint Minutes</CustomInputLabel>
                                            <CircularBorderDiv style={undefined}>
                                                <CustomTextField
                                                    value={mintMinute}
                                                    onChange={(event: { target: { value: React.SetStateAction<string>; }; }) => setMintMinute(event.target.value)}
                                                    style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                                            </CircularBorderDiv>
                                        </div>
                                        <div style={{ flex: 0.2 }} />
                                        <div style={{ flex: 0.2 }}>
                                            <CustomInputLabel title={undefined} style={undefined}>Mint Counts</CustomInputLabel>
                                            <CircularBorderDiv style={undefined}>
                                                <CustomTextField
                                                    value={mintCount}
                                                    onChange={(event: { target: { value: string; }; }) => {
                                                        const parsed = parseInt(event.target.value);
                                                        const cnt = isNaN(parsed) ? 1 : parsed;
                                                        setMintCount(
                                                            cnt
                                                        )
                                                    }}
                                                    style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                                            </CircularBorderDiv>
                                        </div>
                                        <div style={{ flex: 0.1 }} />
                                    </div>
                                </DialogContent>
                                <DialogActions>
                                    <CustomButton onClick={() => onCloseSetTime()} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>Save</CustomButton>
                                </DialogActions>
                            </CustomDialog>
                        </>
                    }

                    {loading &&
                        <CircularProgress color="inherit" size={24} />
                    }

                    <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                        <Alert severity={alertTypeValue}>
                            {alertMessageValue}
                        </Alert>
                    </Snackbar>
                </StyledTableCell>
            }

            {wallets.filter((x: { id: any; }) => x.id === row.walletId).length < 1 &&
                <StyledTableCell style={{ width: `20%` }}>
                    {!loading &&
                        <IconButton onClick={() => deleteTask(row.id)} color="inherit" className={`notDraggable ${classes.actionButton}`} style={{ color: lightModePrimary, paddingLeft: 0 }}>
                            <DeleteIcon style={{ width: '20px', height: '20px' }} />
                        </IconButton>
                    }
                    {
                        loading &&
                        <CircularProgress color="inherit" size={24} />
                    }
                    <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                        <Alert severity={alertTypeValue}>
                            {alertMessageValue}
                        </Alert>
                    </Snackbar>
                </StyledTableCell>
            }

        </StyledTableRow>
    )
}

export default function TasksSection({ windowHeight }: { windowHeight: any }) {
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
        let tasksRawData = fs.readFileSync(tasksPath);
        let tasksJsonData = JSON.parse(tasksRawData.toString());
        setTasks(tasksJsonData);

        let walletsRawData = fs.readFileSync(walletsPath);
        let walletsJsonData = JSON.parse(walletsRawData.toString());
        setWallets(walletsJsonData);

        let settingsRawData = fs.readFileSync(settingsPath);
        let settingsJsonData = JSON.parse(settingsRawData.toString());
        setSettings(settingsJsonData);
    }, []);

    const addTask = (platformValue: any, cmidValue: any, walletValue: any, qtyValue: number) => {
        var updatedTasks = [];
        for (var i = 0; i < qtyValue; i++) {
            updatedTasks.push({
                id: createUniqueId(30),
                platform: platformValue,
                cmid: cmidValue,
                walletId: walletValue,
                state: "ready"
            });
        }
        updatedTasks = tasks.concat(updatedTasks);

        SaveTasksFile(JSON.stringify(updatedTasks));
        setTasks(updatedTasks);

        setAlertTypeValue("success");
        setAlertMessageValue("Adding new task is successed!");
        setShowAlert(true);
    }

    const openEditTask = (row: any) => {
        setEditRowItem(row);
        setEditTaskDialogOpen(true);
    }

    const editTask = (id: any, platformValue: any, cmidValue: any, walletValue: any, state: any) => {
        var rowItemIndex = tasks.findIndex((x => x.id === id));
        if (rowItemIndex > -1) {
            tasks[rowItemIndex] = {
                id,
                platform: platformValue,
                cmid: cmidValue,
                walletId: walletValue,
                state: state
            }

            SaveTasksFile(JSON.stringify(tasks));
            setTasks(tasks);

            setAlertTypeValue("success");
            setAlertMessageValue("The task is edited successfully.");
        } else {
            setAlertTypeValue("error");
            setAlertMessageValue("Editing task is failed. Please try again.");
        }
        setShowAlert(true);
    }

    const duplicateTask = (id: any) => {
        var rowItemIndex = tasks.findIndex((x => x.id === id));
        if (rowItemIndex > -1) {
            var taskToDuplicate = { ...tasks[rowItemIndex] };
            taskToDuplicate.id = createUniqueId(30);
            console.log(`taskToDuplicate: ${JSON.stringify(taskToDuplicate)}`)
            const updatedTasks = tasks.concat([taskToDuplicate]);

            SaveTasksFile(JSON.stringify(updatedTasks));
            setTasks(updatedTasks);

            setAlertTypeValue("success");
            setAlertMessageValue("Task is duplicated successfully.");
        } else {
            setAlertTypeValue("error");
            setAlertMessageValue("Duplicating task is failed. Plese try again.");
        }
        setShowAlert(true);
    };

    const deleteTask = (id: any) => {
        var updatedTasks = tasks.filter(x => x.id != id);
        SaveTasksFile(JSON.stringify(updatedTasks));
        setTasks(updatedTasks);

        setAlertTypeValue("success");
        setAlertMessageValue("Task is deleted successfully.");
        setShowAlert(true);
    }

    return (
        <React.Fragment>
            <AppBar elevation={0} position="static" style={{ backgroundColor: darkModePrimary, marginBottom: '15px' }}>
                <Toolbar style={{ paddingLeft: '0px' }}>
                    <div style={{ flexDirection: 'column', display: 'flex' }}>
                        <Typography variant={'h4'}>Tasks</Typography>
                    </div>
                    <Grid item xs />
                    {/* <Tooltip title="Test">
                        <IconButton
                            onClick={async () => {
                                const medetails = await ME_AccountInfo();

                                console.log(medetails.status);

                                console.log(`metdetails: ${JSON.stringify(medetails)}`);
                            }}
                            color="inherit"
                            className="notDraggable"
                            style={{ color: darkModeSecondary }}
                        >
                            <AddCircleOutlineIcon />
                        </IconButton>
                    </Tooltip> */}
                    <Tooltip title="Add Task">
                        <IconButton onClick={() => setAddTaskDialogOpen(true)} color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                            <AddCircleOutlineIcon className={`${classes.actionButton}`} />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Divider style={{ backgroundColor: secondaryColor, height: '2px' }} />
                <Typography component={'span'} style={{ fontSize: '13px', marginLeft: '10px' }}>{tasks.length} Total</Typography>
            </AppBar>
            <TaskTable windowHeight={windowHeight} tasks={tasks} wallets={wallets} settings={settings} openEditTask={(row: any) => openEditTask(row)} duplicateTask={(id: any) => duplicateTask(id)} deleteTask={(id: any) => deleteTask(id)} />
            <AddTaskDialog open={addTaskDialogOpen} wallets={wallets} onClose={() => { setAddTaskDialogOpen(false) }} addTask={(platformValue: any, cmidValue: any, walletValue: any, qtyValue: any) => addTask(platformValue, cmidValue, walletValue, qtyValue)} />
            <EditTaskDialog open={editTaskDialogOpen} wallets={wallets} rowItem={editRowItem} onClose={() => { setEditTaskDialogOpen(false) }} editTask={(id: any, platformValue: any, cmidValue: any, walletValue: any, state: any) => editTask(id, platformValue, cmidValue, walletValue, state)} />
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </React.Fragment>
    )
}