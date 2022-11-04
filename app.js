process.env.NODE_ENV = (process.env.NODE_ENV && (process.env.NODE_ENV).trim().toLowerCase() == 'production') ? 'production' : 'development';

const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const requestIp = require('request-ip');
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const db = require('./db');

const app = express();

app.use(requestIp.mw());
app.use(session({
    key: 'sid',
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore(db.connAccount),
    cookie: {
        maxAge: 24000 * 60 * 60 // 쿠키 유효기간 24시간
    }
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(fileUpload({
    createParentPath: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static('data'));

app.use('/', require('./routes/index'));
app.use('/adm', require('./routes/adm'));
app.use('/crud', require('./routes/crud'));
app.use('/api_crud', require('./routes/api_crud'));
app.use('/analyzer', require('./routes/analyzer'));
app.use('/article', require('./routes/article'));
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/patient', require('./routes/patient'));
app.use('/bed', require('./routes/bed'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404).send('페이지가 없습니다.');
    res.status(500).send('500 에러');
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    app.locals.hostname = process.env.HOST_NAME;

    if (process.env.NODE_ENV == 'development') {
        console.log('err', err.stack);
        // res.status(err.status || 500);
        // res.render('error');
    }
    
});

module.exports = app;
