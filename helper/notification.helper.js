const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Opportunity = mongoose.model('opportunity');
const Notification = mongoose.model('notification');

const scheduleNotification = async () => {
    let dt = await getDateForSpecificTimezone();

    let client = await Client.find({ isDeleted: false });

    if (client.length !== 0) {
        for (let i = 0; i < client.length; i++) {
            let opportunity = await Opportunity.find({
                clientId: client[0]._id,
                isDeleted: false,
                followUp: { $gte: new Date('2021-01-16T10:16:00.263Z'), $lte: dt.endDate },
            });

            if (opportunity.length !== 0) {
            }
        }
    }
};

const getDateForSpecificTimezone = async () => {
    let d = new Date();

    let utc = d.getTime();

    let startDate = new Date(utc + 3600000 * 11);
    let endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    return {
        startDate: startDate,
        endDate: endDate,
    };
};

module.exports = {
    scheduleNotification,
};
