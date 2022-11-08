const express = require('express');
const router = express.Router();
const fs = require('fs')
const db = require('../db');
const utils = require('../Utils');
const FormData = require('form-data');
const axios = require('axios');
const { log } = require('console');

async function checking(req, res, next) {
    if (!req.session.mid) {
        res.redirect('/adm/login');
        return;
    }
    next();
}


router.get('/write', checking, async function(req, res, next) {
    var { idx, return_url, table, view, board_id } = req.query;
    
    var row = {};
    
    if (idx) {
        var sql = `SELECT * FROM ?? WHERE idx = ?`;
        var params = [table, idx];
        var arr = await utils.queryResult(sql, params);
        row = arr[0];
        console.log(sql, params);
    }

    if (board_id) {
        row.board_id = board_id;
    }

    
    res.render(`./adm/${view}_write.html`, {
        myinfo: req.session,
        return_url,
        row,
    });
});

router.post('/write', checking, async function(req, res, next) {
    const table = req.query.table;
    const return_url = req.body.return_url;
    const idx = req.body.idx;
    delete req.body.idx;
    delete req.body.return_url;
    
    var isDateColnumn = true;

    //날짜 컬럼이 있는지 확인!
    var sql = `SHOW COLUMNS FROM ?? LIKE 'created'`;
    var arr = await utils.queryResult(sql, [table]);
    if (!arr[0]) {
        isDateColnumn = false;
    }
    
    sql = '';
    var records = [];
    records.push(table);

    for (key in req.body) {
        if (req.body[key] != 'null') {
            if (key == 'pass1') {
                if (req.body[key]) {
                    sql += key + '= PASSWORD(?), ';
                    records.push(req.body[key]);
                }
            } else {
                sql += key + '= ?, ';
                records.push(req.body[key]);
            }
        }
    }

    if (idx) {
        records.push(idx);
        if (isDateColnumn) {
            sql = `UPDATE ?? SET ${sql} modified = NOW() WHERE idx = ?`;
        } else {
            sql = `UPDATE ?? SET ${sql.slice(0, -2)}  WHERE idx = ?`;
        }
    } else {
        if (isDateColnumn) {
            sql = `INSERT INTO ?? SET ${sql} created = NOW(), modified = NOW()`;
        } else {
            sql = `INSERT INTO ?? SET ${sql.slice(0, -2)}`;
        }
    }

    console.log(`@@@@ ${sql}`, records);

    var rs = await utils.queryResult(sql, records);

    if (return_url) {
        res.redirect(return_url);
    } else {
        res.send(rs);
    }
});


router.get('/iterator', checking, async function(req, res, next) {
    const table = req.query.table;
    const sort1 = req.query.sort1;

    var sql = ` SELECT * FROM ?? ORDER BY ? `;
    var arr = await utils.queryResult(sql, [table, sort1]);
    res.send(arr);
});

router.get('/delete', checking, async function(req, res, next) {
    const return_url = req.query.return_url;
    const table = req.query.table;
    const idxArr = req.query.idx;
    
    for (idx of idxArr) {
        console.log(idx);
        db.query(`DELETE FROM ?? WHERE idx = ?`, [table, idx]);
    }

    if (return_url) {
        res.redirect(return_url);
    } else {
        res.send('1');
    }
});


router.get('/add_code', checking, async function(req, res, next) {
    const return_url = req.query.return_url;
    const parentCode = req.query.code1;
    const codeLength = parentCode.length;
    var code = '';
    var sort = 0;

    var sql = '';
    if (parentCode == 'root') {
        sql = ` SELECT code1, sort1 FROM CODES_tbl WHERE LENGTH(code1) = 2 ORDER BY code1 DESC LIMIT 0, 1`;
    } else {
        sql = ` SELECT code1, sort1 FROM CODES_tbl WHERE LEFT(code1, ?) = ? AND LENGTH(code1) = ? ORDER BY code1 DESC LIMIT 0, 1`;
    }

    var params = [codeLength, parentCode, eval(codeLength + 2)];

    console.log(sql, params);

    var arr = await utils.queryResult(sql, params);
    var data = arr[0];

    if (data) {
        console.log(data.code1.length);
        if (data.code1.length == 2) {
            sort = 999;
            code = eval(data.code1) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, sort]);

        } else if (data.code1.length == 4) {
            sort = eval(data.sort1) + 1;
            code = data.code1.substr(2, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, sort]);
        } else if (data.code1.length == 6) {
            sort = eval(data.sort1) + 1;
            code = data.code1.substr(4, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, sort]);
        } else if (data.code1.length == 8) {
            sort = eval(data.sort1) + 1;
            code = data.code1.substr(6, 2);
            code = eval(code) + 1;
            if (code < 10) {
                code = `0${code}`;
            }
            code = `${parentCode}${code}`;
            db.query(`INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`, [code, code, sort]);
        }
    } else {
        if (parentCode == 'root') {
            sort = 1;
            code = '01';
        } else if (parentCode.length == 2) {
            sort = 1;
            code = `${parentCode}01`;
        } else if (parentCode.length == 4) {
            sort = 1;
            code = `${parentCode}01`;
        } else if (parentCode.length == 6) {
            sort = 1;
            code = `${parentCode}01`;
        } else {
            return;
        }
        var sql = `INSERT INTO CODES_tbl SET code1 = ?, name1 = ?, sort1 = ?`;
        var rs = await utils.queryResult(sql, [code, code, sort]);
        console.log(rs);
    }

    res.redirect(return_url);
});

router.get('/del_code', async function(req, res, next) {
    const return_url = req.query.return_url;
    const table = req.query.table;
    const idx = req.query.idx;
    db.query(`DELETE FROM ?? WHERE idx = ?`, [table, idx]);

    if (return_url) {
        res.redirect(return_url);
    } else {
        res.send('1');
    }
});

module.exports = router;
