const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs'); //npm i bcryptjs
const crypto = require('crypto'); //node core module to generate random token (not jwt)

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please tell us your name!'],
    unique: true,
    //maxlength,minlength only available to string
    maxlength: [40, 'A user name must have less or equal 40 characters '], //data validator ('A user name must have' called error message)
    minlength: [10, 'A user name must have more or equal 10 characters '],
  },
  email: {
    type: String,
    required: [true, 'please provide your email'],
    unique: true,
    lowercase: true, //not validator but to convert email to lower case
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  //admin
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], //enum for validate possible values
    default: 'user',
  },

  //admin
  password: {
    type: String,
    required: [true, 'please provide a password'],
    //maxlength,minlength only available to string
    minlength: [8, 'A password must have more or equal 8 characters '],
    select: false, //dont show password in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    //in validator function we return true or false if false validator will send error message
    //VALIDATE only works for SAVE or Create !!!!
    validate: {
      validator: function (el) {
        return el === this.password; //(passwordconfirm)===(password) will return true
      },
      message: 'passwords are not the same!',
    },
  },
  passwordChangedAt: Date, //formated in postman "year-month-day"

  passwordResetToken: String,
  passwordResetExpires: Date, //reset token has expire time(security measure)

  //for deactivate user account
  active: {
    type: Boolean,
    default: true, //active
    select: false, //not showed in o/p
  },
});

//------encrypt password (use document middleware(pre middleware))--------
//this pre middleware works between getting the data and saving it into Db
userSchema.pre('save', async function (next) {
  //this===> refer to current document (IMP)
  //if the password has not been modified(exit this function)
  //only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //hash password with cost 12
  //hash is async so it returns promise
  this.password = await bcrypt.hash(this.password, 12);
  //delete the password Confirm field
  this.passwordConfirm = undefined;
  next();
});

//this pre middleware to put changedPasswordAt(resetpassword)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next(); //this.New is nice property in mongoose(if this npt new document)
  this.passwordChangedAt = Date.now() - 1000; //one second before because lag of program (to ensure the token was issued(iat))
  return next();
});

//Query middleware (deleteMyAccount)(deactivate account )(only works with find)
//somthing that will happen before Query (find)
userSchema.pre(/^find/, async function (next) {
  //this point to the current Query
  this.find({ active: true }); //to find all user with active true before Query
  next();
}); //(/^find/) that mean any query starts with find

//-----instanced methods (so therefore is avaliable on all the user documents )
//the goal of this function return true(if the passwords are the same ) or false
//compare() asynch compare the given data to the given hash
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//-----instanced methods to check if user change password after token was issued
//userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
// if (this.passwordChangedAt) {
//   changedTimestamp = parseInt(
//   this.passwordChangedAt.getTime() / 1000,
//   10 /*base number*/
//  ); //to convert passwordChangedAt from date structure to timestamp MS format like JWTTimestamp
//  console.log(this.changedTimestamp, JWTTimestamp);
// return JWTTimestamp < changedTimestamp; //return true
// }
// return false; //that mean user does not change her password
//};

//-----instanced methods at reset password(to generate rando token)
userSchema.methods.generateRandomToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); //32 random of characters

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //encrypted version of reset token to save in database
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //to convert 10m to ms

  return resetToken; //we need to send via email the unencrypted reset token not encrypted version and encrypted version will be useless to reset password
};

const User = mongoose.model('User', userSchema);

module.exports = User;
