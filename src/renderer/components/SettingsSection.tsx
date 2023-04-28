import React, { useState, useEffect, useRef } from 'react';
import * as fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import moment from 'moment';
import { CircularBorderDiv, CustomButton, CustomInputLabel, CustomTextField } from './helper/CustomHtml';
import { Alert, AppBar, Divider, DialogActions, DialogContent, FormHelperText, Grid, IconButton, Paper, Snackbar, Toolbar, Tooltip, Typography } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { createWebhookMessage } from './helper/Discord';

import {
    darkModePrimary,
    darkModeSecondary,
    lightModePrimary,
    lightModeSecondary,
    secondaryColor
} from './helper/Constants';

const isDevelopment = process.env.NODE_ENV !== 'production'
var settingsPath = '';
if (isDevelopment) {
    settingsPath = path.resolve('./', 'settings.json');
} else {
    settingsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/settings.json' : `${process.env.APPDATA}\\Hades\\settings.json`;
}

if (!fs.existsSync(settingsPath)) {
    fs.writeFile(settingsPath, '{}', function (err) {
        if (err) throw err;
    });
}

function SaveSettingsFile(settings: string) {
    fs.writeFile(settingsPath, settings, function (err) {
        if (err) throw err;
    });
}

export default function SettingsSection() {
    const [settings, setSettings] = React.useState({} as any);
    const [rpcUrlValue, setRpcUrlValue] = React.useState("");
    const [discordWebhookValue, setDiscordWebhookValue] = React.useState("");
    const [showAlert, setShowAlert] = React.useState(false);
    const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
    const [alertMessageValue, setAlertMessageValue] = React.useState("");

    useEffect(() => {
        let settingsRawData = fs.readFileSync(settingsPath);
        let settingsJsonData = JSON.parse(settingsRawData.toString());
        setSettings(settingsJsonData);

        setRpcUrlValue(settingsJsonData.rpcUrl);
        setDiscordWebhookValue(settingsJsonData.discordWebhookUrl);
    }, []);

    const updateRpcUrlValue = () => {
        settings.rpcUrl = rpcUrlValue;
        const updatedSettings = settings;

        saveSettings(updatedSettings);
        setShowAlert(true);
        setAlertMessageValue('Changing RPC Url is successed.')
    }

    const updateDiscordWebhookValue = (discordWebhookUrl: any) => {
        settings.discordWebhookUrl = discordWebhookUrl;
        const updatedSettings = settings;

        saveSettings(updatedSettings);
    }

    const saveSettings = (settings: any) => {
        SaveSettingsFile(JSON.stringify(settings));
        setSettings(settings);
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

            <Grid container direction="row" justifyContent="center" alignItems="center" spacing={3}>
                <Grid item md={1}></Grid>

                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary }}>
                        RPC Url
                    </Typography>
                </Grid>

                <Grid item md={6}>
                    <CircularBorderDiv style={undefined}>
                        <CustomTextField
                            value={rpcUrlValue}
                            onChange={(event: { target: { value: any; }; }) => {
                                setRpcUrlValue(event.target.value);
                            }}
                            onKeyPress={undefined}
                            style={undefined}
                            onBlur={(event: { target: { value: any; }; }) => {
                                setRpcUrlValue(event.target.value);
                            }}
                            startAdornment={undefined}
                            endAdornment={undefined}
                            disabled={false}
                        />
                    </CircularBorderDiv>
                </Grid>

                <Grid item md={2}>
                    <CustomButton
                        onClick={() => {
                            updateRpcUrlValue();
                        }}
                        variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined}
                        className={undefined}
                    >
                        Change Rpc url
                    </CustomButton>
                </Grid>

                <Grid item md={1}></Grid>

                <Grid item md={1}></Grid>

                <Grid item md={2}>
                    <Typography variant="h6" sx={{ color: darkModeSecondary }}>
                        Discord Webhook
                    </Typography>
                </Grid>

                <Grid item md={6}>
                    <CircularBorderDiv style={undefined}>
                        <CustomTextField
                            value={discordWebhookValue}
                            onChange={(event: { target: { value: any; }; }) => setDiscordWebhookValue(event.target.value)}
                            onBlur={(event: { target: { value: any; }; }) => updateDiscordWebhookValue(event.target.value)}
                            style={{ fontSize: '13px' }}
                            maxLength={500} onKeyPress={undefined} startAdornment={undefined} endAdornment={undefined} disabled={undefined} />
                    </CircularBorderDiv>
                </Grid>

                <Grid item md={2}>
                    <CustomButton
                        onClick={async () => {
                            try {
                                const res = await createWebhookMessage('Test Webhook', [], '', '#FFFFFF', discordWebhookValue);

                                if (res) {
                                    setAlertTypeValue("success");
                                    setAlertMessageValue("Webhook testing... Please wait.");
                                } else {
                                    setAlertTypeValue("error");
                                    setAlertMessageValue("Error sending webhook. Please confirm webhook url.");
                                }
                            }
                            catch {
                                setAlertTypeValue("error");
                                setAlertMessageValue("Error sending webhook. Please confirm webhook url.");
                            }
                            finally {
                                setShowAlert(true);
                            }
                        }}
                        variant={undefined} width={undefined} height={undefined} fontSize={undefined} style={undefined}
                        className={undefined}
                    >
                        Test Webhook
                    </CustomButton>
                </Grid>

                <Grid item md={1}></Grid>
            </Grid>

            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert elevation={6} variant='filled' color={alertTypeValue}>
                    {alertMessageValue}
                </Alert>
            </Snackbar>
        </>

    )
}