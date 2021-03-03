let getDealValueStr = (value) => {
    let valueStr = '';
    if (value < 1000) {
        valueStr = '$' + value.toFixed(0);
    } else if (value >= 1000 && value < 1000000) {
        value = value / 1000;
        valueStr = '$' + value.toFixed(0) + 'K';
    } else {
        value = value / 1000000;
        valueStr = '$' + value.toFixed(0) + 'M';
    }
    return valueStr;
};
let getPercentStr = (value, total) => {
    let valueStr = '';
    if (value && total) {
        valueStr = ((value / total) * 100).toFixed(0) + '%';
    } else {
        valueStr = '0%';
    }
    return valueStr;
};

module.exports = {
    getDealValueStr,
    getPercentStr,
};
