const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal 40 characters '],
      minlength: [10, 'A tour name must have more or equal 10 characters '],
    },

    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //enum for possible values
      enum: {
        values: ['easy', 'medium', 'difficult'], //to validate value of difficulty between there values
        message: 'A difficulty is either:easy,medium,difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      //min,max available to number (dont minlength, maxlength==> allowed to string )
      min: [1, 'A tour must have ratingsAverage above 1.0 '],
      max: [5, 'A tour must have ratingsAverage below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //this function will be run each time that a new value is set for this field
      //Math.round(val) round number to integer for ex 4.66666---->5 so we will val*10 to be 46.7777---> 47 then divide the result by 10 to be 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,

      validate: {
        //custom validator method
        validator: function (val) {
          //(this) only point to the current document when we are ctreating new document
          //imp--------------this function here is not working for update tour
          return val < this.price;
        }, // call back function for custom validators (val for price discount)

        // error message
        message: 'discount price ({VALUE}) should be below the regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String], //Array of strings

    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date], //array of dates

    secretTour: {
      //see query middleware
      type: Boolean,
      default: false,
    },

    //------embedding locations into tours-----------
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      //----(coordinates)( schema type options)
      coordinates: [Number], //array of number(coordinates of points)(longitude , latitude)
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    //--------referencing users(tour guides) to tour (child referencing)---------------
  },

  //--add the objects of the schema options to define virtuals properties
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual Populate (Tours and Reviews)(to make Reviews populate in Tours)(access Reviews in the Tour)(because parent dont know about its childrens)
tourSchema.virtual('reviews' /*virtual field*/, {
  ref: 'Review', //name of the model that we want to reference
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre('save' /*save event*/, function (next) {
  //console.log(this) in a save middleware this point to the currently processed document(created document)
  this.slug = slugify(this.name, { lower: true }); // to add - to the syntax for ex(name:test tour 3)after pass slugify method(slug:test-tour-3)
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

tourSchema.pre(/*'find'*/ /^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now(); // set property on this(query object)
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // populated field
    select: '-_v -passwordXhangedAtAt ', //unselected fields
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  //console.log(docs);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
