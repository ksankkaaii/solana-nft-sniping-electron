import { IconButton, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { withStyles, makeStyles, createStyles } from '@mui/styles';
import { Box } from '@mui/system';
import React, { useState } from 'react';
import { darkModePrimary, darkModeSecondary, secondaryColor, thirdColor, twitterUrl, websiteUrl } from './helper/Constants';
import QueueIcon from '@mui/icons-material/QueueOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/LanguageOutlined';
import TasksSection from './TasksSection';
import SniperSection from './SniperSection';
import MultiSniperSection from './MultiSniperSection';
import WalletSection from './WalletSection';
import SettingsSection from './SettingsSection';
const { ipcRenderer, shell } = window.require('electron');

const MuiTabs = withStyles({
    root: {
        width: '225px'
    }
})(Tabs);

const useStyles = makeStyles(() =>
    createStyles({
        root: {},
        tabStyle: {
            alignItems: `flex-start`,
            '&:hover': {
                textShadow: `0px 0px 4px white`
            }
        },
        socialIcon: {
            transition: `all .3s`,
            '&:hover': {
                transform: `scale(1.2)`
            }
        }
    })
);

function TabPanel(props: any) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{ width: '100%' }}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography component={'span'}>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function GetTabName(value: any) {
    switch (value) {
        case 0:
            return "Tasks";
        case 1:
            return "Sniper";
        case 2:
            return "Wallets";
        case 3:
            return "Settings";
        default:
            return "";
    }
}

export default function TabSection({ windowHeight, setTabName }: { windowHeight: any, setTabName: any }) {
    const [headerTabsValue, setHeaderTabsValue] = useState(1);
    const classes = useStyles();
    return (
        <Box
            sx={{ flexGrow: 1, display: 'flex', height: windowHeight - 80, backgroundColor: darkModePrimary }}
        >
            <MuiTabs
                value={headerTabsValue}
                onChange={(event: any, newValue: any) => {
                    setHeaderTabsValue(newValue)
                    setTabName(GetTabName(newValue));
                }}
                TabIndicatorProps={{
                    style: {
                        backgroundColor: 'transparent'
                    }
                }}
                className="notDraggable"
                variant="scrollable"
                orientation="vertical"
                sx={{ borderRight: 0, borderColor: 'divider', backgroundColor: secondaryColor, borderRadius: '8px', margin: '15px' }}
            >
                <Tab
                    className={`${classes.tabStyle}`}
                    label={
                        <div className={`d-flex align-items-center justify-content-between`} style={{ textTransform: 'none', color: headerTabsValue === 0 ? thirdColor : darkModeSecondary }}>
                            <QueueIcon style={{ verticalAlign: 'middle' }} />
                            <Typography variant='h6' component={`span`} className={`ml-8`}>Tasks</Typography>
                        </div>}
                    style={{ color: darkModeSecondary }}
                />
                <Tab
                    className={`${classes.tabStyle}`}
                    label={<div className={`d-flex align-items-center justify-content-between`} style={{ textTransform: 'none', color: headerTabsValue === 1 ? thirdColor : darkModeSecondary }}>
                        <ModeStandbyIcon style={{ verticalAlign: 'middle' }} />
                        <Typography variant='h6' component={`span`} className={`ml-8`}>Sniper</Typography>
                    </div>}
                    style={{ color: darkModeSecondary }} />
                <Tab
                    className={`${classes.tabStyle}`}
                    label={<div className={`d-flex align-items-center justify-content-between`} style={{ textTransform: 'none', color: headerTabsValue === 2 ? thirdColor : darkModeSecondary }}>
                        <AccountBalanceWalletIcon style={{ verticalAlign: 'middle' }} />
                        <Typography variant='h6' component={`span`} className={`ml-8`}>Wallets</Typography>
                    </div>}
                    style={{ color: darkModeSecondary }} />
                <Tab
                    className={`${classes.tabStyle}`}
                    label={<div className={`d-flex align-items-center justify-content-between`} style={{ textTransform: 'none', color: headerTabsValue === 3 ? thirdColor : darkModeSecondary }}>
                        <SettingsIcon style={{ verticalAlign: 'middle' }} />
                        <Typography variant='h6' component={`span`} className={`ml-8`}>Settings</Typography>
                    </div>}
                    style={{ color: darkModeSecondary }} />
                <div style={{ height: windowHeight - 320 }} />
                <div style={{ textAlign: 'center' }}>
                    <Tooltip title="Twitter">
                        <IconButton onClick={() => shell.openExternal(twitterUrl)} color="inherit" className="notDraggable" style={{ color: darkModeSecondary }}>
                            <TwitterIcon style={{ width: '20px', height: '20px' }} className={`${classes.socialIcon}`} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Website">
                        <IconButton onClick={() => shell.openExternal(websiteUrl)} color="inherit" className="notDraggable" style={{ color: darkModeSecondary, marginRight: '10px' }}>
                            <LanguageIcon style={{ width: '20px', height: '20px' }} className={`${classes.socialIcon}`} />
                        </IconButton>
                    </Tooltip>
                </div>
            </MuiTabs>
            <TabPanel value={headerTabsValue} index={0}>
                <TasksSection windowHeight={windowHeight} />
            </TabPanel>
            <TabPanel value={headerTabsValue} index={1}>
                <MultiSniperSection windowHeight={windowHeight} />
            </TabPanel>
            <TabPanel value={headerTabsValue} index={2}>
                <WalletSection />
            </TabPanel>
            <TabPanel value={headerTabsValue} index={3}>
                <SettingsSection />
            </TabPanel>
        </Box>
    )
}