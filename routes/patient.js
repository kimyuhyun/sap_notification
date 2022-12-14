const express = require('express');
const router = express.Router();
const fs = require('fs');
const db = require('../db');
const utils = require('../Utils');
const moment = require('moment');
const { log } = require('console');

async function checking(req, res, next) {
    if (!req.session.mid) {
        res.redirect('/adm/login');
        return;
    }

    var sql = `SELECT show_menu_link FROM GRADE_tbl WHERE level1 = ?`;
    var params = [req.session.level1];
    var arr = await utils.queryResult(sql, params);
    console.log(arr[0].show_menu_link);
    if (arr) {
        showMenuLinkArr = arr[0].show_menu_link.substr(1, 9999).split(',');
    }
    next();
}



router.get('/:page/:menu1/:menu2', checking, async function(req, res, next) {
    var { page, menu1, menu2 } = req.params;
    var search = req.query.search;
    var orderby = req.query.orderby;


    var where = ` WHERE 1=1 `;
    var records = [];

    if (search) {
        where += ` AND (name1 LIKE ? OR patient_num LIKE ?) `;
        records.push(`%${search}%`);
        records.push(`%${search}%`);
    } else {
        search = '';
    }

    if (orderby) {
        if (orderby.toLowerCase().includes('delete') || orderby.toLowerCase().includes('update') || orderby.toLowerCase().includes('select')) {
            console.log('err', orderby);
            res.send(orderby);
            return;
        }
    } else {
        orderby = ' idx DESC ';
    }

    var sql = `SELECT COUNT(*) as cnt FROM PATIENT_tbl ${where}`;
    var arr = await utils.queryResult(sql, records);

    const pageHeler = utils.pageHelper(page, arr[0].cnt);

    records.push(pageHeler.skipSize);
    records.push(pageHeler.contentSize);

    sql = `
        SELECT 
        * 
        FROM 
        PATIENT_tbl as A
        ${where} 
        ORDER BY ${orderby}
        LIMIT ?, ?
    `;
    arr = await utils.queryResult(sql, records);
    
    console.log(sql, records);
    var list = [];
    for (row of arr) {
        row.age = utils.getAge(row.byear);
        row.created = utils.utilConvertToMillis(row.created);
        row.modified = utils.utilConvertToMillis(row.modified);

        var buildingCode = row.bed_code.substr(0,4);
        var roomCode = row.bed_code.substr(0,6);
        var bedCode = row.bed_code.substr(0,8);

        var tmp = ``;

        sql = `
            SELECT
                (SELECT name1 FROM CODES_tbl WHERE code1 = ?) as building_name,
                (SELECT name1 FROM CODES_tbl WHERE code1 = ?) as room_name,
                (SELECT name1 FROM CODES_tbl WHERE code1 = ?) as bed_name
            FROM dual 
        `;
        var data = await utils.queryResult(sql, [buildingCode, roomCode, bedCode]);
        var obj = data[0];
        tmp += `${obj.building_name} > ${obj.room_name} > ${obj.bed_name}`;

        row.bed_name = tmp;

        list.push(row);
    }

    var data = pageHeler;
    data.orderby = orderby;
    data.search = search;
    data.list = list;

    res.render(`./adm/patient.html`, {
        myinfo: req.session,
        menu1: req.params.menu1,
        menu2: req.params.menu2,
        data,
    });
});


module.exports = router;
