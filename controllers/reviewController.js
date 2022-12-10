const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');
const factory = require('./handlerFactory');

//we can  get all reviews by factory function (factory.getAll) and take all adv of API features for query(IMP)
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  //if dont use //Get /tour/(tour ID)/reviews filter object will be embty and then we will find all reviews from //Get /api/v1/reviews (the origional routes)
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

exports.getReview = factory.getOne(Review);

//we can set create Review by factory function(factory.createOne(Review)) but we add another function to set additional data for
/* if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;*/
//but i will keep it by its handler (dont use factory function)
exports.createReview = catchAsync(async (req, res, next) => {
  //-----from nested routes in tour routes-----------------
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; //user come from authController.protect middleware (user=current user)
  //-----from nested routes in tour routes-----------------

  const review = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: review,
  });
});

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
