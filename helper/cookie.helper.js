// const getModifyCookie = (cookie) => {
//     let cookieArr = cookie.split(' ');
//     let str = '';
//     for (let i = 0; i < cookieArr.length; i++) {
//         if (cookieArr[i].includes('bscookie') || cookieArr[i].includes('queryString')) {
//             cookieArr.splice(i, 1);
//         }
//     }
//     for (let i = 0; i < cookieArr.length; i++) {
//         str = str + cookieArr[i];
//     }
//     console.log(str);
//     return str;
// };

/**
 *
 * extract only required fields of cookie
 */

const getModifyCookie = (cookie) => {
    let cookieArr = cookie.split(' ');
    let cookieStr = '';
    let ajaxToken;
    for (let i = 0; i < cookieArr.length; i++) {
        if (
            cookieArr[i].includes('li_sugr') ||
            cookieArr[i].includes('li_rm') ||
            cookieArr[i].includes('li_oatml') ||
            cookieArr[i].includes('JSESSIONID') ||
            cookieArr[i].includes('lidc') ||
            cookieArr[i].includes('li_at') ||
            cookieArr[i].includes('liap') ||
            cookieArr[i].includes('lang') ||
            cookieArr[i].includes('lissc')
        ) {
            if (cookieArr[i].includes('JSESSIONID')) {
                if (!cookieStr.includes('JSESSIONID')) {
                    cookieStr = cookieStr + cookieArr[i];
                    let temp = cookieArr[i].split('=').pop();
                    temp = temp.replace(';', '');
                    temp = temp.replace(/"/g, '');
                    // temp = temp[1].split(';');
                    // temp = temp[0].split('"');
                    ajaxToken = temp;
                }
                continue;
            } else {
                cookieStr = cookieStr + cookieArr[i];
            }
        }
    }
    return {
        cookieStr,
        ajaxToken,
    };
};

module.exports = {
    getModifyCookie,
};
