const express = require('express');
const {
  getAllTour,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStatistcs,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

//-a) TOURS RESOURCES

const tourRouter = express.Router();

//---special routes for nested routes (URL)(between two resources)--------
tourRouter.use('/:tourId/reviews', reviewRouter);

//-Aliasing Router (for ex to get higher rating and cheaps 5 tours)//(GO TO query string ?limit=5&sort=-ratingsAverage,price)
//we will use middleware function (aliasTopTours)
tourRouter.route('/top-5-cheap').get(aliasTopTours, getAllTour); //chaining multiple  middleware functions
//-Aliasing Router (for ex to get higher rating and cheaps 5 tours)//(GO TO query string ?limit=5&sort=-ratingsAverage,price)

//---Aggregation statistcs pipelines(search for this at mongodb documentations)
//--A)grouping and matching
tourRouter.route('/tour-stats').get(getTourStatistcs);
//--B)get monthly plan of Tours
tourRouter.route('/monthly-plan/:year').get(getMonthlyPlan);
//---Aggregation statistcs pipelines(search for this at mongodb documentations)

//--------Geospatial Queries(finding(search) tour within distance from center point with latlng----->in shape of circle(region)
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

//----Geospatial (calculating distance to all tours from certain point)
tourRouter.route('/distances/center/:latlng/unit/:unit').get(getDistances);
//----Geospatial (calculating distance to all tours from certain point)

tourRouter
  .route('/')
  .get(getAllTour)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour
  );
tourRouter
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //not normal user or normal guide
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), //not normal user or normal guide
    deleteTour
  );
//same 3,4,5 but we can chain methods that have same url

module.exports = tourRouter;
