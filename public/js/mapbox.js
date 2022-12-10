/* eslint-disable */

console.log('hello from the client side :D');
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);
// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// https://account.mapbox.com

mapboxgl.accessToken =
  'pk.eyJ1IjoiYmFzc2VtcmVmYWF0IiwiYSI6ImNsYWlqNjkwdjAzOWszb3JxNzUyeTJmbzYifQ.MhALxwp_IFNp5trbTaYwJg';
//token

const map = new mapboxgl.Map({
  container: 'map', // container ID --->(in tour.pug we have the id element #map)
  style: 'mapbox://styles/mapbox/streets-v11', // style URL
  center: [-74.5, 40], // starting position [lng, lat]
  zoom: 9, // starting zoom
  projection: 'globe', // display the map as a 3D globe
});

map.on('style.load', () => {
  map.setFog({}); // Set the default atmosphere style
});
