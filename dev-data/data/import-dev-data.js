//IMPORTING DEVELOPMENT DATA TO DATABASE(import data to database or delete data from db)
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const Tour = require('./../../models/toursModels');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('DB connection sucesssful!'));

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA TO DATABASE
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); //to retrieve users from users.json without passwordConfirm(turn validator off)
    //before loaded user data comment all middleware that encrypted password(password already encrypted in users.json) and load data to DB  then put this middleware again
    await Review.create(reviews);

    console.log('data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //to stop application
};

//DELET ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
//Check process.arqv
// when run file (node dev-data/data/import-dev-data.js --import or delete)
//1st arg node path
//2nd arg file path
//3rd arg is --import or --delete ()
//console.log(process.argv);
