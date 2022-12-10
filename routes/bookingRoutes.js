const express = require('express');
const bookingRouter = express.Router();
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

bookingRouter.use(authController.protect);
//----this route end point dont follow rest principles because this route will only be for the client(not create or get or update booking )
bookingRouter.get(
  '/checkout-Session/:tourId',
  bookingController.getCheckoutSession
);
//----this route end point dont follow rest principles because this route will only be for the client(not create or get or update booking )

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = bookingRouter;
