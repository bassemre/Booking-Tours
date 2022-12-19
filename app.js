//------configure every thing related to express in this file
const path = require('path'); //path module core module
const express = require('express'); //regular dep
const morgan = require('morgan'); //regular dep
const rateLimit = require('express-rate-limit'); //npm i express-rate-limit
const helmet = require('helmet'); //npm i helmet
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieparser = require('cookie-parser'); //to get cookie from client side
const cors = require('cors');
require('dotenv').config();
const AppError = require('./utilities/appError'); //to handle error
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

//------set template engine---------
app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//------set template engine---------

//1)Global MIDDLEWAREs
//--implement CORS
app.use(cors());
app.options('*', cors());
//---A)Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//---B)set SECURITY HTTP HEADERS
app.use(helmet()); //put in the first of all middlewares func

//---C)development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//---D)limit requests from same API
//----Global middleware for implement rate limiting--------
//rateLimit take some options
const limiter = rateLimit({
  max: 100, //max times of the same ip for making requests in our Api(100 requests for the same ip)IMP(ADAPT this number to be suitable for our app)
  windowMs: 60 * 60 * 1000, //(100 requests for the same ip) in one hour
  message: 'Too many requests from this IP , please try again in an hour', //error message
});

app.use('/api', limiter);
//----Global middleware for implement rate limiting--------

//---E)Body parser , reading data from the body ,req.body
app.use(express.json());

app.use(cookieparser()); //parses the data from cookies to get cookie includes(jwt) from browser wen send request to api

//-----data sanitization against NO SQL Query injection
app.use(mongoSanitize()); // look at req.body ,req query string,req.params ,then will basically filter out all($,. ) mongodb operator

//-----data sanitization against XSS(cross site scripting)
app.use(xss());

//----prevent parameter pollution(dublicate field in query string)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], //we want to get acess for dublicating duration field in query string but for ex we dont dublicate sort field
  })
);

//---F)Test middleware
app.use((req, res, next) => {
  console.log('hello from middle ware side');
  next(); // without call next function req and response cycle will not be completed and response dont be send
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//--------Routes to access tempalate-----------
app.use('/', viewRouter);
//--------Routes to access tempalate-----------

//this middleware applied for specific url
app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/booking', bookingRouter);

//---ERROR HANDLING BY EXPRESS

app.all('*', (req, res, next) => {
  const err = new AppError(
    `cant find the ${req.originalUrl} on this server`,
    404
  );
  next(err);
});

//--2)Express Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;

console.log('start app.js');
