const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const requestIp = require('request-ip');
const commaNumber = require('comma-number');

router.get('/manager_login/:id/:pw', async function(req, res, next) {
    const id = req.params.id;
    const pw = req.params.pw;
    const fcm = req.query.fcm;
    
    var sql = `SELECT *, count(*) as cnt FROM MEMB_tbl WHERE id = ?`;
    var params = [id];
    var arr = await utils.queryResult(sql, params);
    var row = arr[0];
    console.log(row);

    if (row.cnt == 0) {
        res.send({
            code: 0,
            msg: '일치하는 아이디가 없습니다.',
        });
        return;
    }

    //패스워드 암호화!
    sql = `SELECT PASSWORD(?) as pw FROM dual`;
    var params = [pw];
    var arr = await utils.queryResult(sql, params);
    var row2 = arr[0];

    if (row.pass1 == row2.pw) {
        sql = `UPDATE MEMB_tbl SET fcm = ? WHERE id = ?`;
        await utils.queryResult(sql, [fcm, id]);

        res.send({
            code: 1,
            msg: `${row.name1}님 로그인 되었습니다.`,
            idx: row.idx,
            id: row.id,
            name1: row.name1,
        });
    } else {
        res.send({
            code: 0,
            msg: '아이디/패스워드가 일치하지 않습니다.',
        });
    }
});


router.get('/patient_login/:name1/:patient_num', async function(req, res, next) {
    const name1 = req.params.name1;
    const patient_num = req.params.patient_num;

    var sql = `SELECT *, count(*) as cnt FROM PATIENT_tbl WHERE patient_num = ?`;
    var params = [patient_num];
    var arr = await utils.queryResult(sql, params);
    var row = arr[0];
    
    if (row.cnt == 0) {
        res.send({
            code: 0,
            msg: '등록된 환자 등록번호가 없습니다.',
        });
        return;
    }

    if (row.name1 == name1) {
        res.send({
            code: 1,
            msg: `${row.name1}님 로그인 되었습니다.`,
            gender: row.gender == 1 ? '남' : '여',
            age: `${utils.getAge(row.byear)}세`,
            bed_code: row.bed_code,
            idx: row.idx,
            id: row.id,
            name1: row.name1,
            patient_num: row.patient_num,
        });
    } else {
        res.send({
            code: 0,
            msg: '등록된 환자 이름이 다릅니다.',
        });
    }
});


module.exports = router;
