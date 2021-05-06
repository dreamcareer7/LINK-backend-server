/**
 *
 * extract only required fields of cookie
 */

const getModifyCookie = (cookieObj) => {
    let cookieStr = '';
    let ajaxToken = '';
    Object.keys(cookieObj).forEach((cookieKey) => {
        if (cookieKey === 'JSESSIONID') {
            ajaxToken = cookieObj[cookieKey].value;
            ajaxToken = ajaxToken.replace(/"/g, '');
        }
        cookieStr += cookieKey + '=' + cookieObj[cookieKey].value + '; ';
    });
    cookieStr = cookieStr.substr(0, cookieStr.length - 2);
    console.log('AJAX::', ajaxToken);
    console.log('cookieStr::', cookieStr);
    // for (let i = 0; i < cookieArr.length; i++) {
    //     if (
    //         cookieArr[i].includes('li_sugr') ||
    //         cookieArr[i].includes('li_rm') ||
    //         cookieArr[i].includes('li_oatml') ||
    //         cookieArr[i].includes('JSESSIONID') ||
    //         cookieArr[i].includes('lidc') ||
    //         cookieArr[i].includes('li_at') ||
    //         cookieArr[i].includes('liap') ||
    //         cookieArr[i].includes('lang') ||
    //         cookieArr[i].includes('lissc')
    //     ) {
    //         if (cookieArr[i].includes('JSESSIONID')) {
    //             if (!cookieStr.includes('JSESSIONID')) {
    //                 cookieStr = cookieStr + cookieArr[i] + ';';
    //                 let temp = cookieArr[i].split('=').pop();
    //                 temp = temp.replace(';', '');
    //                 temp = temp.replace(/"/g, '');
    //                 ajaxToken = temp;
    //             }
    //             continue;
    //         } else {
    //             cookieStr = cookieStr + cookieArr[i] + ';';
    //         }
    //     }
    // }

    return {
        cookieStr,
        ajaxToken,
    };
};

module.exports = {
    getModifyCookie,
};
