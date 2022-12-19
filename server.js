const mongoose = require('mongoose');
require('dotenv').config();

//----------catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!! SHUTDOWN ..............');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

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

const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//----------unhandled rejection
//everytime of rejection promises , process object emit event called unhandledRejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION!! SHUTDOWN ..............');
  console.log(err);
  server.close(() => process.exit(1)); //to shut down our application (PROPLEM=>immediatly abort all the requests that are currently still running ) SOLVE (shutdown gracefully)
  //to shutdown gracefully at first we must close the server se we add server.close(give the server ,basically time to finish all pending requests)
});
