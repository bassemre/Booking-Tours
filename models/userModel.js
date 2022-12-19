const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please tell us your name!'],
    unique: true,
    //maxlength,minlength only available to string
    maxlength: [40, 'A user name must have less or equal 40 characters '],
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

userSchema.pre(/^find/, async function (next) {
  //this point to the current Query
  this.find({ active: true }); //to find all user with active true before Query
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

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
