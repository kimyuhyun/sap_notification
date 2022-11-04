const menu = [{
        "title": "회원관리",
        "child": [{
                "title": "권한 관리",
                "link": "/adm/grade"
            },
            {
                "title": "관리자 관리",
                "link": "/adm/manager/1"
            },
            {
                "title": "회원 관리",
                "link": "/adm/user/1"
            }
        ]
    },
    {
        "title": "배드",
        "child": [
            {
                "title": "배드관리",
                "link": "/adm/codes"
            },
        ]
    },
    {
        "title": "환자",
        "child": [
            {
                "title": "환자관리",
                "link": "/patient/1"
            },
        ]
    },
    {
        "title": "게시판",
        "child": [
            {
                "title": "공지사항",
                "link": "/adm/board/notice/1"
            },
            {
                "title": "고객센터",
                "link": "/adm/board/cscenter/1"
            },
            // {
            //     "title": "신고",
            //     "link": "/adm/board/singo/1"
            // },
        ]
    },
    {
        "title": "통계",
        "child": [
            {
                "title": "전체방문자",
                "link": "/analyzer/graph1"
            },
            {
                "title": "트래픽수",
                "link": "/analyzer/graph2"
            },
            {
                "title": "시간대별",
                "link": "/analyzer/graph3"
            },
            {
                "title": "현재접속자",
                "link": "/analyzer/liveuser"
            },

        ]
    }
];

module.exports = menu;
