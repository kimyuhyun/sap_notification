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
        const dateTime = new Date(time).getTime();
        const nowTime = new Date().getTime();
        const differenceInSeconds = (nowTime - dateTime) / 1000; // 초 단위로 차이 계산

        if (differenceInSeconds <= 60) {
            return "방금";
        }

        const differenceInMinutes = Math.floor(differenceInSeconds / 60);
        if (differenceInMinutes <= 60) {
            return `${differenceInMinutes}분 전`;
        }

        const differenceInHours = Math.floor(differenceInMinutes / 60);
        if (differenceInHours <= 24) {
            return `${differenceInHours}시간 전`;
        }

        const differenceInDays = Math.floor(differenceInHours / 24);
        if (differenceInDays <= 7) {
            return `${differenceInDays}일 전`;
        }

        const differenceInWeeks = Math.floor(differenceInDays / 7);
        if (differenceInWeeks <= 4) {
            return `${differenceInWeeks}주 전`;
        }

        const differenceInMonths = Math.floor(differenceInDays / 30);
        if (differenceInMonths <= 12) {
            return `${differenceInMonths}달 전`;
        }

        const differenceInYears = Math.floor(differenceInDays / 365);
        return `${differenceInYears}년 전`;
    }

    getAge(byear) {
        var y = new Date().getFullYear();
        var age = y - byear;
        return age;
    }


    async sendPush(id, msg) {
        var sql = "SELECT fcm FROM MEMB_tbl WHERE id = ?";
        var arr = await this.queryResult(sql, [id]);
        var fcmArr = [];
        for (const row of arr) {
            fcmArr.push(row.fcm);
        }

        var fields = {};
        fields["notification"] = {};
        fields["data"] = {};

        fields["registration_ids"] = fcmArr;
        fields['notification']['title'] = '수액알림';
        fields["notification"]["body"] = msg;

        fields["data"]["title"] = '수액알림';
        fields["data"]["body"] = msg;

        fields["priority"] = "high";

        const { data } = await axios({
            method: "post",
            url: "https://fcm.googleapis.com/fcm/send",
            headers: {
                "Content-Type": "application/json",
                Authorization: `key=${process.env.FCM_SERVER_KEY}`,
            },
            data: JSON.stringify(fields),
        });
        return data;
    }
}

module.exports = new Utils();
