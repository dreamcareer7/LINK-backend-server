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
        if (!req.body.quote || !req.body.quoteBy || !req.body.tag) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        let tags = await Tag.find({});

        for (let i = 0; i < req.body.tag.length; i++) {
            let flag = true;
            for (let j = 0; j < tags.length; j++) {
                if (req.body.tag[i].toLowerCase() === tags[j].tag.toLowerCase()) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                let t = new Tag({
                    tag: req.body.tag[i],
                });
                await t.save();
            }
        }
        tags = await Tag.find({});
        let tagArr = [];
        for (let i = 0; i < req.body.tag.length; i++) {
            for (let j = 0; j < tags.length; j++) {
                if (req.body.tag[i].toLowerCase() === tags[j].tag.toLowerCase()) {
                    tagArr.push(tags[j]._id);
                    break;
                }
            }
        }
        let quote = new Quote({
            quote: req.body.quote,
            quoteBy: req.body.quoteBy,
            tags: tagArr,
        });
        await quote.save();
        res.status(200).send({
            status: 'SUCESS',
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
        if (!req.body.quote || !req.body.quoteBy || !req.body.tag || !req.params.id) {
            return res.status(400).json({
                status: 'REQUIRE_FIELD_EMPTY',
                message: 'Enter mandatory Fields.',
            });
        }
        let quote = await Quote.findOne({ _id: req.params.id })
            .populate('tags')
            .exec();
        if (!quote) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Quote is not found.',
            });
        }

        quote.quote = req.body.quote;
        quote.quoteBy = req.body.quoteBy;
        quote.isPublished = req.body.isPublished;
        let tags = await Tag.find({});

        for (let i = 0; i < req.body.tag.length; i++) {
            let flag = true;
            for (let j = 0; j < tags.length; j++) {
                if (req.body.tag[i].toLowerCase() === tags[j].tag.toLowerCase()) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                let t = new Tag({
                    tag: req.body.tag[i],
                });
                await t.save();
            }
        }
        tags = await Tag.find({});
        let tagArr = [];
        for (let i = 0; i < req.body.tag.length; i++) {
            for (let j = 0; j < tags.length; j++) {
                if (req.body.tag[i].toLowerCase() === tags[j].tag.toLowerCase()) {
                    tagArr.push(tags[j]._id);
                    break;
                }
            }
        }
        quote.tags = tagArr;
        await quote.save();
        res.status(200).send({
            status: 'SUCESS',
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
        let quote = await Quote.deleteOne({ _id: req.params.id });

        if (!quote) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Quote is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCESS',
            message: 'delete quote sucessfully.',
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
        let quote = await Quote.find({})
            .populate('tags')
            .exec();
        if (!quote) {
            return res.status(400).json({
                status: 'NOT_FOUND',
                message: 'Quote is not found.',
            });
        }
        return res.status(200).send({
            status: 'SUCESS',
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
            status: 'SUCESS',
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
 * Export Router
 */
module.exports = router;
