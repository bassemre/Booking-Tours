const mongoose = require('mongoose');
const slugify = require('slugify'); // npm i slugify
// to add - after any word in the syntax for ex(name:test tour 3) after pass slugify method(slug:test-tour-3)
const validator = require('validator'); //npm i validator(validator library)
//const User = require('./../models/userModel');

//use mongoose.Schema to specify a schema for our data (describing data and add some validations)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true, //dont have two tours with the same name
      //maxlength,minlength only available to string
      maxlength: [40, 'A tour name must have less or equal 40 characters '], //data validator ('A tour name must have' called error message)
      minlength: [10, 'A tour name must have more or equal 10 characters '],
      // validate: [validator.isAlpha, 'tour name must only contain characters)'],
      //from validator library (dont call isAlph() here just specify it by isAlpha )to be call back function when we validate data
      //isAlph to check if the string contains only letter from(a-z A-Z)
      //we put array to set error message
      //isAlph method dont allow any spaces in name and will send error
    },

    slug: String, //to add slug property (see document middleware)

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
        //INTERNAL magic of mongoose to get acess to VALUE from (val) in message error property
        //------short hand for validate(same as previous)----------
        /*validate: [
        function (val) {
          return val < this.price;
        },
        'discount price ({VALUE}) should be below the regular price',
      ],*/
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
      //GeoJSON(mongodb uses a special data format called GeoJSON in order to specify geospatial data )
      //startlocation object here not for schema type options but this object as embedded object
      //each field in this object will have own schema type options (nested)(one level depper)
      //to make startlocation object as (GeoJSON) we need 1-type ,2-coordinates properties at least
      //----(type)( schema type options) in this ex schema type options is {type:string , default:'point' ,enum:['point']}
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
    ], //to embed documents into another document(locations to tour) (we need to create an array of objects)(IMP)
    //------embedding locations into tours-----------

    //-------embedding tour guides into tour---------
    //---the idea here when creating a tour document the user(admin) add an array of user IDs(tour guides) and
    // we will then get the corresponding user documents(tour guides documents) based on these IDs and add them to our Tour documents(be pre middleware)
    /*guides: Array,*/
    //-------embedding tour guides into tour---------

    //--------referencing users(tour guides) to tour (child referencing) and deleting ebmedding method---------------
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
tourSchema.index({ startLocation: '2dsphere' }); //2dsphere because we are searching in earth but if two dimensional plan will be '2d'

//--virtual properties (we will define properties in our schema BUT?? not be persisted or saved in database)
//not part of database
//we use virtual properties when we make mathematics calculation to set property
//schema.virtual('name of virtual property')
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
  //we use normal function not arrow because arrow function dont allow this key word
});

//Virtual Populate (Tours and Reviews)(to make Reviews populate in Tours)(access Reviews in the Tour)(because parent dont know about its childrens)
tourSchema.virtual('reviews' /*virtual field*/, {
  ref: 'Review', //name of the model that we want to reference
  foreignField: 'tour', //the name of the field in the other model(Review) where the ref(parent ref)(Id) of the current model(tour model) is stored
  localField: '_id',
  //by ref,foreignField,localField we connected the two data sets together
});
//Virtual Populate (Tours and Reviews)(to make Reviews populate in Tours)(access Reviews in the Tour)(because parent dont know about its childrens)

//------mongoose middleware(pre(before),post(after))
//A)DOCUMENT middleware
//(pre,post) (another name (pre or post) save hook) :only runs before .save() and .create mongoose methods (imp middleware run between two objects)
//using 'save' event
//--we can add many documents middlewares
//in document middleware we have acess to the document that is being processed
tourSchema.pre('save' /*save event*/, function (next) {
  //console.log(this) in a save middleware this point to the currently processed document(created document)
  this.slug = slugify(this.name, { lower: true }); // to add - to the syntax for ex(name:test tour 3)after pass slugify method(slug:test-tour-3)
  next();
});

//----pre middleware to embed tourGuides documents into tour document------
/*tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  //array of user IDs(map method calls the callbackfnc one time for each element in the array) and return an array that contains the result
  //the proplem here async func will return an array of promises se we must add promis.all
  this.guides = await Promise.all(guidesPromises);
  next();
});*/

//----pre middleware to embed tourGuides documents into tour document------

//-----------post middleware have acess to document and next
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

//B)QUERY middleware
//(pre or post )(another name (pre or post) find hook) :only runs before query (like find() mongoose method)(use 'find' event)
//(pre)(another name (pre) findOne hook) :only runs before query (like findById() mongoose method)(use 'findOne' event)

//-------------pre middleware
//---'find' event to filter secret tour from (get all tour )
//add regular expression /^find/ to make event not for find only but for any query start with find (for ex findById)
tourSchema.pre(/*'find'*/ /^find/, function (next) {
  //console.log(this) in a (find) middleware this point to the current query (query document)
  this.find({ secretTour: { $ne: true } });
  //to filter secret tour
  //(we add $ne:true not (secretTour:false) because when we add ahe 9 tours we didnt define secret tour in schema)

  //this (query object) we can access to all this methods like (find()) but we can set property on this(query object)
  this.start = Date.now(); // set property on this(query object)
  next();
});

//---------Query middleware to populate userdata(guides) in tour documents-------
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides', // populated field
    select: '-_v -passwordXhangedAtAt ', //unselected fields
  });
  next();
});
//---------Query middleware to populate userdata(guides) in tour documents-------

//-------------post middleware
//post has access to all return query docs and next funcion
//--------------imp (this middleware will be run  after the query has already executed )

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  //console.log(docs);
  next();
});

//C)Aggregation middleware
//(to add hooks before or after aggregation happens)(use 'aggregate' event)
//------from previous Query middleware we hide secret tour but it still not secret in aggregation(aggregate() method)
//in aggregation middleware (this) point to current aggregation object
/*tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  //unshift() to add element in the start of the array
  //we will add another stage on the aggregation
  //shift() to add element in the end of the array
  console.log(this.pipeline()); //to show only pipeline objects (compare between this and this.pipeline())
  next();
});*/

//make model to add documents to this model , model follow schema construction
const Tour = mongoose.model('Tour', tourSchema); //name of the model must be upper case
//new document created out of tour model ( function constructor)
//same as java script classes when we use ESC6
//basically create new objects out of classes(called model.prototype)
//testTour called model prototype
/*const testTour = new Tour({
    name: 'the cairo',
    rating: 4.5,
    price: 30,
  });
  testTour
    .save()
    .then((doc) => console.log(doc))
    .catch((err) => {
      console.log('ERROR:', err);
    }); //to save documents in mongodb atlas (this save return promise)*/

module.exports = Tour;
