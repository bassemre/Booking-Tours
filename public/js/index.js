import '@babel/polyfill';
import { login } from './login-with-axios';

//DOM Elements
const loginForm = document.querySelector('.form');

//add event
//specify id elements(#email)(#password)
//.form the class in login.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
