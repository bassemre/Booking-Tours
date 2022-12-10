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
//IMP we removed the const multerStorage above because when we make image processing after uploading file by sharp
//the best way to dont save the file into the disk  but instead resizing at Memory instead of disk and then save to the disk
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
//upload is multer middleware function and in this case we upload multiple images(one in imageCover field)(three in images field)
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
  //to add imageCover to req.body and throw it to the next middleware(updateTour)
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
    //we used map instead of forEach  because
    //A)At forEach we make async await inside callback function and that not prevent next() middleware to be called
    //B)we used map to save an array of promises(async func return a promise)(see the diff between map , forEach)
    //c)so we will use promise.all
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
  //we prefill this query objects if the user didnt put any query string(but user put in url /top-5-cheap)
  //then got to getAllTour handler by this prefilled values
  next();
};

//2)-------ROUTES HANDLER(tour handler)

//------removed const tours = JSON.parse(fs.readFileSync after addin (********TOUR MODEL FROM DATABASE)
/*//must converted data from json to java script object(to be handled in programm)
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) //__dirname (mention for where the current script is located )
);
//every time tours array changed server will be restart!!!!!!!!! (important notes)(nodemon restart the server because file changed)*/

/*----removed this middleware because mongodb check validaition of ID automatically

//check id handler in middlware to check url param
const checkID = (req, res, next, val) => {
  console.log(val);
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'invalied id ',
    }); //(use return to exit function at this point (important)) and never call next()
  }
  next();
};
*/

//----removed check body of req (when creating new tour because mongoose will validate that )

/*const checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'missing name or price',
    });
  } //(use return to exit function at this point (important)) and never call next()
  next();
};*/

//-----handling error for async function (to catch our async func errors) then remove try,catch block from every RoutesHandler (make code more focused))
//make this for getAllTour, getTour only and dont refactoring the other handler to be REFRENCE

//EXPLANIN (catchAsync)
//-a)we add next to arguments to pass error to GLBOBAL ERROR handling MIDDLEWARE(IMP)
//-b)wrap the get all tour function in catchAsync  catchAsync(async (req, res, next) => ................}
//-c)when getAllTour is readed (not called by EXPRESS) catchAsync will be called using catchAsync()
//-d)and inside catchAsync we are calling fn using fn() with parameter req,res,next  fn(req, res, next)
//-e)the two proplems here(c,d) we dont need to call handler without Express(hit the roue url ) and catchAsync didnt know req,res,next parameter in fn(req, res, next)
//-f)to solve this proplems we make catch Async return another function  with req,res,next objects which is gona be assigned to getAllTour
//-g)from f we return function to be callback(callback must be a faunction)
//-g)and fn dont be excuted without call getAllTour by Express route handler (callback)tourRouter.route('/').get(getAllTour)

//conclousions(getAllTour should be equal function(returned function) not be the result of calling function( fn()  )
//see catcAsync.js

//-------ROUTES HANDLER

const getAllTour = catchAsync(async (req, res, next) => {
  //--BUILD QUERY(query strin in url ?field1=value1&field2=value2 to be in mongoose method {field1:value1(typed), field2:value2(typed) }

  //--EXCUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitingFields()
    .paginate();
  //i have access to the class
  //now we need to pass query and querystring parameters
  //.filter().sort().....(to get access to filter&sort methods in the class)
  const tours = await features.query;
  //--imp (check the diff between queryObj and req.query)
  //(query) still changed after all process of filtering query.sort().select().skip().limit()
  //and final answers awaited to be excuted in tours
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
  //.populate('guides');(remove populate because we put it in query middleware)
  //populate happens only in query not in database(IMP),that meaning in DB(guides field only contain the reference) , in Query(we fill the guides by actual data)
  //Tour.findOne({_id:req.params.id}) (_id(property that we are searching for from mongodb and (req.params.id) the value of property )

  if (!tour) {
    //if no tour from catchAsync because tour:null (check at postman)
    return next(new AppError('No tour found with that ID', 404));
    //add return to dont move to the next line to didnt send two responses (second response with tour:null )
    //next(somthing like error) this middleware is jump straight to global error handling middleware
    //-------IF WE MODIFY updateTour ,deleteTour with catchAsync we must add this condition att all of them--------
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });

  // const id = req.params.id * 1; //(to convert id param from string to number )
  // const tour = tours.find((el) => el.id === id); //(returns the value of the first element in the array if the value is true other wise returns false )
  //console.log(req.params);
  //res.status(200).json({
  // status: 'success',
  // data: {
  //  tour,
  // },
  //});
});

//---------------Create tour by Factory Functions--------
const createTour = factory.createOne(Tour);

//--NEW CODE BY MONGOOSE
//a-const newTour = new Tour({});
//b-newTour.save();
//replace a , b by (Tour.create({}) and create return a promise and we can use then or (async await ))

//--------------deleteted after add factory functions--------------
/*
const createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);
  // console.log(newTour);
  res.status(201).json({
    status: 'sucesss',
    data: {
      tour: newTour,
    },
  });
});*/
//--------------deleteted after add factory functions--------------

//console.log(req.body);
//---- const newId = tours[tours.length - 1].id + 1;
//const newTour = Object.assign(
//  { id: newId } /*(target)*/,
//req.body /*(source)*/
//); //create a new object by merging two existing object(from source to target object and return target (mixed) of two object)
//tours.push(newTour);
//fs.writeFile(
//`${__dirname}/dev-data/data/tours-simple.json`, //(filepath),
//JSON.stringify(tours), //(content)
//-----() =>
//res.status(201).json({
//message: 'success',
//data: {
// tour: newTour,
// },
//});
//);

//---------------Create tour by Factory Functions--------

//---------------Update tour by Factory Functions--------
const updateTour = factory.updateOne(Tour);

/*
const updateTour = async (req, res) => {
  try {
    //find by id and update in one line
    //1st arg (to find) 2nd arg( to update) 3rd arg (some options)
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // to return object after update was applied(if we dont set new:true by default findByIdAndUpdate return the original )
      runValidators: true, //if true runs update validators to validate the update operation against the model schema
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};*/
//---------------Update tour by Factory Functions--------

//---------------delete tour by Factory Functions--------
const deleteTour = factory.deleteOne(Tour);

//--------before add Factory function------------------
/*const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndRemove(req.params.id);

  if (!tour) {
    return next(new AppError('No Tour found with that ID', 404));
  }

  //204 response of delete request(meanning no content because we dont sent any data back )
  res.status(204).json({
    status: 'success',
    data: null,
  });
});*/
//--------before add Factory function------------------

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

      /*
      //----Repeat stages
      {
        $match: { _id: { $ne: 'easy' } }, //repeat matche to exclude easy 
      },
      */
    ]);
    //we pass in aggregate method from mongoose array of stages
    //each stage as object with $
    //we can repate stages
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

  //unit === 'mi'? that mean if unit is miles const radius =distance/3963.2 and if not distance/6378.1
  //3963.2 radius of the Earth in miles
  //6378.1 radius of the Earth in KM

  if (!lat || !lng) {
    next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }
  //console.log(distance, lat, lng, unit); for testing

  //-Query steps(specify filter object) in find method
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  //$geoWithin-->Geospatial operator (IMP)
  //$centerSphere-->center sphere operator takes an array of coordinates(lng first then lat) and radius(in radians)
  //we need to add index to startLocation to improve search performance

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
    //in geospatial aggregation pipe line  has only one stage called geoNear and always to be the first stage
    //but untill now we will get the error because aggregate middleware has stage before so $geonear will be second stage
    //som we must put if condidtion so if $geoNear stage will be founded dont run this aggregation middleware(untill now i removed it)
    //geoNear it requires at least one of our fields contain geospatial index (like start location---> contain 2dSphere)
    //so geoNear is automatically make his calculation on startLocation field
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
      //second stage (project stage)(to get only the name of the tour and the distance)
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
