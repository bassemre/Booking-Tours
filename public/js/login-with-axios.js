import axios from 'axios';

export const login = async (email, password) => {
  console.log(email, password);
  const data = {
    email: email,
    password: password,
  };
  console.log(data);
  try {
    //pass an option of request in axios
    //axios return a promise
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login', //login end point from api
      //data in the body
      data: {
        email: email,
        password: password,
      },
    });
    //to reload to main page
    if (res.status === 201) {
      alert('You are LoggedIn successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    alert(err);
  }
};
