import axios from 'axios';
import { getHWID } from 'hwid';

import { apiKey, hyperLicenseUrl, hadesPlanId } from './Constants'
const HWID = getHWID();

export const getLicense = async (license: string) => {
    return axios.get(`${hyperLicenseUrl}${license}`,
        { headers: { Authorization: `Bearer ${apiKey}` } })
        .then((response) => response.data)
        .catch(() => null);
}

export const updateLicense = async (license: string) => {
    return axios.patch(`${hyperLicenseUrl}${license}`, {
        metadata: { HWID },
    }, {
        headers: { Authorization: `Bearer ${apiKey}` },
    })
        .then((response) => response.data)
        .catch(() => null);
}

export const validateLicense = async (license: string) => {
    const licenseData = await getLicense(license);
    console.log(licenseData);
    if (licenseData) {
        if (!licenseData.metadata?.hwid || licenseData.metadata?.hwid == HWID) {

            const res = await updateLicense(license);
            if (res) {
                return true;
            }
        }
        return false;
    }

    return false;
}