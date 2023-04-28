const Booking = require('../models/bookingModel');
const AppError = require('../utilities/appError');
const Tour = require('./../models/toursModels');
const catchAsync = require('./../utilities/catchAsync');

//--1)overView(all tours) page
exports.getOverview = catchAsync(async (req, res, next) => {
  //1)GET all tours data from collection
  const tours = await Tour.find();
  //2)Build template(overview.pug)
  //3)Render that template using tours data from step 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours, //pass tours as local variable in overview file
  });
});

//--2)tour page
exports.getTour = catchAsync(async (req, res, next) => {
  //1)get the data for the requested tour(including tour guides,reviews)
  console.log(req.params.slug);
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews'
  );
  //-----error handling if no tour(slug errors)
  if (!tour)
    return next(new AppError('There is no tour found with that name.', 404));

  //2)Build template(tour.pug)
  //3)Render that template using tour data from step 1)
  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour, //pass tour variable (local) in tour template
  });
});

//--3)login page
exports.getloginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'log into your account',
    //user,
  });
});

//-4)User Account page
exports.getAccount = catchAsync(async (req, res, next) => {
  //we dont need to query the current user because we make that in protect middleware

  res.status(200).render('account', {
    title: 'Your Account',
  });
});

//-5)user booked tour page
exports.getMyBookedTours = catchAsync(async (req, res, next) => {
  //1)find all bookings for the current user
  //we can make populate with vartual property butt we will populate it manually
  const bookings = await Booking.find({ user: req.user.id });

  //2)find Tours with the returned IDs
  const tourIDs = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //new operators called $in to get all tour have id in tourIDs array
  res.status(200).render('overview', {
    title: 'My Booked Tours',
    tours: tours,
  });
});

//--6)signup page
exports.getSignUpForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: 'signup to get account',
    //user,
  });
});
