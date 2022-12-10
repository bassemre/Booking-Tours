const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('./../controllers/authController');
const reviewRouter = express.Router({ mergeParams: true });

//1)-------------------to create reviews we have two URL (Routes)----------------------
//post /api/v1/tours/:tourId/reviews (must add mergeParams:true) to preseve the req.params values from parent router (tour router)
//post /api/v1/reviews (the origional routes)
//1)-------------------to create reviews we have two URL (Routes)----------------------

//2)-------------------to Get all reviews for all tours----------------------
//Get /api/v1/reviews (the origional routes)
//2)-------------------to Get all reviews for all tours----------------------

//3)-------------------to Get all reviews for Ceratin Tour----------------------
//Get /tour/(tour ID)/reviews (must add mergeParams:true) to preseve the req.params values from parent router (tour router)
//Get /tour/(tour ID)/reviews/(review ID) (acess certain review in tour)
//3)-------------------to Get all reviews for Ceratin Tour----------------------

//protect all routes after this middleware
reviewRouter.use(authController.protect); //no one can access this routes without being authenicated

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.restrictTo('user'), reviewController.createReview); //only user can create review

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  ); //put by this way any user can update or delete any review for another user???????????

module.exports = reviewRouter;
