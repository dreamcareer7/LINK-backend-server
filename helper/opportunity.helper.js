const axios = require('axios');
const config = require('../config');
const Logger = require('../services/logger');

/**
 * get linkedIn profile for adding opportunity
 */

const getProfile = async (publicIdentifier, cookie, ajaxToken) => {
    try {
        console.log('publicIdentifier::', publicIdentifier);
        let data = {
            method: 'GET',
            url: `https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${publicIdentifier}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-57`,

            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                authority: 'www.linkedin.com',
                accept: 'application/vnd.linkedin.normalized+json+2.1',
                'csrf-token': ajaxToken,
                'x-restli-protocol-version': '2.0.0',
                'x-li-lang': 'en_US',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
                'x-li-page-instance': 'urn:li:page:d_flagship3_profile_view_base;Wa/6jsvLSQSDY9I4sOA3Zg==',
                'x-li-track':
                    '{"clientVersion":"1.7.6692","mpVersion":"1.7.6692","osName":"web","timezoneOffset":5.5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: 'https://www.linkedin.com/mynetwork/invite-connect/connections/',
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };
        console.log('Making an API Call..');
        let response = await axios(data);
        console.log('Received the response..');
        let p;
        console.log('response::', JSON.stringify(response.data, null, 3));
        let companyArr = [];
        let location = '';
        for (let i = 0; i < response.data.included.length; i++) {
            if (
                response.data.included[i].hasOwnProperty('firstName') &&
                response.data.included[i]['$recipeTypes'] &&
                response.data.included[i]['$recipeTypes'].indexOf(
                    'com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities',
                ) !== -1
            ) {
                p = i;
            }
            if (
                response.data.included[i].hasOwnProperty('multiLocaleTitle') &&
                response.data.included[i].hasOwnProperty('dateRange') &&
                response.data.included[i].dateRange != null
            ) {
                companyArr.push(response.data.included[i]);
            }
            if (
                response.data.included[i].hasOwnProperty('defaultLocalizedName') &&
                response.data.included[i]['$recipeTypes'] &&
                response.data.included[i]['$recipeTypes'].indexOf(
                    'com.linkedin.voyager.dash.deco.identity.profile.Geo',
                ) !== -1
            ) {
                location = response.data.included[i].defaultLocalizedName;
                // console.log('location captured::', response.data.included[i])
            }
        }

        let months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        companyArr.sort((a, b) => {
            if (a.dateRange.start.year !== b.dateRange.start.year) {
                return b.dateRange.start.year - a.dateRange.start.year;
            } else {
                return months.indexOf(b.dateRange.start.month) - months.indexOf(a.dateRange.start.month);
            }
        });
        response = {
            firstName: response.data.included[p].firstName,
            lastName: response.data.included[p].lastName,
            title: response.data.included[p].headline ? response.data.included[p].headline : null,
            companyName: companyArr.length > 0 ? companyArr[0].companyName : null,
            location: location,
            linkedInUrl: 'https://www.linkedin.com/in/' + response.data.included[p].publicIdentifier,
            email: null,
            profilePicUrl: response.data.included[p].profilePicture
                ? response.data.included[p].profilePicture.displayImageReference.vectorImage.rootUrl +
                  response.data.included[p].profilePicture.displayImageReference.vectorImage.artifacts[3]
                      .fileIdentifyingUrlPathSegment
                : null,
            publicIdentifier: response.data.included[p].publicIdentifier,
        };
        console.log('response::::', response);
        return response;
    } catch (e) {
        Logger.log.error('Error in Get Profile from linkedin', e.message || e);
        return Promise.reject({ message: 'Error in Get Profile from linkedin' });
    }
};

const getContactInfo = async (publicIdentifier, cookie, ajaxToken) => {
    try {
        console.log('publicIdentifier::', publicIdentifier);
        let data = {
            method: 'GET',
            // url: `https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${publicIdentifier}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-57`,
            url: `https://www.linkedin.com/voyager/api/identity/profiles/${publicIdentifier}/profileContactInfo`,

            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                authority: 'www.linkedin.com',
                accept: 'application/vnd.linkedin.normalized+json+2.1',
                'csrf-token': ajaxToken,
                'x-restli-protocol-version': '2.0.0',
                'x-li-lang': 'en_US',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
                'x-li-page-instance': 'urn:li:page:d_flagship3_profile_view_base;Wa/6jsvLSQSDY9I4sOA3Zg==',
                'x-li-track':
                    '{"clientVersion":"1.7.6692","mpVersion":"1.7.6692","osName":"web","timezoneOffset":5.5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":1,"displayWidth":1920,"displayHeight":1080}',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                referer: 'https://www.linkedin.com/mynetwork/invite-connect/connections/',
                'accept-language': 'en-US,en;q=0.9',
                cookie: cookie,
            },
        };

        let response = await axios(data);
        // console.log('response::::', response);

        let responseObj = {};
        if (response.data.data.emailAddress) {
            responseObj['email'] = response.data.data.emailAddress;
        }
        if (
            response.data.data.phoneNumbers &&
            response.data.data.phoneNumbers.length !== 0 &&
            response.data.data.phoneNumbers[0].number
        ) {
            responseObj['phone'] = response.data.data.phoneNumbers[0].number;
        }
        // console.log('responseObj::::', responseObj);
        return responseObj;
    } catch (e) {
        Logger.log.error('Error in Get Contact Profile from linkedin', e.message || e);
        return Promise.reject({ message: 'Error in Get Contact Profile from linkedin' });
    }
};

module.exports = {
    getProfile: getProfile,
    getContactInfo,
};
