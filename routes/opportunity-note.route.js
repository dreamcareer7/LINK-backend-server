const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Opportunity = mongoose.model('opportunity');
const Logger = require('../services/logger');

router.post('/add-opportunity-note/:opportunityId', async (req, res) => {
    try {
        if (!req.body.note) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Note is not Found!',
            });
        }
        let opportunity = await Opportunity.findOne({
            _id: req.params.opportunityId,
            clientId: req.client._id,
            isDeleted: false,
        });

        if (opportunity) {
            opportunity.notes.push({
                text: req.body.note,
                creationTime: new Date(),
                updationTime: new Date(),
            });
            await opportunity.save();
            return res.status(200).json({
                status: 'SUCESS',
                data: opportunity.notes,
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'opportunity is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in add Opportunity Note API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
router.get('/get-opportunity-note/:opportunityId', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOne({
            _id: req.params.opportunityId,
            clientId: req.client._id,
            isDeleted: false,
        });
        if (opportunity) {
            return res.status(200).json({
                status: 'SUCESS',
                data: opportunity.notes,
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Opportunity is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in get opportunity note  API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
router.put('/update-opportunity-note/:opportunityId/:noteId', async (req, res) => {
    try {
        if (!req.body.note) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Note is not Found!',
            });
        }

        let opportunity = await Opportunity.findOneAndUpdate(
            {
                _id: req.params.opportunityId,
                'notes._id': req.params.noteId,
                clientId: req.client._id,
                isDeleted: false,
            },
            { $set: { 'notes.$.text': req.body.note, 'notes.$.updationTime': new Date() } },
            { new: true },
        );

        if (opportunity) {
            return res.status(200).json({
                status: 'SUCESS',
                data: opportunity.notes,
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Opportunity is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in update Opportunity note API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
router.delete('/delete-opportunity-note/:opportunityId/:noteId', async (req, res) => {
    try {
        let opportunity = await Opportunity.findOneAndUpdate(
            {
                _id: req.params.opportunityId,
                'notes._id': req.params.noteId,
                clientId: req.client._id,
                isDeleted: false,
            },
            {
                $pull: { notes: { _id: req.params.noteId } },
            },
            { new: true },
        );
        if (opportunity) {
            return res.status(200).json({
                status: 'SUCESS',
                data: opportunity.notes,
            });
        } else {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Opportunity is not Found!',
            });
        }
    } catch (e) {
        Logger.log.error('Error in delete Opportunity note API call.', e.message || e);
        res.status(500).json({
            status: e.status || 'ERROR',
            message: e.message,
        });
    }
});
/**
 * Export Router
 */
module.exports = router;
