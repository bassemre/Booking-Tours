const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const User = require('./../models/userModel');
const factory = require('./handlerFactory');

//-----------Multer middleware configure-----------------

//1)-----------MULTER Storage property-------------

const multerStorage = multer.memoryStorage();
//-----------MULTER Storage property-------------

//2)-----------MULTER Filter property-------------
//the goal to test if the uploaded file is an image or NOT
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

const uploadUserPhoto = upload.single('photo');
//-----------Multer middleware configure-----------------

//-----------resize user photo middleware-------------
//image processing after uploaded file
const resizeUserPhoto = catchAsync(async (req, res, next) => {
  //at this point we have req.file(photo uploaded)
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  //90% quality
  //resize height=width to be square images
  next();
});

//-----------resize user photo middleware-------------

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  //we make loop on object in javascript (obj) and for each field(el) if one of allowedfields
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  }); //Dom document object model
  return newObj;
};

//1)ROUTES HANDLER (USER HANDLER BY USER him self)(based on the current user(logged in ))

//A)--GET USER SPECIFIED DATA (/me)

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
  //then go to getUser middleware by factory.getOne(User)
};

//B)--UPDATE USER SPECIFIED DATA
const updateMYData = catchAsync(async (req, res, next) => {
  //1)Create Error if user POSTS password data(we update password in differnt part at auth controller )
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This Routes is not for password updates. please use /updatePassword'
      ),
      400
    );
  }

  //2)Filtered out unwanted fields name that are not allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email');

  console.log(req.file); //from multer middleware
  console.log(req.body);
  //add photo field to filter body when upload image
  if (req.file) {
    //add the photo property to the object
    filterBody.photo = req.file.filename;
  }

  //3)if not , Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'sucess',
    data: {
      user: updatedUser,
    },
  });
});

//---C)DELET USER (CURRENT USER)(BY USER HIMSELF)(inactive account not delete document in DB)(so user can active his account in the future)
const deleteMyAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false }); //from protect middleware
  res.status(204).json({
    status: 'sucess',
    data: null,
  }); //204 for deleted
});

//2)ROUTES HANDLER(user handler by admin)

//from factory functions
const getAllUsers = factory.getAll(User);

//from factory functions
const getUser = factory.getOne(User);

const createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! please use /signup instead',
  });
};

//from factory functions
//Dont update password with this
const updateUser = factory.updateOne(User);

//from factory functions
//the admin only has permission to delete user
const deleteUser = factory.deleteOne(User);

module.exports = {
  getAllUsers,
  getUser,
  createNewUser,
  updateUser,
  deleteUser,
  updateMYData,
  deleteMyAccount,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
};
