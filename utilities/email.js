const { convert } = require('html-to-text');

//1)--------SENDING EMAIL WITH NODEMAILER---------
const nodemailer = require('nodemailer');
//const pug = require('nodemailer');
//----------this useful for DEV MODE to test sending mailes----

// to send email from node js
/*
const sendEmail = async (options) => {
  //1)create a transporter(the service that will actually send the email)
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      password: process.env.EMAIL_PASSWORD,
    },
  });
  //2)define the email options
  const mailOptions = {
    from: {}, //mailtrap
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };
  //3)send the email with nodemailer
  await transporter.sendMail(mailOptions); //return a promise
};*/
//--------SENDING EMAIL WITH NODEMAILER---------

//2)--------SENDING EMAIL WITH SENDGRID---------

const sgMail = require('@sendgrid/mail'); // to send email from node js
pug = require('pug'); //to send html via email(options)
/*const sendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  //2)define the email options
  const mailOptions = {
    from: process.env.MY_SECRET_EMAIL, //from Sendgrid
    to: process.env.MY_SECRET_EMAIL, //(for test)
    subject: options.subject,
    text: options.message,
    //html
  };
  sgMail
    .send(mailOptions)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    }); //return promise
};*/

//--------SENDING EMAIL WITH SENDGRID---------

//-------------------------Create Email class from which we can create Email objects------------------------
//-------------------------we put sendGrid inside that class---------------------------------

//Classes are a template for creating objects.
//They encapsulate data with code to work on that data.
//The body of a class is the part that is in curly brackets {}. This is where you define class members, such as methods or constructor.
//this refere to the object(out from class)
//we access constructor by passing arguments to new object out from class
//we access and call  method by ---> new Email(arguments).nameofmethod()
module.exports = class Email {
  constructor(user, url) {
    //this refer to the new object out of Class Email

    //SEND in DEV mood to test
    if (process.env.NODE_ENV === 'development') {
      this.to = ' bassem@mailsac.com'; //fake email for test from mailsac website in dev mode
    } else {
      this.to = user.email;
    }
    this.from = `BassemRefaat <${process.env.MY_SECRET_EMAIL}>`; //from Sendgrid;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
  }
  //class methods
  //send the actual Email
  async send(template, subject) {
    //1)Render HTML Based on a pug template
    /*
 pug.renderFile(path, ?options, ?callback) 
path: string
The path to the Pug file to render
options: ?options
An options object, also used as the locals object
callback: ?function
Node.js-style callback receiving the rendered results. This callback is called synchronously.
returns: string
The resulting HTML string
var pug = require('pug');
var html = pug.renderFile('path/to/file.pug', options);
*/

    console.log(this.to);
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        //like locals in res.render
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      }
    );
    //2)Define the email options to pass in sendgrid
    const mailOptions = {
      from: this.from, //from class property
      to: /*options.email*/ this.to, //(for test)
      subject: subject,
      //text: 'hi',
      //text: htmlToText.fromString(html),
      text: convert(html),
      html: html,
    };
    //3)send Email
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail
      .send(mailOptions)
      .then(() => {
        console.log('Email sent');
      })
      .catch((error) => {
        console.error(error);
      }); //return promise
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours site!');
  }
  async sendPasswordReset() {
    await this.send(
      'resetPassword',
      'Your password reset token valid for only 10 minutes'
    );
  }
};
