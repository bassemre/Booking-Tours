const mongoose = require('mongoose');
const Tour = require('./toursModels');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'please Add Your review'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'please Your rating of Your tour'],
    },

    CreatedAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a Tour.'],
    },
  },

  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
reviewSchema.index({ user: 1, tour: 1 } /*some options*/, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name -guides', //to only select tour name
  }).populate({
    path: 'user',
    select: 'name photo', //to only select user name and photo
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, //tour(in review schema):tourId(parameter)
    },
    {
      $group: {
        _id: '$tour', //group reviews by tour
        numOfRating: { $sum: 1 }, //add 1 for each review that we have
        avgRating: { $avg: '$rating' }, //average for ratings in review model(collection)
      },
    },
  ]);

  console.log(stats);
  //to presisted updated data into DB(into tour collection) each time of creating new review on Tour
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numOfRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //if no stats that means no reviews so we set it again to default
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  console.log(this.r.tour); //for test
  await this.r.constructor.calcAverageRatings(this.r.tour._id);
});

//--------statics methods on schema--------

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
