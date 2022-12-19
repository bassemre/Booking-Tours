const express = require('express');
const authController = require('../controllers/authController');
const {
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
} = require('./../controllers/userController');

//-b) USER RESOURCES
const userRouter = express.Router();

//---special routes for authentication--------
userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);

//---special routes for authentication--------

//---special routes for reset password(by user)--------
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword); //patch not post because we update user property
//---special routes for reset password(by user)--------

//protect all routes after this middleware
//----------------------ADD middleware for protect all routes instead of put authcontroller.protect in all of them------------
userRouter.use(authController.protect);
//----------------------ADD middleware for protect all routes instead of put authcontroller.protect in all of them------------

//---special routes for update password(by user)--------
userRouter.patch('/updateMyPassword', authController.updateMYPassword); //patch not post because we update user property
//---special routes for update password--------

//---special routes for update Data(by user)--------
userRouter.patch(
  '/updateMyData',
  uploadUserPhoto,
  resizeUserPhoto,
  updateMYData
); //(protect to check if the user logged in or not )(current user)
//upload is multer middleware function to upload photo and 'photo' is the name of the field in DB(see user controller)
//---special routes for update Data(by user)-------

//---special routes for delete user (by user)--------
userRouter.delete('/deleteMyAccount', deleteMyAccount); //(protect to check if the user logged in or not )(current user)
//---special routes for delete user (by user)-------

//---special routes for get user data (by user)--------
userRouter.get('/me', getMe, getUser); //(protect to check if the user logged in or not )(current user)
//---special routes for get user data (by user)-------

//-------restrict all routes after this middleware(only admin can go to this routes)------------
userRouter.use(authController.restrictTo('admin'));
//-------restrict all routes after this middleware(only admin can go to this routes)------------

//now the below routes will be protected and restricted by two middlewares

userRouter.route('/').get(getAllUsers).post(createNewUser);
userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = userRouter;
