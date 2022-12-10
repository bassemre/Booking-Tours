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
  //--add the objects of the schema options to define virtuals properties
  //--virtual properties (we will define properties in our schema BUT?? not be persisted or saved in database)
  //not part of database
  //we use virtual properties when we make mathematics calculation to set property
  //schema.virtual('name of virtual property')
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);
//preventing dublicate review for same tour by user(user write one review for one tour)using index
reviewSchema.index({ user: 1, tour: 1 } /*some options*/, { unique: true });
//now each combination of tour and user in each review has always to be unique
//preventing dublicate review for same tour by user(user write one review for one tour) using index

//--pre-middleware to Populate tour and user in Reviews--------
//behaind the scence we make two Query by mongoose one for tour and another for user
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
//--pre-middleware to Populate tour and user in Reviews--------

//--------statics methods on schema--------
//to calculate average rating of the tour(average reviews ratings)
//same instanced methods(instanced method avaliable to document ) but in statics method (this) actually points to Model directly so we can use aggregate directly
//function is now inside model not current document
//aggregate method to the model not document
//aggregate contains stages
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  /*/aggregate return promise*/ const stats = await this.aggregate([
    //1st stage(matches all reviews in review model conatins tour:tourId)
    {
      $match: { tour: tourId }, //tour(in review schema):tourId(parameter)
    },
    //2nd stage (grouping this review by tourId) --->test that in postman to revision
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

//to call this statics.calcAverageratings each time we create new review we use document middleware
reviewSchema.post('save', function () {
  //this points to the current document(review) being saved
  //function (calcAverageRatings)  is now inside model not current document
  /*Review.calcAverageRatings(this.tour);*/
  //this for current review and tour for tour id(object id)
  //the proplem here Review is not defined at this point (code run seq and we define the review bottom in the bottom)
  //to solve this proplem we add this.constructor ---> this for current document ,constructor for the model
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //the goal we need to access the current review document
  //but this points to current query
  this.r = await this.findOne(); //find the query review from DB and save them to this.r(review document in DB)
  //untill this point we get the old review from DB without the updating verison
  //but no proplem we intrerested to the  tour id
  //untill this point if we call calcAverageRatings we use the non updated data (because pre middleware ) so we need the updated data
  //-------> then passes to post middleware
  //console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  //this.r = await this.findOne(); //DOSENT NOT WORK HERE ,because Query at post has already excuted
  console.log(this.r.tour); //for test
  await this.r.constructor.calcAverageRatings(this.r.tour._id); //this.r.constructor equal to Review(model)
});

//--------statics methods on schema--------

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
