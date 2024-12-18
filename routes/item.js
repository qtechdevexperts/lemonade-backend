var express = require('express');
var router = express.Router();
var Item = require("../models/item");
var crypto = require("../helper/crypto");
var jwtMiddle = require("../middleware/jwt");
const uploadImage = require("../helper/functions").uploadFile;
var mongoose = require('mongoose');

router.get('/all', jwtMiddle.checkToken, function (req, res) {
    try{
        Item.find().sort({'createdAt': -1}).populate('createdBy').lean().then((items) => {
            if (!items) {
                return res.json({
                    success: false,
                    msg: 'Items does not Exist'
                });
            }
            return res.json({
                success: true,
                data: items
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }   
});

router.get('/', jwtMiddle.checkToken, function (req, res) {
    try{
        Item.find({status: 'Offering', isDeleted: false}).sort({'createdAt': -1}).populate('createdBy').lean().then((items) => {
            if (!items) {
                return res.json({
                    success: false,
                    msg: 'Items does not Exist'
                });
            }
            return res.json({
                success: true,
                data: items
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }   
});

router.get('/my/:role', jwtMiddle.checkToken, function (req, res) {
    try{
        var userId = crypto.decrypt(req.decoded.emp);
        var role = String(req.params.role);
        let query = {};
        if(role == 'Provider'){
            query.createdBy = userId;
        }
        else if(role == 'Customer'){
            query.assignedProviderId = userId;
        }
        query.isDeleted = false;
        console.log(query);
        Item.find(query).sort({'createdAt': -1}).populate('createdBy').lean().then((items) => {
            if (!items) {
                return res.json({
                    success: false,
                    msg: 'Items does not Exist'
                });
            }
            return res.json({
                success: true,
                data: items
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }   
});

router.get('/requests', jwtMiddle.checkToken, function (req, res) {
    try{
        var userId = crypto.decrypt(req.decoded.emp);
        let query = {
            status: 'Offering',
            createdBy: userId,
            isDeleted: false,
            'applicants.0': {$exists: true}
        };
        Item.find(query).sort({'createdAt': -1}).populate('applicants').lean().then((items) => {
            if (!items) {
                return res.json({
                    success: false,
                    msg: 'Items does not Exist'
                });
            }
            return res.json({
                success: true,
                data: items
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }   
});

router.get('/user/:id/:role', jwtMiddle.checkToken, function (req, res) {
    try{
        var id = String(req.params.id);
        var role = String(req.params.role);
        let query = {};
        if(role == 'Provider'){
            query.createdBy = id;
        }
        else if(role == 'Customer'){
            query.assignedProviderId = id;
        }
        query.isDeleted = false;
        Item.find(query).sort({'createdAt': -1}).populate('createdBy').lean().then((items) => {
            if (!items) {
                return res.json({
                    success: false,
                    msg: 'Items does not Exist'
                });
            }
            return res.json({
                success: true,
                data: items
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }   
});

router.get('/:id', jwtMiddle.checkToken, function (req, res) {
    
    try {
        var id = String(req.params.id);
        Item.findById(id).then((item) => {
            if (!item) {
                return res.json({
                    success: false,
                    msg: 'Item does not Exist'
                });
            }
            return res.json({
                success: true,
                data: item
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }
});

router.post('/', jwtMiddle.checkToken, function(req, res) {

    try {
        var item = new Item({
            subject: req.body.subject,
            category: req.body.category,
            location: req.body.location,
            rate: req.body.rate,
            description: req.body.description,
            estimatedCompletionTime: req.body.estimatedCompletionTime,
            isRecurring: req.body.isRecurring,
            createdBy: req.body.createdBy,
            status: req.body.status,
            childName: req.body.childName,
            tags: [],
            images: []
        });

        item.save();
        return res.json({
            success: true,
            data: item
        });
       
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }
});

router.put('/:id', jwtMiddle.checkToken, function(req, res) {

    try {
        var id = String(req.params.id);
        Item.findById(id).then((item) => {
            if (!item) {
                return res.json({
                    success: false,
                    msg: 'Item does not Exist'
                });
            }
            item.subject = req.body.subject;
            item.category = req.body.category;
            item.location = req.body.location;
            item.rate = req.body.rate;
            item.status = req.body.status;
            item.description = req.body.description;
            item.estimatedCompletionTime = req.body.estimatedCompletionTime;
            item.isRecurring = req.body.isRecurring;
            item.markPaidCount = req.body.markPaidCount;
            item.assignedProviderId = req.body.assignedProviderId;
            item.childName = req.body.childName,
            item.applicants = JSON.parse(req.body.applicants);
            item.recurringDays = JSON.parse(req.body.recurringDays);
            item.declinedApplicants = JSON.parse(req.body.declinedApplicants);
            item.tags = JSON.parse(req.body.tags);
            item.completedAt = JSON.parse(req.body.completedAt);
            item.paidAt = JSON.parse(req.body.paidAt);
            item.save();
            return res.json({
                success: true,
                data: item
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }
});

router.put('/image/:id', jwtMiddle.checkToken, function(req, res) {

    try {
        var id = String(req.params.id);
        Item.findById(id).then(async (item) => {
            if (!item) {
                return res.json({
                    success: false,
                    msg: 'Item does not Exist'
                });
            }
            const files = req.files;
            if(files && files.length){
                let images = [];
                for(let i=0;i<files.length;i++){
                    const url = await uploadImage(files[i]);
                    images.push(url);
                };
                item.images = images;
		        item.save();
                return res.json({
                    success: true,
                    data: item
                });
            }
            else{
                return res.json({
                    success: false,
                    msg: 'No Images Provided'
                });
            }            
        });
    } catch (ex) {
        console.log(ex);
        return res.json({
            success: false,
            msg: ex
        });
    }
});

router.delete('/:id', jwtMiddle.checkToken, function (req, res) {
    try {
        var id = String(req.params.id);
        Item.findByIdAndRemove(id).then((item)  => {
            if (!item) {
                return res.json({
                    success: false,
                    msg: 'Item does not Exist'
                });
            }
            return res.json({
                success: true,
                msg: 'Success'
            });
        });
    } catch (ex) {
        return res.json({
            success: false,
            msg: ex
        });
    }
});

module.exports = router;
