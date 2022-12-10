const catchAsync = require('../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const APIFeatures = require('./../utilities/apiFeatures');
//----------------------Factory functions---------------------
//all of create handlers or updatae handlers or delete handlers in all controllers(tour,user,review,...) really all just look basically the same
//dublicate code
//imagine we wanted to change some(htpp status code or status message )we will have to go into each controller and change all the handlers
//so why not simply create (FACTORY functions) that gonna return these handlers for us
//factory function (function return another function(our handler function) )

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);
    //doc for (tour,user,review,each doc)
    //Model (Tour,User,Review,each Model)
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    //204 response of delete request(meanning no content because we dont sent any data back )
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //find by id and update in one line
    //1st arg (to find) 2nd arg( to update) 3rd arg (some options)
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // to return object after update was applied(if we dont set new:true by default findByIdAndUpdate return the original )
      runValidators: true, //if true runs update validators to validate the update operation against the model schema
    });

    if (!doc) {
      next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const newDoc = await Model.create(req.body);
    // console.log(newDoc);
    res.status(201).json({
      status: 'sucesss',
      data: {
        data: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //--BUILD QUERY(query strin in url ?field1=value1&field2=value2 to be in mongoose method {field1:value1(typed), field2:value2(typed) }
    //--EXCUTE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitingFields()
      .paginate();
    //i have access to the class
    //now we need to pass query and querystring parameters
    //.filter().sort().....(to get access to filter&sort methods in the class)
    //const docs = await features.query.explain(); //explain to add som stats to the query
    const docs = await features.query;
    //--imp (check the diff between queryObj and req.query)
    //(query) still changed after all process of filtering query.sort().select().skip().limit()
    //and final answers awaited to be excuted in tours
    //--SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestDate: req.requestTime,
      result: docs.length, //to show the number of tours (tours is array of multiple objects)
      data: {
        docs: docs,
      },
    });
  });
