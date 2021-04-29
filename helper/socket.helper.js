const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Logger = require('./../services/logger');
var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
let socketUser = {};
let socketChromeUser = {};
socketApi.io = io;

io.on('connection', async function(socket) {
    try {
        let requestFrom = socket.handshake.query.request_from;
        console.log('New user connected:', socket.id, requestFrom);
        if (requestFrom && requestFrom === 'extension') {
            socketChromeUser[socket.id] = socket;
        } else {
            socketUser[socket.id] = socket;
        }
        let userToken = socket.handshake.query.token;
        if (userToken) {
            await addSocketIdToClient(userToken, socket.id, requestFrom);
        }
        socket.on('time-tracking', async (message) => {
            console.log('Received the tracking of the user', message);
            updateTimeSpent(message);
        });
        socket.on('disconnect', async () => {
            console.log('User disconnected::', socket.id);
            await removeSocketIdFromClient(socket.id);
            for (let key in socketUser) {
                if (key.toString() === socket.id) {
                    delete socketUser[key];
                }
            }
        });
    } catch (e) {
        console.log('Error connecting the user::', e.message || e);
    }
});

socketApi.sendNotification = async function({ notificationObj, socketIds = [], clientId = null, requestFor }) {
    if (clientId && socketIds.length === 0) {
        socketIds = await getSocketIdFromClient(clientId, requestFor);
    }
    if (socketIds && socketIds.length !== 0) {
        if (requestFor && requestFor === 'extension') {
            socketIds.forEach((socketId) => {
                if (socketChromeUser[socketId]) {
                    console.log('Event extension emitting to .', socketId, notificationObj);
                    socketChromeUser[socketId].emit('change-button-text', notificationObj);
                }
            });
        } else {
            socketIds.forEach((socketId) => {
                if (socketUser[socketId]) {
                    console.log('Event emitting to .', socketId, notificationObj);
                    socketUser[socketId].emit('FromAPI', notificationObj);
                }
            });
        }
    }
};

let addSocketIdToClient = (token, socketId, requestFrom) => {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.findByToken(token);
            if (!client) {
                return resolve();
            }
            if (requestFrom && requestFrom === 'extension') {
                if (client.extensionSocketIds.indexOf(socketId) === -1) {
                    await Client.updateOne({ _id: client._id }, { $push: { extensionSocketIds: socketId } });
                }
            } else {
                if (client.socketIds.indexOf(socketId) === -1) {
                    await Client.updateOne({ _id: client._id }, { $push: { socketIds: socketId } });
                }
            }
            return resolve();
        } catch (err) {
            Logger.log.error('Error in adding socketId to client ', err);
            return reject(err);
        }
    });
};

let removeSocketIdFromClient = (socketId) => {
    return new Promise(async (resolve, reject) => {
        try {
            await Client.updateOne(
                {
                    $or: [
                        {
                            socketIds: { $in: [socketId] },
                        },
                        {
                            extensionSocketIds: { $in: [socketId] },
                        },
                    ],
                },
                { $pull: { socketIds: socketId, extensionSocketIds: socketId } },
            );
            return resolve();
        } catch (err) {
            Logger.log.error('Error in removing socketId from client ', err);
            return reject(err);
        }
    });
};
let getSocketIdFromClient = (clientId, requestFor) => {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.findOne({ _id: clientId })
                .select({ socketIds: 1, extensionSocketIds: 1 })
                .lean();
            if (!client) {
                return [];
            } else {
                if (requestFor && requestFor === 'extension') {
                    return resolve(client.extensionSocketIds);
                } else {
                    return resolve(client.socketIds);
                }
            }
        } catch (err) {
            Logger.log.error('Error in listing socketIds from client ', err);
            return reject(err);
        }
    });
};

/**
 * Time spent on LinkedIn
 */
let updateTimeSpent = async ({ startTime, endTime, token }) => {
    try {
        let currentTime = new Date();
        if (!startTime || !endTime || !token) {
            Logger.log.error('Missing required fields to add the time spent on linkedIn');
            return Promise.resolve();
        }
        startTime = new Date(startTime);
        endTime = new Date(endTime);
        if (startTime > currentTime || endTime > currentTime || startTime > endTime) {
            Logger.log.error('Missing minimum criteria to add the time spent on linkedIn');
            return Promise.resolve();
        }
        let client = await Client.findByToken(token);
        if (!client) {
            Logger.log.error('Client not found for the requested token');
            return Promise.resolve();
        }
        if (!client.lastOnLinkedInAt) {
            client.lastOnLinkedInAt = endTime;
            client.timeSpentOnLinkedInInMs = endTime.getTime() - startTime.getTime();
        } else {
            if (client.lastOnLinkedInAt < startTime) {
                client.timeSpentOnLinkedInInMs += endTime.getTime() - startTime.getTime();
            } else {
                client.timeSpentOnLinkedInInMs += endTime.getTime() - client.lastOnLinkedInAt.getTime();
            }
            client.lastOnLinkedInAt = endTime;
        }
        await client.save();
        return Promise.resolve();
    } catch (e) {
        Logger.log.error('Error updating the total time spent on linkedIn:', e.message || e);
    }
};

module.exports = socketApi;
