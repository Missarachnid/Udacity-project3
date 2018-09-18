import DBHelper from './dbhelper.js';

let restaurant;



document.addEventListener('DOMContentLoaded', (event) => {  
  fetchRestaurantFromURL((error, restaurant) => {
    if(error) {
      console.log("Error retrieving restaurant Data");
    } else {
      fillBreadcrumb();
    }
  });
  //DBHelper.
});

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
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
var fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb-reviews');
  const li = document.createElement('li');
  const aLink = document.createElement('a');
  //Added aria-current attribute for accessiblity
  aLink.href = "/restaurant.html?id=" + restaurant.id;
  li.setAttribute('aria-current', 'page');
  aLink.innerHTML = restaurant.name;
  li.appendChild(aLink);
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