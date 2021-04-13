const mongoose = require('mongoose');
const Client = mongoose.model('client');
const Logger = require('./../services/logger');
var socket_io = require('socket.io');
var io = socket_io();
var socketApi = {};
let socketUser = {};
socketApi.io = io;

io.on('connection', async function(socket) {
    console.log('New user connected:', socket.id);
    socketUser[socket.id] = socket;
    let userToken = socket.handshake.query.token;
    if (userToken) {
        await addSocketIdToClient(userToken, socket.id);
    }
    socket.on('disconnect', async () => {
        await removeSocketIdFromClient(socket.id);
        for (let key in socketUser) {
            if (key.toString() === socket.id) {
                delete socketUser[key];
            }
        }
    });
});

socketApi.sendNotification = async function({ notificationObj, socketIds = [], clientId = null }) {
    if (clientId && socketIds.length === 0) {
        socketIds = await getSocketIdFromClient(clientId);
    }
    if (socketIds && socketIds.length !== 0) {
        socketIds.forEach((socketId) => {
            if (socketUser[socketId]) {
                console.log('Event emitting to .', socketId, notificationObj);
                socketUser[socketId].emit('FromAPI', notificationObj);
            }
        });
    }
};

let addSocketIdToClient = (token, socketId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.findByToken(token);
            if (!client) {
                return resolve();
            }
            if (client.socketIds.indexOf(socketId) === -1) {
                await Client.updateOne({ _id: client._id }, { $push: { socketIds: socketId } });
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
            await Client.updateOne({ socketIds: { $in: [socketId] } }, { $pull: { socketIds: socketId } });
            return resolve();
        } catch (err) {
            Logger.log.error('Error in removing socketId from client ', err);
            return reject(err);
        }
    });
};
let getSocketIdFromClient = (clientId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let client = await Client.findOne({ _id: clientId })
                .select({ socketIds: 1 })
                .lean();
            if (!client) {
                return [];
            } else {
                return resolve(client.socketIds);
            }
        } catch (err) {
            Logger.log.error('Error in listing socketIds from client ', err);
            return reject(err);
        }
    });
};

module.exports = socketApi;
