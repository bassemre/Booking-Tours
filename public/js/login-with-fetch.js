//---------------alert-----------------
//we move it from alert.js because we have proplem in browser about dont define require or import (we need to solve it !!!!!!!!!!)
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

//type is 'success' or 'error' fron css file
const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
//---------------alert-----------------

//--------------LOGIN FUNCTIONALLITY----------------------

const login = async (email, password) => {
  const data = {
    email: email,
    password: password,
  };
  console.log(data);
  try {
    //fetch return a promise
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      body: JSON.stringify(data), //because the value in the body most be in json format (app.use(express.json())only parse json format)
      headers: data ? { 'Content-Type': 'application/json' } : {},
    });
    console.log(res);
    //to reload to main page
    if (res.status === 201) {
      showAlert('success', 'You are Logged In successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      showAlert('error', ' incorrect email or password');
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.data);
  }
};

//--------------LOGIN FUNCTIONALLITY----------------------

//--------------LOGOUT FUNCTIONALLITY----------------------
const logout = async () => {
  try {
    //fetch return a promise
    const res = await fetch('/api/v1/users/logout', {
      method: 'GET',
      //body: JSON.stringify(data), //because the value in the body most be in json format (app.use(express.json())only parse json format)
      //headers: data ? { 'Content-Type': 'application/json' } : {},
    });
    console.log(res);
    //to reload to main page
    if (res.status === 200) {
      showAlert('success', 'You are LOGOUT successfully!');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (err) {
    console.log(err);
  }
};

//--------------LOGOUT FUNCTIONALLITY----------------------

//DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
//DOM ELEMENTS
const signupForm = document.querySelector('.form--signup');
//add event
//specify id elements(#email)(#password)

//--------------signup FUNCTIONALLITY----------------------

const signUp = async (name, email, password, confirmPassword) => {
  const data = {
    name,
    email,
    password,
    passwordConfirm: confirmPassword,
  };
  try {
    //fetch return a promise
    const res = await fetch('/api/v1/users/signup', {
      method: 'POST',
      body: JSON.stringify(data), //because the value in the body most be in json format (app.use(express.json())only parse json format)
      headers: data ? { 'Content-Type': 'application/json' } : {},
    });
    //to reload to main page
    if (res.status === 201) {
      showAlert('success', 'please check your email!');
    } else {
      showAlert('error', ' incorrect email or password');
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.data);
  }
};

//--------------signup FUNCTIONALLITY----------------------

//add event
//specify id elements(#email)(#password)
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    //e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('passwordConfirm').value;

    signUp(name, email, password, confirmPassword);
  });
} else if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
} else if (logOutBtn) {
  //add event
  //specify id elements(#email)(#password)
  logOutBtn.addEventListener('click', logout);
}
//.nav__el--logout the class in login.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form

//.form--login the class in login.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form

//.form--login the class in login.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form
