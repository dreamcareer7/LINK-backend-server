const axios = require('axios');
const config = require('../config');
const Logger = require('../services/logger');

/**
 * generate linkedIn access token when clien is logged in with linnkedIn
 */
const genLinkedInAccessToken = async (code, redirectUri) => {
    try {
        let data = {
            method: 'POST',
            url: `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}&client_id=${config.linkedIn.clientId}&client_secret=${config.linkedIn.clientSecret}`,

            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };
        console.log('DATA::', data);
        let response = await axios(data);

        return response.data.access_token;
    } catch (e) {
        Logger.log.error('Error in Generate access token from linkedin', e || e);
        return Promise.reject({ message: 'Error in Generate access token from linkedin' });
    }
};
/**
 * get linkedIn User data
 */
const getLinkedInUserData = async (token) => {
    try {
        let data = {
            method: 'GET',
            url: `https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams),firstName,lastName,localizedFirstName,localizedLastName)`,

            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        let response = await axios(data);

        return response.data;
    } catch (e) {
        Logger.log.error('Error in get LinkedIn User Data', e.message || e);
        return Promise.reject({ message: 'Error in get LinkedIn User Data' });
    }
};
/**
 * get linkedIn User data
 */
const getContactInfo = async (token) => {
    try {
        let data = {
            method: 'GET',
            url: `https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        let response = await axios(data);
        let responseObj = {};
        if (response.data && response.data.elements.length !== 0) {
            response.data.elements.forEach((element) => {
                if (element.type === 'EMAIL' && element['handle~'] && element['handle~'].emailAddress) {
                    responseObj.email = element['handle~'].emailAddress;
                } else if (
                    element.type === 'PHONE' &&
                    element['handle~'] &&
                    element['handle~'].phoneNumber &&
                    element['handle~'].phoneNumber.number
                ) {
                    responseObj.phone = element['handle~'].phoneNumber.number;
                }
            });
        }
        return responseObj;
    } catch (e) {
        Logger.log.error('Error in get LinkedIn User Data', e.message || e);
        return Promise.reject({ message: 'Error in get LinkedIn User Data' });
    }
};

module.exports = {
    genLinkedInAccessToken,
    getLinkedInUserData,
    getContactInfo,
};
