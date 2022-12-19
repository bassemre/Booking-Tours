const crypto = require('crypto');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync'); //wrap all async func in catchAsync to handling error
const AppError = require('./../utilities/appError');
const Email = require('../utilities/email');
const Booking = require('../models/bookingModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
//

//--------signup-------------
exports.signup = catchAsync(async (req, res, next) => {
  //create user
  //to limit the data come from user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const token = signToken(newUser._id);

  //----send cookie-----------
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //by this cookie will (only) be sent on an encrypted connection(using HTTPS)
    httpOnly: true, //this will make the cookie can not be accessed or modified in any way by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //make secure:true (https) in production mode only
  res.cookie('jwt', token, cookieOptions);
  //----send cookie-----------

  //sending welcome email----
  const url = `${req.protocol}://${req.get('host')}/me`; //to go to account page to upload user photo
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //send response
  res.status(201).json({
    status: 'sucess',
    token: token,
    data: {
      user: newUser,
    },
  });
});

//-------login using(email,password)-------------
exports.login = catchAsync(async (req, res, next) => {
  console.log(req.body, 'test in api');

  //1)read email ,password from body
  const email = req.body.email;
  const password = req.body.password;

  //2)Check if email,password exist (entering from user)
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  //3)Check if user exist&&password is correct

  const user /*user document*/ = await User.findOne({ email: email }).select(
    '+password'
  );
  //compare original password with hash(encrypt) password(by encrypt the password and compare it with encrypted one)
  //correctPassword is instanced methods (so therefore is avaliable on all the user documents )
  const correct = await user.correctPassword(
    password /*candidate pass*/,
    user.password
  ); //problem here if user doesnt exist this line of code will not be run so we need to add correct directly in if statement

  if (!user || !correct) {
    return next(new AppError('incorrect email or password', 401)); //401 for not authorized
  }

  //4) if everything ok, send token to client
  const token = signToken(user._id);

  //----send cookie-----------
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //by this cookie will (only) be sent on an encrypted connection(using HTTPS)
    httpOnly: true, //this will make the cookie can not be accessed or modified in any way by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //make secure:true (https) in production mode only
  res.cookie('jwt', token, cookieOptions);
  //----send cookie-----------

  //remove the password from output
  user.password = undefined;

  //send response
  res.status(201).json({
    status: 'sucess',
    token: token,
    data: {
      user: user,
    },
  });
});

//-------logout ----------------------
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), //expires after 10 second
    httpOnly: true,
  });

  res.status(200).json({ stutus: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)Get Token and check if its there
  //used req headers to set token
  let token; // if we put const token inside if block (will block scoped and token will not be define outside if block)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; //to get value after Bearer word [1] for second elemnt
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log(token);
  }

  //if no token send with the request
  if (!token) {
    return next(
      new AppError('You are not logged in!, please login to get access'),
      401
    ); //return to exit protect function
  }

  //2)verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // synch verify given token (we need to promisify this function to be async and return promise)
  //IMP promisify(jwt.verify) is the function that return promise and (token, process.env.JWT_SECRET) is the call and arq (function())
  console.log(decoded); //contain user id , created and expired time of token

  //3)check if user access route still exist (if user removed )
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('user doesnt exist'), 401);
  }
  //4)check if user changed password after the token was issued

  req.user = currentUser; //put the entire user data to the request objects
  res.locals.user = currentUser; //put any variable as local and then inside any pug template get access to this variable called user

  next();
});

//--remove catch async because we dont need any error here in rendered page
exports.isLoggedIn = async (req, res, next) => {
  try {
    //1)Get Token and check if its there
    if (req.cookies.jwt) {
      //2)verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      console.log(decoded); //contain user id , created and expired time of token

      //3)check if user access route still exist (if user removed )
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4)check if user changed password after the token was issued
      //there is loggedin USER
      //then make user accesable to our template
      res.locals.user = currentUser; //put any variable as local and then inside any pug template get access to this variable called user
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

//----middleware function to restrict users from certain routes
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is array roles['admin','lead-guide]. roules='user'
    if (!roles.includes(req.user.role)) {
      //role by default user
      //if roles=['admin','lead-guide] includes(specific for array elenents) req.user.role return true condition will be false
      //restrictTo middleware get access after protect middleware so we have req.user=currentUser
      return next(
        new AppError('You dont have permissions to perform this action!', 403) //means forbidden
      );
    }
    next();
  };
};

//------reset password(user forget his password)
//---first step
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('This is no user with email adress', 404));
  }

  //2)Generate random reset token(not jwt)
  const resetToken = await user.generateRandomToken();
  await user.save({ validateBeforeSave: false }); //for ex we dont need to confirm the password so we switch validators to be off //VALIDATE only works for SAVE or Create !!!!

  //3)send random token back to users email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    console.log(resetURL);
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'token send to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('there was an error sending the email ,try again later', 500)
    );
  }
});

//---second step
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on the token
  const encryptedVersionResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: encryptedVersionResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2)if token has not Expired,there is user ,set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  //if user exist
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; //deleted from database
  user.passwordResetExpires = undefined; //deleted from database
  await user.save(); //(IMP---------)use save not findOneandupdate because we need to run all validators again
  //3)update changedpasswordAt property for the user
  //--take alot of code so go to usermodel and make that by middleware
  //4)log the user in ,send JWT to the client});
  const token = signToken(user._id);

  //----send cookie-----------
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //by this cookie will (only) be sent on an encrypted connection(using HTTPS)
    httpOnly: true, //this will make the cookie can not be accessed or modified in any way by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //make secure:true (https) in production mode only
  res.cookie('jwt', token, cookieOptions);
  //----send cookie-----------

  //send response
  res.status(200).json({
    status: 'sucess',
    token: token,
  });
});

//-----UPDATE user password (current user that mean user logged in )
exports.updateMYPassword = catchAsync(async (req, res, next) => {
  //1)Get the user from collection
  const user = await User.findById(req.user.id).select('+password'); //because we come from protected middleware (authController.login)

  //2)Check if posted current password is correct!
  const comparedPassword = await user.correctPassword(
    req.body.currentpassword,
    user.password
  );
  if (!comparedPassword) {
    return next(new AppError('Please enter correct current password', 401));
  }

  //3)If so ,update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.save();

  //4)logged user in ,(send JWT)
  const token = signToken(user._id);

  //----send cookie-----------
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true, //by this cookie will (only) be sent on an encrypted connection(using HTTPS)
    httpOnly: true, //this will make the cookie can not be accessed or modified in any way by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //make secure:true (https) in production mode only
  res.cookie('jwt', token, cookieOptions);
  //----send cookie-----------

  //send response
  res.status(200).json({
    status: 'sucess',
    token: token,
    data: {
      user: user,
    },
  });
});
