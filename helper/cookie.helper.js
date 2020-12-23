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

const getModifyCookie = (cookie) => {
    let cookieArr = cookie.split(' ');
    let str = '';
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
            str = str + cookieArr[i];
        }
    }
    return str;
};

module.exports = {
    getModifyCookie,
};
