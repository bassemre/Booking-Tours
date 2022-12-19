//const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/toursModels'); //require Tour model (mongoose model) to make crud operations in this model
const APIFeatures = require('./../utilities/apiFeatures'); //,Make all filtering at this file
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');

//--------multer middleware cofigure to upload tour images--------

//1)-----------MULTER Storage property-------------
const multerStorage = multer.memoryStorage();
//-----------MULTER Storage property-------------
//2)-----------MULTER Filter property-------------
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('not an image!. plaease upload only images. ', 400),
      false
    );
  }
};
//-----------MULTER Filter property-------------

//3)-------fill multer middleware by options from 1,2
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
const uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1, //we can upload one image in imageCover field
  },
  {
    name: 'images',
    maxCount: 3, //we can upload 3 images in images field
  },
]);

//--------multer middleware cofigure to upload tour images--------

//-----------resize user photo middleware-------------
//image processing after uploaded file
const resizeTourImages = catchAsync(async (req, res, next) => {
  //at this point we have req.files(images uploaded) not just req.file(IMP)
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  //1)processing Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; //because we define the format at sharp to be jpeg
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //90% quality
  //resize height to width to be 2/3

  //2)processing tour images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);
      //push to images array
      req.body.images.push(fileName);
    })
  );
  console.log(req.body.images);
  next();
});

//-----------resize user photo middleware-------------

//--middleware(Alias)
const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage , price';
  req.query.fields = 'name ,price , ratingsAverage,summary,difficulty';

  next();
};

//2)-------ROUTES HANDLER(tour handler)

//-------ROUTES HANDLER

const getAllTour = catchAsync(async (req, res, next) => {
  //--BUILD QUERY(query strin in url ?field1=value1&field2=value2 to be in mongoose method {field1:value1(typed), field2:value2(typed) }

  //--EXCUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitingFields()
    .paginate();
  const tours = await features.query;
  //--SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestDate: req.requestTime,
    result: tours.length, //to show the number of tours (tours is array of multiple objects)
    data: {
      tours: tours,
    },
  });
});

//we can add factory function for get tour (factory.getOne())but must put parameter for populate options factory.getOne(Tour,reviews)
const getTour = catchAsync(async (req, res, next) => {
  //-----NEW CODE FOR GET TOUR AFTER ADDING MONGOOSE
  const tour = await Tour.findById(req.params.id).populate('reviews'); //reviews is virtual field

  if (!tour) {
    //if no tour from catchAsync because tour:null (check at postman)
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

//---------------Create tour by Factory Functions--------
const createTour = factory.createOne(Tour);

//---------------Create tour by Factory Functions--------

//---------------Update tour by Factory Functions--------
const updateTour = factory.updateOne(Tour);

//---------------Update tour by Factory Functions--------

//---------------delete tour by Factory Functions--------
const deleteTour = factory.deleteOne(Tour);

//---------------delete tour by Factory Functions--------

//----IMP STATISTICS
//---Aggregation statistcs pipelines(search for this at mongodb documentations to see aggregate pipeline and operators $)
//grouping and matching

//to calculate avg or min or max or sum from mongodb documentation{$(operator):'$name of the field')}
//ex (avgPrice: { $avg: '$price' },

const getTourStatistcs = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }, //1st stage matches to collect documents have this match(match to select documents)
      },

      {
        $group: {
          _id: '$difficulty', // group the documents by the name of the field
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRatings: {
            $avg: '$ratingsAverage',
          },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },

      {
        $sort: { avgPrice: 1 /* for ascending*/ }, //sort by the results from group stages(we use the field name from group stage not the field from collection)
      },
    ]);

    res.status(200).json({
      status: 'sucess',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

const getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; //2021
    const plan = await Tour.aggregate([
      //UNWIND STAGE
      {
        $unwind: '$startDates',
        //to deconstruct an array field from te info documents and then output one document for each element of the array
        //we want to have on tour for each strings in the array of field(startDates)
        //   string in array جديدة لكل  documents  هفككها و هعمل array of strings  مكون من field
      },

      //MATCH STAGE

      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), //to get year plan start of the year and the end of same year
            $lt: new Date(`${year}-12-31`),
          },
        }, //match to select documents
      },

      //GROUP STAGE

      {
        $group: {
          _id: { $month: '$startDates' }, //month operator from mongodb return the month of the date in number from 1 to 12
          numOfTours: { $sum: 1 }, //for each of documents we add 1 (to get number of tours in each month)
          tours: { $push: '$name' }, //not only how many tours fron numoftours but get the tours and the tours is array so we add push operator
        },
      },

      //ADDFIELDS STAGE

      {
        $addFields: { month: '$_id' }, // to add field and his value is the value of _id
      },

      //Project stage
      //we add 0 or 1
      {
        $project: { _id: 0 }, //to dont show _id
      },

      //Sort Stage
      {
        $sort: { numOfTours: -1 /*descending*/ },
      },

      //Limit Stage
      //to limit the number of documents
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'sucess',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
const getToursWithin = catchAsync(async (req, res, next) => {
  //  /tours-within/:distance/center/:latlng/unit/:unit
  //  /tours-within/233/center/-40,45/unit/mi
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  //send response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.00062137 : 0.001; //to convert unit from meter to mile  by *0.00062137 otherwise convert to Km by *.001

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  //console.log(distance, lat, lng, unit); for testing

  //---------------IMP all calc in aggeregation pipeline and it applied on model------------
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point', //to make type geojson
          coordinates: [lng * 1, lat * 1], //the point that we start to claculate or distance from him (multiply *1 to convert to number)
        },
        distanceField: 'distance', //the field that all the calculating distances will be stored
        distanceMultiplier: multiplier, //to convert to miles or Km(because from distanceField all distance in meters)
      },
    },

    {
      $project: { distance: 1, name: 1 },
    },
  ]);
  console.log(distances);

  //send response
  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});
module.exports = {
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
};
