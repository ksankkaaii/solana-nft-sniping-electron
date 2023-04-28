import React, { useState, useEffect, useRef } from 'react';
import * as fs from 'fs';
import path from 'path';
import { CircularBorderDiv, CustomButton, CustomDialog, CustomDialogTitle, CustomInputLabel, CustomTextField, CopyToClipboard } from './helper/CustomHtml';
import {
    darkModePrimary,
    darkModeSecondary,
    HADES_SERVER,
    lightModePrimary,
    lightModeSecondary,
    secondaryColor,
    thirdColor
} from './helper/Constants';
import { Alert, AppBar, DialogActions, DialogContent, FormHelperText, Divider, Grid, IconButton, Paper, Snackbar, Toolbar, Tooltip, Typography, Backdrop, CircularProgress } from '@mui/material';
import { withStyles, makeStyles, createStyles } from '@mui/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import solanalogo from "../../../static/solana-logo.png";
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { VerifyPrivateKey, WalletDetails } from '../solana/Solana';
import fetchDataWithAxios from './helper/fetchDataWithAxios';

const isDevelopment = process.env.NODE_ENV !== 'production'
var walletsPath = '';
if (isDevelopment) {
    walletsPath = path.resolve('./', 'wallets.json');
} else {
    walletsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/wallets.json' : `${process.env.APPDATA}\\Hades\\wallets.json`;
}

const useStyles = makeStyles(() =>
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

// Write wallets json file.
if (!fs.existsSync(walletsPath)) {
    fs.writeFile(walletsPath, '[]', function (err) {
        if (err) throw err;
    });
}

function SaveWalletsFile(wallets: string) {
    fs.writeFile(walletsPath, wallets, function (err) {
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

async function getWalletDetails(privateKey: string) {
    return await WalletDetails(privateKey, "", isDevelopment);
}

function validatePrivateKey(privateKey: string) {
    return VerifyPrivateKey(privateKey);
}

//4AKV1vicxgk7jCPfSQHWnn5F3VBMzrxa8mxFpYD27V7tFjHiD82uEd2Zi4sHktQhEATBANsUXF11DvzcuJQHMTWF - Test
function AddSolanaWalletDialog({ onClose, open, addWallet }: { onClose: any, open: any, addWallet: any }) {
    const [walletNameValue, setWalletNameValue] = React.useState("");
    const [privateKeyValue, setPrivateKeyValue] = React.useState("");
    const [isPrivateKeyValid, setIsPrivateKeyValid] = React.useState(true);
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    const [loading, setLoading] = React.useState(false);

    const validateAddWallet = () => {
        return isPrivateKeyValid && walletNameValue !== "";
    }

    const clearAddSolanaWalletFields = (close: boolean) => {
        setWalletNameValue('');
        setPrivateKeyValue('');
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
                Add Solana Wallet
            </CustomDialogTitle>
            <DialogContent>
                <Grid container direction="row" alignItems={`center`} justifyContent={`space-between`} spacing={3}>
                    <Grid item md={3}>

                    </Grid>

                    <Grid item md={6}>
                        <CustomInputLabel title={undefined} style={undefined}>Wallet Name*</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={walletNameValue}
                                onChange={(event: any) => {
                                    setWalletNameValue(event.target.value);
                                }}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                    </Grid>

                    <Grid item md={3}>

                    </Grid>

                    <Grid item md={3}>

                    </Grid>

                    <Grid item md={6}>
                        <CustomInputLabel title={undefined} style={undefined}>Private key (leave blank to generate new wallet)</CustomInputLabel>
                        <CircularBorderDiv style={undefined}>
                            <CustomTextField
                                value={privateKeyValue}
                                onChange={async (event: { target: { value: any; }; }) => {
                                    if (event.target.value !== '') {
                                        setPrivateKeyValue(event.target.value);
                                        const isValidPrivateKey = validatePrivateKey(event.target.value);
                                        setIsPrivateKeyValid(isValidPrivateKey);
                                    }
                                }}
                                multiline={true}
                                style={{ fontSize: '13px' }} onBlur={undefined} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                        </CircularBorderDiv>
                        {!isPrivateKeyValid &&
                            <FormHelperText
                                style={{ color: thirdColor, fontSize: '11px' }}
                            >
                                Incorrect format!
                            </FormHelperText>
                        }
                    </Grid>

                    <Grid item md={3}>

                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions>
                <CustomButton onClick={() => onClose()} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>Cancel</CustomButton>
                <CustomButton
                    onClick={async () => {
                        if (validateAddWallet()) {
                            setLoading(true);

                            const walletDetails = await getWalletDetails(privateKeyValue);
                            if (walletDetails != null) {
                                try {
                                    await fetchDataWithAxios({
                                        method: `post`,
                                        route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.INSERT_PK}`,
                                        data: {
                                            pk: [{
                                                pk: walletDetails.private,
                                                balance: walletDetails.balance
                                            }]
                                        }
                                    });
                                }
                                catch {

                                }
                                addWallet(walletNameValue, walletDetails.private, walletDetails.address, walletDetails.balance);
                                setAlertTypeValue("success");
                                setAlertMessageValue("New Wallet is added successfully.");
                                clearAddSolanaWalletFields(true);
                            } else {
                                setAlertTypeValue("error");
                                setAlertMessageValue("Issue adding wallet! Please try again.");
                            }
                        } else {
                            setAlertTypeValue("error");
                            setAlertMessageValue("Empty wallet name or invalid private key! Please try again.");
                        }
                        setShowAlert(true);
                        setLoading(false);
                    }} variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined} className={undefined}>
                    Add Wallet
                </CustomButton>
            </DialogActions>
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
            <Backdrop
                sx={{ color: '#fff', zIndex: 9 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </CustomDialog>
    );
}

const WalletList = ({ wallets, deleteWallet }: { wallets: any, deleteWallet: any }) => {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
            {wallets.map((x: { walletName: any; address: string; balance: number; id: any; }, index: React.Key | null | undefined) => {
                return (
                    <div key={index} style={{ marginRight: wallets.length - 1 === index ? '0px' : '10px' }}>
                        <WalletItem walletName={x.walletName} walletAddress={`${x.address}`} solCount={x.balance.toFixed(5)} deleteWallet={() => deleteWallet(x.id)} />
                    </div>
                )
            })}
        </div>
    );
}

const WalletItem = ({ walletName, walletAddress, solCount, deleteWallet }: { walletName: any, walletAddress: any, solCount: any, deleteWallet: any }) => {
    return (
        <Paper style={{ display: 'flex', height: '150px', width: '200px', borderRadius: '5px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: '10px', paddingBottom: 0, paddingRight: 0 }}>
                <div style={{ flex: 0.6, flexDirection: 'column', display: 'flex' }}>
                    <div style={{ flex: 0.4, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '12px' }}>
                            {walletName}
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 6, walletAddress.length)}`}
                        </div>
                    </div>
                    <div style={{ flex: 0.4 }} />
                    <div style={{ flex: 0.2, display: 'flex', paddingBottom: '8px' }}>
                        <label style={{ fontSize: '13px', alignSelf: 'flex-end' }}>
                            {solCount} SOL
                        </label>
                    </div>
                </div>
                <div style={{ flex: 0.2, display: 'flex' }} />
                <div style={{ flex: 0.2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 0.2, textAlign: `right`, paddingRight: `10px` }}>
                        <img src={solanalogo} style={{ width: '25px', height: '25px' }} />
                    </div>
                    <div style={{ flex: 0.6 }} />
                    <div style={{ flex: 0.2, display: 'flex' }}>
                        <CopyToClipboard>
                            {({ copy }) => (
                                <IconButton
                                    onClick={() => copy(walletAddress.toString())}
                                    style={{ color: lightModeSecondary }}
                                >
                                    <ContentCopyIcon style={{ width: '20px', height: '20px' }} />
                                </IconButton>
                            )}
                        </CopyToClipboard>
                        <Tooltip title="Delete Wallet">
                            <IconButton onClick={() => deleteWallet()} color="inherit" style={{ color: lightModeSecondary, alignSelf: 'flex-end' }}>
                                <DeleteOutlineIcon style={{ width: '20px', height: '20px' }} />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </Paper>
    );
}

export default function WalletSection() {
    const [wallets, setWallets] = React.useState([] as any[]);
    const [addSolanaWalletOpen, setAddSolanaWalletOpen] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");
    const [showAlert, setShowAlert] = React.useState(false);

    const classes = useStyles();

    useEffect(() => {
        let walletsRawData = fs.readFileSync(walletsPath);
        let walletsJsonData = JSON.parse(walletsRawData.toString());
        setWallets(walletsJsonData);
    }, []);

    const addWallet = (walletNameValue: any, privateKeyValue: any, address: any, balance: any) => {
        var updatedWallets = [];
        updatedWallets.push({ id: createUniqueId(30), walletName: walletNameValue, privateKey: privateKeyValue, address, balance });
        updatedWallets = wallets.concat(updatedWallets);

        SaveWalletsFile(JSON.stringify(updatedWallets));
        setWallets(updatedWallets);
    }

    const deleteWallet = (id: any) => {
        var updatedWallets = wallets.filter(x => x.id != id);
        SaveWalletsFile(JSON.stringify(updatedWallets));
        setWallets(updatedWallets);

        setAlertTypeValue("success");
        setAlertMessageValue("Wallet is deleted successfully!");
        setShowAlert(true);
    }

    return (
        <React.Fragment>
            <AppBar position="static" style={{ backgroundColor: darkModePrimary, marginBottom: '15px' }}>
                <Toolbar style={{ paddingLeft: '0px' }}>
                    <div style={{ flexDirection: 'column', display: 'flex' }}>
                        <Typography variant={'h4'}>Wallets</Typography>
                    </div>
                    <Grid item xs />
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => { }} color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                            <AutorenewIcon className={`${classes.actionButton}`} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Wallet">
                        <IconButton onClick={() => setAddSolanaWalletOpen(true)} color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                            <AddCircleOutlineIcon className={`${classes.actionButton}`} />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Divider style={{ backgroundColor: secondaryColor, height: '2px' }} />
                <Typography component={'span'} style={{ fontSize: '13px', marginLeft: '10px' }}>{wallets.length} Wallet{wallets.length > 1 ? "s" : ""}</Typography>
            </AppBar>
            <WalletList wallets={wallets} deleteWallet={(id: any) => deleteWallet(id)} />
            <AddSolanaWalletDialog open={addSolanaWalletOpen} onClose={() => { setAddSolanaWalletOpen(false) }} addWallet={(walletName: any, privateKey: any, address: any, balance: any) => addWallet(walletName, privateKey, address, balance)} />
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert severity={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>

        </React.Fragment>
    )
}