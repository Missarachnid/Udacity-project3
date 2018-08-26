import DBHelper from './dbhelper.js';

let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
var initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibW1rZXBsZXIiLCJhIjoiY2pqMXp6b2t0MGVvMzN3b2FxbTA5aGcxciJ9.WalEAPr3uW5Iztb-PYr0FA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(self.newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/**
 * Get current restaurant from page URL.
 */
var fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
var fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  /**
   * Add source elements to picture element and update the src of the image, so it will display correctly
   */
  const picture = document.getElementById('restaurant-pic');

  let num;
  if(!restaurant.photgraph) {
    num = restaurant.id;
  } else {
    num = restaurant.photograph;
  }
  
  let origin = `/img/${num}.jpg`;
  let small = `/img/${num}-400.jpg`;

  const source1 = document.createElement('source');
  source1.media = '(min-width: 1481px)';
  source1.srcset = origin;
  const source2 = document.createElement('source');
  source2.media = '(max-width: 1480px) and (min-width: 769px)';
  source2.srcset = small;
  const source3 = document.createElement('source');
  source3.media = '(max-width: 768px) and (min-width: 490px)';
  source3.srcset = origin;
  const source4 = document.createElement('source');
  source4.media = '(max-width: 489px)';
  source4.srcset = small;
  picture.append(source1);
  picture.append(source2);
  picture.append(source3);
  picture.append(source4);

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = `An image of ${restaurant.name}`;
  image.src = origin;
  

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
var fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
var fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
var createReviewHTML = (review) => {
  const li = document.createElement('li');
  //Added some elements to create review div like the example
  const holder = document.createElement('div');
  const name = document.createElement('p');
  name.setAttribute('class', 'name');
  holder.setAttribute('class', 'holder');
  name.innerHTML = review.name;
  holder.appendChild(name);

  const date = document.createElement('p');
  date.setAttribute('class', 'date');
  date.innerHTML = review.date;
  holder.appendChild(date);
  li.appendChild(holder);

  const rating = document.createElement('p');
  rating.setAttribute('class', 'rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('class', 'comments');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
var fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  //Added aria-current attribute for accessiblity
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
var getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Ensures that space key will work for enter on keyboard navigation through site
 */
var ensureClick = (e) => {
  e.preventDefault();
  let code = event.charCode || event.keyCode;
    if((code === 32)|| (code === 13)){
      e.target.click();
  }
}