const fs = require('fs');
const db = require('./db');
const axios = require('axios');

class Utils {
    async queryResult(sql, params) {
        var arr = [];
        await new Promise(function(resolve, reject) {
            db.query(sql, params, function(err, rows, fields) {
                if (!err) {
                    resolve(rows);
                } else {
                    reject(err);
                }
            });
        }).then(async function(data) {
            arr = data;
        }).catch(function(reason) {
            arr = reason;
        });
        arr = await this.nvl(arr);
        return arr;
    }

    ///null 값은 빈값으로 처리해준다!!
    async nvl(arr) {
        if (arr == null) {
            return arr;
        }

        if (arr.length != null) {
            for (var rows of arr) {
                for (var i in rows) {
                    if (rows[i] == null || rows[i] == 'null') {
                        rows[i] = '';
                    }
                }
            }
        } else {
            for (var i in arr) {
                if (arr[i] == null || arr[i] == 'null') {
                    arr[i] = '';
                }
            }
        }
        return arr;
    }

    pageHelper(page, rowCount) {
        const pageNum = page; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
        const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
        const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
        const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
        const totalCount = Number(rowCount); // NOTE: 전체 글 개수.
        const pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        const pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        var pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.
        if (pnEnd > pnTotal) {
            pnEnd = pnTotal;
        }
        var pnPrev = pnStart - 1;
        var pnNext = pnEnd + 1;
        if (pnNext >= pnTotal) {
            pnNext = 0;
        }

        const data = {
            skipSize,
            contentSize,
            pageNum,
            pnStart,
            pnEnd,
            pnTotal,
            pnPrev,
            pnNext,
        }

        return data;
    }

    utilConvertToMillis(time) {
        var time = new Date(time).getTime() / 1000;
        var currentTime = Math.floor(new Date().getTime()/1000);
        var inputTime = time;
        var diffTime = currentTime - inputTime;
        var postTime;
        switch(true) {
            case diffTime < 60 :
                postTime = '방금';
                break;
            case diffTime < 3600 :
                postTime = parseInt(diffTime / 60) + '분 전';
                break;
            case diffTime < 86400 :
                postTime = parseInt(diffTime / 3600) + '시간 전';
                break;
            case diffTime < 604800 :
                postTime = parseInt(diffTime / 86400) + '일 전';
                break;
            case diffTime > 604800 :
                var date = new Date(time * 1000);
                var month = eval(date.getMonth() + 1);
                var day = date.getDate();
                if (eval(date.getMonth() + 1) < 10) {
                    month = "0" + eval(date.getMonth() + 1);
                }
                if (date.getDate() < 10) {
                    day = "0" + date.getDate()
                }
                postTime = date.getFullYear() + "-" + month + "-" + day;
                break;
            default: 
                postTime = time;
        }
        return postTime;
    }

    getAge(byear) {
        var y = new Date().getFullYear();
        var age = y - byear;
        return age;
    }
}

module.exports = new Utils();
