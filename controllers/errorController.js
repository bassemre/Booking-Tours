//--2)we can add here (Express Global error handling middleware) handler(controller)
const AppError = require('./../utilities/appError');

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}:${err.value}.`;
  return new AppError(message, 400); //transfer werid error come from mongo to nice error to client(operational error)
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/([" '])(\\?.)*?\1/)[0]; // match return array and [0] to select first element ;
  //console.log(value)
  const message = `Duplicate Field Value :${value} please use another value!`;
  return new AppError(message, 400);
  //error coming from mongodb driver(validation)
  //we want to extract the(value)name of duplicate field (from postman we will see in "errmsg"(field):**************name of dublicate field);
  //to extract the value we use regular expression ([" '])(\\?.)*?\1
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  //Object.values used to make loop over an object
  //error.errors from mongodb in postman
  //we need to extract message from every (object values) in err.errors
  //message is object in err.errors.value
  const message = `invalid input data.${errors.join('. ')} `;
  return new AppError(message, 400);
};

const handleJwtError = (err) =>
  new AppError('Invalid Token please log in again', 401); //arrow function return auto

const handleJwtExpiredError = (err) =>
  new AppError('Your token has expired! please log in again ', 401);

//----------------------Global Error handling middleware--------------------
module.exports = (err, req, res, next) => {
  // console.log(err.stack); //(stack trace)to show you where error happens
  err.statusCode = err.statusCode || 500; //500 internal server error
  err.status = err.status || 'error';

  //----------Errors during development vs production----------

  //1)---------------development-------------------
  if (process.env.NODE_ENV === 'development') {
    //to get all informations about errors at development environment (as developer)
    //original url for URL WITHOUT local host
    //A)API
    if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
      });
      //B)RENDERED WEBSITE
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Somthing Went Wrong !!!.',
        msg: err.message,
      });
    }

    //2)---------------Production-------------------
  } else if (process.env.NODE_ENV === 'production') {
    //--in production as (client) we need to send a little information about errors (nice human friendly message)

    //A)OPERATIONAL ERRORS
    //------------MARK error come from mongodb as operational error--------------

    let error = err; //let because we will reassign the value of error
    //error come from mongodb to global handling error middleware
    console.log(error.name);
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    } //to mark error get from MongoDB as opertional error (get tour )

    if (error.code === 11000) {
      //11000 this code come from mongodb driver (check error at postman to see code=11000)
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    //-----------MARK error come from mongodb as operational error--------------

    //----------MARK ERROR COME FROM JWT-----------
    if (error.name === 'JsonWebTokenError') error = handleJwtError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJwtExpiredError(error);
    //----------MARK ERROR COME FROM JWT-----------

    if (error.isOperational) {
      //A)API
      if (req.originalUrl.startsWith('/api')) {
        res.status(error.statusCode).json({
          status: error.status,
          message: error.message,
        });
      } //B)RENDERED WEBSITE
      else {
        res.status(err.statusCode).render('error', {
          title: 'Somthing Went Wrong !!!.',
          msg: err.message,
        });
      }

      //B)PROGRAMING ERRORS or other unknown errors :dont leak error details to the client
    } else {
      //A)API
      if (req.originalUrl.startsWith('/api')) {
        //1)log error to development
        console.error('ERROR', error); //LIKE console.log but specific for error

        //2)send generic message
        res.status(500).json({
          status: 'error',
          message: 'something went very wrong!',
        });
      }
      //B)RENDERED WEBSITE
      else {
        res.status(err.statusCode).render('error', {
          title: 'Somthing Went Wrong !!!.',
          msg: 'please try again later!!',
        });
      }
    }
  }
};
