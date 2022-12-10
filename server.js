//create server.js file
//(to have every thing related to express in file (app.js))(application file)
//(and every thing related to server in another file (server.js) )
const mongoose = require('mongoose');
require('dotenv').config();
//connect this file to node app (read variables from .env file and save it into node js environment variables)
//put this before require app(we couldnt read (process.env.NODE_ENV)before (config dotenv))

//----------catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!! SHUTDOWN ..............');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
//IMPORTANT***********(when we run server.js the require function for('./app') will read and run app.js file  )

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
); //get database string (to connect mongodb atlas to nodejs and express)and place holder password

//1st arg (connection string ) 2nd arg (some options for coneections)
//mongoose.connect return promise
//after promise resolved call back function at (then) will be excuted
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('DB connection sucesssful!'));

const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
}); //to start a server //port is event (return to observer pattern)
// if any request sent just the handler with this request will be executed and not other top level code
//if any changes in files (server will be restart)(and all top level codes will be executed)

//----------unhandled rejection
//everytime of rejection promises , process object emit event called unhandledRejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION!! SHUTDOWN ..............');
  console.log(err);
  server.close(() => process.exit(1)); //to shut down our application (PROPLEM=>immediatly abort all the requests that are currently still running ) SOLVE (shutdown gracefully)
  //to shutdown gracefully at first we must close the server se we add server.close(give the server ,basically time to finish all pending requests)
});
