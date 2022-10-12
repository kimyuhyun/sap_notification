const express = require('express');
const router = express.Router();
const db = require('../db');
const utils = require('../Utils');
const FormData = require('form-data');
const axios = require('axios');



function userChecking(req, res, next) {
    //여기서 토큰 체크!

    //
    next();
}

router.post('/write', userChecking, async function(req, res, next) {
    var table = req.body.table;
    var idx = req.body.idx;

    delete req.body.table;
    delete req.body.idx;
    delete req.body.created;
    delete req.body.modified;

    var sql = ""
    var records = new Array();

    for (key in req.body) {
        if (req.body[key] != 'null') {
            if (key == 'pass1') {
                sql += key + '= PASSWORD(?), ';
            } else {
                sql += key + '= ?, ';
            }
            records.push(req.body[key]);
        }
    }

    // console.log(records);return;

    if (idx == null) {
        sql = `INSERT INTO ${table} SET ${sql} created = NOW(), modified = NOW()`;
        await db.query(sql, records, function(err, rows, fields) {
            if (!err) {
                var arr = new Object();
                arr.code = 1;
                arr.msg = '등록 되었습니다.';
                res.send(arr);
            } else {
                console.log(err);
                res.send(err);
            }
        });
    } else {
        records.push(idx);
        sql = `UPDATE ${table} SET ${sql} modified = NOW() WHERE idx = ?`;
        await db.query(sql, records, function(err, rows, fields) {
            if (!err) {
                db.query("SELECT * FROM " + table + " WHERE idx = ?", idx, function(err, rows, fields) {
                    var arr = new Object();
                    arr.code = 2;
                    arr.msg = '수정 되었습니다.';
                    arr.record = rows[0];
                    res.send(arr);
                });
            } else {
                res.send(err);
            }
        });
    }
    // console.log(sql, records);
});

router.post('/delete', userChecking, async function(req, res, next) {
    const table = req.body.table;
    const idx = req.body.idx;
    const sql = `DELETE FROM ${table} WHERE idx = ?`;
    db.query(sql, idx);
    res.send({
        code: 1,
        msg: '삭제 되었습니다.'
     });
});

router.post('/reply_delete', userChecking, async function(req, res, next) {
    var table = req.query.table;
    var params = JSON.parse(req.body.request);
    console.log(params);
    var sql = ``;
    for (idx of params.selected) {
        sql = `UPDATE ${table} SET id='admin', name1='관리자', memo='삭제된 댓글 입니다.', filename0='' WHERE idx = ${idx}`;
        db.query(sql);
    }
    var arr = new Object();
    arr.code = 1;
    res.send(arr);
});

module.exports = router;
