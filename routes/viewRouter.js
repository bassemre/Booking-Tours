const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

viewRouter = express.Router();

viewRouter.route('/').get(
  bookingController.createBookingCheckout, //we add createBookingCheckout because this route will be hit if  create checkout session is successfully
  authController.isLoggedIn,
  viewsController.getOverview
);

viewRouter
  .route('/tour/:slug')
  .get(authController.isLoggedIn, viewsController.getTour);

viewRouter
  .route('/login')
  .get(authController.isLoggedIn, viewsController.getloginForm);

//-show user Account
viewRouter.route('/me').get(authController.protect, viewsController.getAccount);

//-show booked tour in user account
viewRouter
  .route('/my-tours')
  .get(authController.protect, viewsController.getMyBookedTours);

module.exports = viewRouter;
