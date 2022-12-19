const catchAsync = require('../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const APIFeatures = require('./../utilities/apiFeatures');
//----------------------Factory functions---------------------

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
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitingFields()
      .paginate();

    const docs = await features.query;

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
