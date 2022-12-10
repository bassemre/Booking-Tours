//---------------alert-----------------
//we move it from alert.js because we have proplem in browser about dont define require or import (we need to solve it !!!!!!!!!!)
const hideAlert2 = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

//type is 'success' or 'error' fron css file
const showAlert2 = (type, msg) => {
  hideAlert2();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert2, 5000);
};
//---------------alert-----------------

//--------------update user data by user(name,email,password) ----------------------
const updateSettings = async (data, type) => {
  //TYPE is either password or data
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMyData';

    //------for multi part form data we dont need to specify (headers--> content type)
    if (type === 'data') {
      //fetch return a promise
      var res = await fetch(url, {
        method: 'PATCH',
        body: data,
      });
    } else if (type === 'password') {
      var res = await fetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data), //because the value in the body most be in json format (app.use(express.json())only parse json format)
        headers: data ? { 'Content-Type': 'application/json' } : {},
      });
    }
    console.log(res);
    //to reload page
    if (res.status === 200) {
      showAlert2('success', `${type.toUpperCase()} updated successfully`);
    } else {
      showAlert2('error', `incorect ${type} format`);
    }
  } catch (err) {
    //fetch only catch network error so we must throw error to define any other errors
    console.log(err);
    showAlert2('error', err.data);
  }
};

//DOM ELEMENTS
const updatingForm = document.querySelector('.form-user-data');
const updatingPassword = document.querySelector('.form-user-settings');

//add event
//specify id elements(#name)(#email)
//-updating name or email
if (updatingForm)
  updatingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    //---update name ,email,photo (multi-part-form data)
    //const form = new FormData();
    /*const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;*/
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //IMP AT multi-part form data at fetch we dont need to specify data content-type  we make body:data only (IMP)-->So we don't need to specify 'content-type' when we send a fetch request.
    console.log(form);
    updateSettings(form, 'data');
  });
//.form-user-data the class in account.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form

//add event
//specify id elements(#currentpassword)(#password)(#passwordConfirm)
//-updating Password
if (updatingPassword)
  updatingPassword.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating.....';

    const currentpassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    const data = { currentpassword, password, passwordConfirm };
    await updateSettings(data, 'password');

    //--------delete password after changed from tab in website-----------------
    //1)await update settings

    document.querySelector('.btn--save-password').textContent = 'save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
//.form-user-settings the class in account.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form
