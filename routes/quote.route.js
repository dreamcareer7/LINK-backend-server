const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quote = mongoose.model('quote');
const Tag = mongoose.model('tag');
const Logger = require('../services/logger');

/*
add Quote
*/

router.post('/add-quote', async (req, res) => {
    try {
        if (!req.body.quote || !req.body.quoteBy || !req.body.tags) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        for (let i = 0; i < req.body.tags.length; i++) {
            await Tag.updateOne(
                { tag: req.body.tags[i].toLowerCase() },
                { tag: req.body.tags[i].toLowerCase() },
                { upsert: true },
            );
        }
        let tagArr = [];
        for (let i = 0; i < req.body.tags.length; i++) {
            tag = await Tag.findOne({ tag: req.body.tags[i].toLowerCase() });
            tagArr.push(tag._id);
        }

        let quote = new Quote({
            quote: req.body.quote,
            quoteBy: req.body.quoteBy,
            tags: tagArr,
        });
        await quote.save();
        quote = await Quote.findOne({ _id: quote._id })
            .populate('tags')
            .exec();
        res.status(200).send({
            status: 'SUCCESS',
            data: quote,
        });
    } catch (e) {
        Logger.log.error('Error in adding quote.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});
/*
update quotes
*/
router.put('/update-quote/:id', async (req, res) => {
    try {
        if (!req.body.quote || !req.body.quoteBy || !req.body.tags || !req.params.id) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        for (let i = 0; i < req.body.tags.length; i++) {
            await Tag.updateOne(
                { tag: req.body.tags[i].toLowerCase() },
                { tag: req.body.tags[i].toLowerCase() },
                { upsert: true },
            );
        }
        let tagArr = [];
        for (let i = 0; i < req.body.tags.length; i++) {
            tag = await Tag.findOne({ tag: req.body.tags[i].toLowerCase() });
            tagArr.push(tag._id);
        }

        let quote = await Quote.findOneAndUpdate(
            {
                _id: req.params.id,
            },
            { quote: req.body.quote, quoteBy: req.body.quoteBy, isPublished: req.body.isPublished, tags: tagArr },
            { new: true },
        )
            .populate('tags')
            .exec();

        res.status(200).send({
            status: 'SUCCESS',
            data: quote,
        });
    } catch (e) {
        Logger.log.error('Error in updating quote.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
Delete Quote
*/

router.delete('/delete-quote/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                status: 'ID_NOT_FOUND',
                message: 'Id is requires in params.',
            });
        }
        let quote = await Quote.findByIdAndDelete({ _id: req.params.id });

        if (!quote) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Quote is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            message: 'delete quote Successfully.',
        });
    } catch (e) {
        Logger.log.error('Error in delete quote.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
get all  quotes

*/

router.get('/all-quote', async (req, res) => {
    try {
        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        let quote = await Quote.paginate(
            {},
            {
                page,
                limit,
                populate: 'tags',
            },
        );

        if (!quote) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Quote is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: quote,
        });
    } catch (e) {
        Logger.log.error('Error in get all quotes.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/*
get all tags
*/

router.get('/all-tags', async (req, res) => {
    try {
        let tags = await Tag.find({});

        if (!tags) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Tags is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCCESS',
            data: tags,
        });
    } catch (e) {
        Logger.log.error('Error in get all quotes.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * published or unpublished quote
 */
router.put('/published-unpublished/:id', async (req, res) => {
    try {
        let quote = await Quote.findOne({ _id: req.params.id });
        quote.isPublished = req.body.isPublished;
        await quote.save();
        return res.status(200).json({
            status: 'SUCCESS',
            data: {
                isPublished: quote.isPublished,
            },
        });
    } catch (e) {
        Logger.log.error('Error in quotes published-unpublished api call.', e.message || e);
        res.status(500).json({
            status: 'ERROR',
            message: e.message,
        });
    }
});

/**
 * Export Router
 */
module.exports = router;
