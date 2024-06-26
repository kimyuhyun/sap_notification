const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const axios = require('axios');
const qs = require('qs');
const { log } = require('console');

async function setLog(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var rows;
    await new Promise(function(resolve, reject) {
        var sql = `SELECT visit FROM ANALYZER_tbl WHERE ip = ? ORDER BY idx DESC LIMIT 0, 1`;
        db.query(sql, ip, function(err, rows, fields) {
            if (!err) {
                resolve(rows);
            }
        });
    }).then(function(data){
        rows = data;
    });

    await new Promise(function(resolve, reject) {
        var sql = `INSERT INTO ANALYZER_tbl SET ip = ?, agent = ?, visit = ?, created = NOW()`;
        if (rows.length > 0) {
            var cnt = rows[0].visit + 1;
            db.query(sql, [ip, req.headers['user-agent'], cnt], function(err, rows, fields) {
                resolve(cnt);
            });
        } else {
            db.query(sql, [ip, req.headers['user-agent'], 1], function(err, rows, fields) {
                resolve(1);
            });
        }
    }).then(function(data) {
        console.log(data);
    });

    //4분이상 것들 삭제!!
    fs.readdir('./liveuser', async function(err, filelist) {
        for (file of filelist) {
            await new Promise(function(resolve, reject) {
                fs.readFile('./liveuser/' + file, 'utf8', function(err, data) {
                    resolve(data);
                });
            }).then(function(data) {
                try {
                    if (file != 'dummy') {
                        var tmp = data.split('|S|');
                        console.log(data);
                        moment.tz.setDefault("Asia/Seoul");
                        var connTime = moment.unix(tmp[0] / 1000).format('YYYY-MM-DD HH:mm');
                        var minDiff = moment.duration(moment(new Date()).diff(moment(connTime))).asMinutes();
                        if (minDiff > 4) {
                            console.log(minDiff);
                            fs.unlink('./liveuser/' + file, function(err) {
                                console.log(err);
                            });
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            });
        }
    });

    //현재 접속자 파일 생성
    var memo = new Date().getTime() + "|S|" + req.baseUrl + req.path;
    fs.writeFile('./liveuser/'+ip, memo, function(err) {
        console.log(memo);
    });
    //
    next();
}


router.get('/', async function(req, res, next) {
    const bed_code = "01020304";
    const code_depth1 = bed_code.substring(0, 2);
    const code_depth2 = bed_code.substring(2, 4);
    const code_depth3 = bed_code.substring(4, 6);
    const code_depth4 = bed_code.substring(6, 8);
    console.log(code_depth1, code_depth2, code_depth3, code_depth4);
    res.send("ASD");
});

router.get('/get_building', setLog, async function(req, res, next) {
    var sql = `SELECT * FROM CODES_tbl WHERE LENGTH(code1) = 2 ORDER BY sort1 ASC`;
    var arr = await utils.queryResult(sql, []);
    
    var list = [];
    for (row of arr) {
        row.view_type = 0;
        list.push(row);

        var sql2 = `SELECT * FROM CODES_tbl WHERE LEFT(code1, 2) = ? AND LENGTH(code1) = 4 ORDER BY sort1 ASC`;
        var arr2 = await utils.queryResult(sql2, [row.code1]);
        for (row2 of arr2) {
            row2.view_type = 1;
            list.push(row2);
        }
    }

    res.send(list);
});

router.get('/get_rooms/:code1', setLog, async function(req, res, next) {
    const code1 = req.params.code1;

    var sql = `SELECT * FROM CODES_tbl WHERE LEFT(code1, 4) = ? AND LENGTH(code1) = 6 ORDER BY sort1 ASC`;
    var arr = await utils.queryResult(sql, [code1]);
    res.send(arr);
});

router.get('/get_beds/:code1', setLog, async function(req, res, next) {
    const code1 = req.params.code1;

    var sql = `SELECT * FROM CODES_tbl WHERE LEFT(code1, 6) = ? AND LENGTH(code1) = 8 ORDER BY sort1 ASC`;
    var arr = await utils.queryResult(sql, [code1]);

    for (row of arr) {
        sql = `SELECT * FROM PATIENT_tbl WHERE bed_code = ? `;
        var arr2 = await utils.queryResult(sql, [row.code1]);
        var obj2 = arr2[0];
        if (obj2) {
            row.patient_name = obj2.name1;
            row.patient_gender = obj2.gender == 1 ? '남' : '여';
            row.patient_age = utils.getAge(obj2.byear) + '세';
            row.patient_num = obj2.patient_num;
            row.per = eval(obj2.cur_cc) / eval(obj2.all_cc) * 100;
            row.bed_code = obj2.bed_code;
        }
    }

    res.send(arr);
});

router.get('/get_sap_detail/:code1', setLog, async function(req, res, next) {
    const code1 = req.params.code1;

    var sql = `SELECT * FROM PATIENT_tbl WHERE bed_code = ?`;
    var arr = await utils.queryResult(sql, [code1]);
    var obj = arr[0];
    res.send({
        idx: obj.idx,
        bed_code: obj.bed_code,
        name1: obj.name1,
        gender: obj.gender == 1 ? '남' : '여',
        age: utils.getAge(obj.byear) + '세',
        patient_num: obj.patient_num,
        cur_cc: obj.cur_cc,
        all_cc: obj.all_cc,
        per: eval(obj.cur_cc) / eval(obj.all_cc) * 100,
        memo: obj.memo
    });
});


router.get('/update_sap_data/:bed_code', setLog, async function(req, res, next) {
    const bed_code = req.params.bed_code;
    const cur = req.query.cur;
    const all = req.query.all;

    // 여기서 푸시 로직을 만들면 된다!
    // cur_cc 가 50이하인 경우 ALARM_tbl 에 저장하고 푸시를 보낸다.
    if (eval(cur) < 50) {
        var sql = `SELECT manager_id FROM PATIENT_tbl WHERE bed_code = ?`;
        var arr = await utils.queryResult(sql, [bed_code]);
        var obj = arr[0];

        const manager_id = obj.manager_id;

        const code_depth1 = bed_code.substring(0, 2);
        const code_depth2 = bed_code.substring(0, 4);
        const code_depth3 = bed_code.substring(0, 6);
        const code_depth4 = bed_code.substring(0, 8);

        var depth1 = "";
        var depth2 = "";
        var depth3 = "";
        var depth4 = "";

        sql = `SELECT name1 FROM CODES_tbl WHERE code1 = ?`;
        arr = await utils.queryResult(sql, [code_depth1]);
        obj = arr[0];
        depth1 = obj.name1;

        sql = `SELECT name1 FROM CODES_tbl WHERE code1 = ?`;
        arr = await utils.queryResult(sql, [code_depth2]);
        obj = arr[0];
        depth2 = obj.name1;

        sql = `SELECT name1 FROM CODES_tbl WHERE code1 = ?`;
        arr = await utils.queryResult(sql, [code_depth3]);
        obj = arr[0];
        depth3 = obj.name1;

        sql = `SELECT name1 FROM CODES_tbl WHERE code1 = ?`;
        arr = await utils.queryResult(sql, [code_depth4]);
        obj = arr[0];
        depth4 = obj.name1;

        const message = `${depth1} ${depth2} ${depth3} ${depth4} 환자의 수액을 확인해주세요.`;
        const title = '수액확인';

        sql = `INSERT INTO ALARM_tbl SET target_id = ?, title = ?, memo = ?, created = NOW()`;
        await utils.queryResult(sql, [manager_id, title, message]);

        const push_result = await utils.sendPush(manager_id, message);
        console.log(push_result);
        
    }

    var sql = `UPDATE PATIENT_tbl SET cur_cc = ?, all_cc = ?, modified = NOW() WHERE bed_code = ?`;
    var params = [cur, all, bed_code];
    var arr = await utils.queryResult(sql, params);
    
    res.send(arr);
});

module.exports = router;
