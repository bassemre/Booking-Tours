//---------------alert-----------------
//we move it from alert.js because we have proplem in browser about dont define require or import (we need to solve it !!!!!!!!!!)
/*const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

//type is 'success' or 'error' fron css file
const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};*/
//---------------alert-----------------

//-----------------------checkout-session-----------------
const stripe = stripe(
  'pk_test_51M9YgHGv8DSF7H2FAJ99EQzgWGgKKqRj0IYStv8thmFXRNgL0lFtLelp0tCcqMFEfFTIhmtDRRXUY9OQbE6aMZgb00MELvkyzc'
); //Publishable key

const bookTour = async (tourId) => {
  //1)Get the session from the server
  try {
    const session = await fetch(`/api/v1/booking//checkout-Session/${tourId}`, {
      method: 'GET',
    });
    console.log(session);
    if (session.status === 201) {
      showAlert('success', 'You are Logged In successfully!');
    } else {
      showAlert('error', 'failed to create session ');
    }
    //2)Create Checkout form +charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
  }
};
//-----------------------checkout-session-----------------

//DOM ELEMENTS
const bookBtn = document.getElementById('book-tour');

//add event
//specify id elements(#email)(#password)
if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing.......';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
//.form--login the class in login.pug
//submit -->event that the browser will fire off whenever the user clicks on the submit button on the form
