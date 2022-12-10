//one class inherits from the other
//operational errors
class AppError extends Error {
  // constructor method is called each time we create new object out of  AppError class(new AppError(message,statuscode))
  constructor(message, statusCode) {
    super(message); //calling error from parent constructor
    //when we extend a (parent class) we use super to call the (parent constructor)
    //super(message) do that with message because message is the only parameter that the built in -Error accepts
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //to determine the kind of error (40...or 500)
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); //stack trace to show where error happens
  }
}
module.exports = AppError;
