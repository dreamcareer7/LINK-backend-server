const axios = require('axios');
const config = require('../config');
const Logger = require('../services/logger');

const getProfile = async (publicIdentifier) => {
    try {
        let data = {
            method: 'GET',
            url: `https://www.linkedin.com/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${publicIdentifier}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-57`,

            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                authority: 'www.linkedin.com',
                accept: 'application/vnd.linkedin.normalized+json+2.1',
                'csrf-token': 'ajax:8109392671226615305',
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
                cookie:
                    'li_sugr=4360e205-af8e-476e-a4bf-a66d0ad0104e; lissc=1; bcookie="v=2&fe1ff459-e6b2-4809-8126-80713b628fa6"; bscookie="v=1&202007081901359d0b1b3e-ba88-4bfe-87ec-8b1c017ed79bAQFrY-n5yBzm_kdMJxGhyUYdWlVdMV-M"; _ga=GA1.2.927278425.1602579754; G_ENABLED_IDPS=google; JSESSIONID="ajax:8109392671226615305"; aam_uuid=46765176673855918082776637391170156299; VID=V_2020_11_23_07_768; _gac_UA-62256447-1=1.1606116171.CjwKCAiAtej9BRAvEiwA0UAWXn_ULBNJqHtQEaWRiTg4MWkMTADl9vcFgyIESXAizWsNVx6doOGlFhoCv1wQAvD_BwE; mbox=session#adc90bdf5e2d48a4b2bf6e27c7001554#1606118028|PC#adc90bdf5e2d48a4b2bf6e27c7001554.31_0#1621668172; li_rm=AQE2S3vmogex7gAAAXZLPYX0ER8AozslXVDO8rip6eOraMG1yUqNTz0fgjxu6Jwm4m5Ud4lhhJgxj7nL0OOxdD8xY6eswaHlwQhhzLM0U2GK5ed8vzs4YTwP; g_state={"i_p":1607671653393,"i_l":1}; li_at=AQEDASyE6I4EIeMdAAABdlE326EAAAF2dURfoU0AygSZ12KC68Dtp56YHsLtP_UENzLSTOwrHFY1MXYABkU1Klh1XvPlH3_CNcXRI9q3NmSoBPxqa23VltoPbNiWRQzaX5x-0Tyfrr4z5fiKfnwq3h5H; liap=true; lang=v=2&lang=en-us; spectroscopyId=88f9b1f7-c37b-431f-b294-854af4665de9; _gid=GA1.2.859846728.1607919814; AMCVS_14215E3D5995C57C0A495C55%40AdobeOrg=1; AMCV_14215E3D5995C57C0A495C55%40AdobeOrg=-637568504%7CMCIDTS%7C18611%7CMCMID%7C46233619651809596912758375341816890560%7CMCAAMLH-1608534376%7C12%7CMCAAMB-1608534376%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1607936776s%7CNONE%7CvVersion%7C5.1.1%7CMCCIDH%7C1792547547; UserMatchHistory=AQJ3jlLW9fZ1fgAAAXZgEkLXNWsVqeJq8oczk5GHskoslw7g3E7252bt9pER8qdyeBE0ra5LcpV2xU0Y2j30Vf-lQ7YKf1LA9xbHioanrOMXTKxWdR9kTjjnVkmIwW9cts9H4NSJ5V01LjMGxRkbFAI-fWg-lF90rFwC0yTbgGzYsoFCFT8Q7WXjWectHktQZ8mrQ9CnX2I3nauA0CkNMM7RI5qO7ZXxsbeIaLZ40kaVpInGjGwZmVptea7BRomVIyxy8_Oo6y__3kVCUfddHpSq4fhOVaFFeeou; li_oatml=AQHaJ3x1UK0YuwAAAXZgEkRyriFDo3wu60RwTWVObXYi4ch0uwHuuyOGI4d52z9M_A28vefTgZBqwNsIP7bwRGOQsE2Q8s96; lidc="b=VB90:s=V:r=V:g=2853:u=52:i=1607929582:t=1608013209:v=1:sig=AQGY6fd-WIb7ZWciEybjJH9wsTQrWlNU"',
            },
        };

        let response = await axios(data);
        let p;
        let c;
        for (let i = 0; i < response.data.included.length; i++) {
            if (response.data.included[i].hasOwnProperty('firstName')) {
                p = i;
            }
        }
        response = {
            firstName: response.data.included[p].firstName,
            lastName: response.data.included[p].lastName,
            title: response.data.included[p].headline,
            companyName: '',
            linkedInUrl: '',
            email: '',
            profilePicUrl:
                response.data.included[p].profilePicture.displayImageReference.vectorImage.rootUrl +
                response.data.included[p].profilePicture.displayImageReference.vectorImage.artifacts[3]
                    .fileIdentifyingUrlPathSegment,
            publicIdentifier: response.data.included[p].publicIdentifier,
        };
        console.log(response);
        return response;
    } catch (e) {
        Logger.log.error('Error in Get Profile from linkedin', e);
        return Promise.reject({ message: 'Error in Get Profile from linkedin' });
    }
};

module.exports = {
    getProfile,
};
