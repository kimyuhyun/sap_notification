const express = require('express');
const router = express.Router();
// const db = require('../db');
const utils = require('../Utils');


router.get('/', async function(req, res, next) {

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


    var sql = `SELECT visit FROM ANALYZER_tbl ORDER BY idx DESC LIMIT 0, 10`;
    var params = [];
    var arr = await utils.queryResult(sql, params);
    console.log(arr);

    res.render('./index.html',{
        title: process.env.DB_DATABASE,
        ip: ip,
        mode: process.env.NODE_ENV
    });
});


router.get('/push_test', async function(req, res, next) {
    const id = req.query.id;
    const result = utils.sendPush(id, '푸시테스트 바디 입니다.');
    res.json(result);
});

module.exports = router;
