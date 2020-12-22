const getModifyCookie = (cookie) => {
    let cookieArr = cookie.split(' ');
    let str = '';
    for (let i = 0; i < cookieArr.length; i++) {
        if (cookieArr[i].includes('bscookie') || cookieArr[i].includes('queryString')) {
            cookieArr.splice(i, 1);
        }
    }
    for (let i = 0; i < cookieArr.length; i++) {
        str = str + cookieArr[i];
    }
    return str;
};

module.exports = {
    getModifyCookie,
};
