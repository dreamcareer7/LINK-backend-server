const axios = require('axios');
const config = require('../config');
const Logger = require('../services/logger');

const genLinkedInAccessToken = async (code, redirectUri) => {
    try {
        let data = {
            method: 'POST',
            url: `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}&client_id=${config.linkedIn.clientId}&client_secret=${config.linkedIn.clientSecret}`,

            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        let response = await axios(data);

        return response.data.access_token;
    } catch (e) {
        Logger.log.error('Error in Generate access token from linkedin', e || e);
        return Promise.reject({ message: 'Error in Generate access token from linkedin' });
    }
};
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

module.exports = {
    genLinkedInAccessToken,
    getLinkedInUserData,
};
