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
//(notes) ever route handler is actually middlware themseleves that only applied for certain url
//1-get all tour
/*app.get('/api/v1/tours', getAllTour);*/
//2- create new tour (req.body)
/*app.post('/api/v1/tours', createTour);*/

const tourRouter = express.Router();

//---special routes for nested routes (URL)(between two resources)--------
tourRouter.use('/:tourId/reviews', reviewRouter);
//parent router an child router
//1)mounting a router in other router for specific URL '/:tourId/reviews' Rerouter
//2)at this point reviewRouter dosent get acess to '/:tourId'
//3)so we will use merge params in reviewRouter (preserve the req.params values from the parent router(tour router)into the child router(review router))

//post /tour/(tour ID)/reviews (access review resource in tour resource)
//Get /tour/(tour ID)/reviews
//----steps when we hit /api/v1/tours/:tourId/reviews
//1) match app.use('/api/v1/tours', tourRouter) ----> go to tourRouter
//2)then in tourRouter match tourRouter.use('/:tourId/reviews', reviewRouter);---->go to reviewRouter
//3)then in reviewRouter with mergeParams we get access to parent router params(/:tourId)
//4)by post method we will get Access to create review

//---special routes for nested routes (URL)(between two resources)--------

//-----CREATE A CHECK ID MIDDLEWARE
//adding param middleware(that only run when the :id param is present in the url )
//this param middleware handler takes four arguments req,res,next , variable (is called url param)
//run only for specific (url param)
//check (checkID handler to see 4th arguments and next() functions)
//-----removed checkID after adding monogodb that checking id automatically
//tourRouter.param('id', checkID);

//-----CREATE A CHECKBODY MIDDLEWARE
//check if the body contains the name and price property
//add it to post handler(post(middleware(checkBody),createTour))==>in the post req we will run this middleware first before createTour
//post(middleware,createTour) this called (chain two different middlewares)

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
//by query string we can make this by query like that --->tours-distance?distance=233&center=-40,45&unit=mi
//but we will make it by URLS LIKE----->tours-distance/233/center/-40,45/unit/mi
//--------Geospatial Queries(finding(search) tour within distance point(region)

//----Geospatial (calculating distance to all tours from certain point)
tourRouter.route('/distances/center/:latlng/unit/:unit').get(getDistances);
//----Geospatial (calculating distance to all tours from certain point)

tourRouter
  .route('/')
  .get(getAllTour) //chaining multiple middleware for auth (protect middleware run first and if user not auth will send error , getAllTour func not be excuted)
  //but we deleted protect miidleware to make our tour visible to every one ont user only
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour
  ); //chaining multiple  middleware functions
//same 1,2 but we can chain methods that have same url
//app.route(url).method(route handler)
//after create router for each resource =>>> tourRouter.route('/).method(route handler)

//-3 get tour by id (using req.params)
//responding to url parameters
//(:id) variable (is called url param)
//we can add multiple param(/:id/:x/:y)
//if add multiple param must route all of them and if we want make any optional (add ? like /:id/:x?)
/*app.get('/api/v1/tours/:id', getTour);*/
//4-handling patch request
/*app.patch('/api/v1/tours/:id', updateTour);*/
//5-handling delete request
/*app.delete('/api/v1/tours/:id', deleteTour);*/
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
