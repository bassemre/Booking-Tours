const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //PASS secret key to get autom stripe object;
const Tour = require('./../models/toursModels');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utilities/catchAsync');
const factory = require('./handlerFactory');

//-------------------creating booking by checkout sessions by client---------------
//----------get checkout-session
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1)get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2)create checkout-session
  const session = await stripe.checkout.sessions.create({
    //A)session informations
    payment_method_types: ['card'], //for credit cards,
    //the url that will be called(hit) as soon as a credit card has been successfully charged (purchase was successful)(checkout successfully)
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    /*home page*/

    //the url that will be called if user cancel payments
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${
      tour.slug
    }` /*tour page*/,
    customer_email: req.user.email, //from protect middleware
    //create new booking in database to get access to session objects
    client_reference_id: req.params.tourId,
    mode: 'payment', //if we add price must be add mode(IMP)

    //B)product informations
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            //images:[]
          },
          unit_amount: tour.price,
        },
        quantity: 1,
      },
    ],
  });

  //3)send checkout-session to client(by response)
  res.status(200).json({
    status: 'success',
    session: session,
  });
});

//create new booking on checkout success
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //1)get data from success url (query string)
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) {
    return next();
  }
  //2)create booking
  const booking = await Booking.create({
    tour: tour,
    user: user,
    price: price,
  });
  res.redirect(req.originalUrl.split('?')[0]);
});
//-------------------creating booking by checkout sessions by client---------------

//--------------------using factory handler--------------------
//Get All bookings
exports.getAllBookings = factory.getAll(Booking);

//create booking
exports.createBooking = factory.createOne(Booking);

//Get booking
exports.getBooking = factory.getOne(Booking);

//update Booking
exports.updateBooking = factory.updateOne(Booking);

//delete Booking
exports.deleteBooking = factory.deleteOne(Booking);
