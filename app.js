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

const app = express(); //(to call express function)

//------set template engine---------
app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //folder name (views)
//by path.join function we dont even need to think about any './' or not to find the files
//------set template engine---------

//1)Global MIDDLEWAREs
//--implement CORS
app.use(cors());
app.options('*', cors());
//---A)Serving static files
app.use(express.static(path.join(__dirname, 'public'))); //built in middleware to serving static files(http://localhost:3000/overview.html)
//see base.pug file

//---B)set SECURITY HTTP HEADERS
app.use(helmet()); //put in the first of all middlewares func

//---C)development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} //development environment (Only run this middleware in dev environment not production environment)

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
app.use(express.json()); //this middleware is middle of (req and res )
//to modify the incoming request data
//to add the data by json format in the req.body(if we didnt put this middle ware json format dont be allowed)
//steps that request goes through while is being processed
//this middlware applying for all url routes
//if we add middleware after route handler the cycle will be complete without called middllware (order is imp to addmiddleware before route handler )

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
  //add property in request obj called requestTime
  //to know the time of request
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

//2)ROUTES HANDLER
//moved to separeated folder (controller)

//3)ROUTES
//moved to separeated folder (routes)

//--------Routes to access tempalate-----------
app.use('/', viewRouter);
//--------Routes to access tempalate-----------

//this middleware applied for specific url
app.use('/api/v1/tours', tourRouter); //this middleware to connect tourRouter to application(without this middleware router will be not defined)
//when send req to '/api/v1/tours' the req goes into the middleware stack then tourRouter mid.ware function will call(run)
//this called mounting the router(mounting new router(tourRouter) on a route(/api/v1/tours'))

app.use('/api/v1/users', userRouter); //this middleware to connect tourRouter to application(because we remove app.route)

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/booking', bookingRouter);

//---ERROR HANDLING BY EXPRESS

//--1)Error handling for unhandled routes
//must add after all handled route middleware (if we add before them this middleware will be excuted whatever the router endpoint)
//all for all HTTP verbs
//('*') for all url routes that not handled
app.all('*', (req, res, next) => {
  //------Create an error (from Error constructor)

  //removed after add (AppError)r class
  //const err = new Error(`cant find the ${req.originalUrl} on this server`);
  //err.status = 'fail';
  //err.statusCode = 404;

  const err = new AppError(
    `cant find the ${req.originalUrl} on this server`,
    404
  );
  next(err); //to go to Express Global error handling middleware with err object
  //if we didnt add err to next() by default middleware will got to global error handling middleware by error object
});

//--2)Express Global error handling middleware
//by give middleware function 4 arguments , (Express will automatically recognizing it as error handling middleware)
app.use(globalErrorHandler);

//4)START SERVER(moved to server.js file)

/*const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});*/

//to start a server //port is event (return to observer pattern)
// if any request sent just the handler with this request will be executed and not other top level code
//if any changes in files (server will be restart)(and all top level codes will be executed)

module.exports = app; //when run server.js the require function will read and run  app.js file

console.log('start app.js');
