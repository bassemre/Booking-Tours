//one class inherits from the other
//operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //to determine the kind of error (40...or 500)
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); //stack trace to show where error happens
  }
}
module.exports = AppError;
