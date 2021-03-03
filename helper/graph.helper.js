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

module.exports = {
    getDealValueStr,
};
