/**
 * Common database helper functions.
 */

import idb from 'idb';
let dbPromise;
class DBHelper {

  /**
   * open db Database
   */
  //if browser doesn't support sw, don't open db
  static openDB() {
    return idb.open('restaurants', 1, (upgradeDb) => {
      upgradeDb.createObjectStore('restaurants', {keyPath: 'id'})
    });
  }

  /**
   * Get Data From idb 
   */
   static getData(){
     dbPromise = DBHelper.openDB();
     return dbPromise
     .then((db) => {
       if(!db) return; //initial load
       let tx = db.transaction('restaurants');
       let store = tx.objectStore('restaurants');
       return store.getAll();
     })
   }

   /**
   * Reviews URL
   */
  static get REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.getData()
    .then((data) => {
      //If it exists in idb, return it
      if(data.length > 0) {
        return callback(null, data);
      }
      //if there is not data fetch from the server
      fetch(DBHelper.DATABASE_URL ,{credentials:'same-origin'})
      .then((data) => {
        return data.json();
      })
      .then((res) => {
        dbPromise.then((db) => {
          if(!db) return;

          let tx = db.transaction('restaurants', 'readwrite');
          let store = tx.objectStore('restaurants');

          res.forEach((restaurant) => {
            store.put(restaurant);
          });

          //Keep entries less than 26
          store.openCursor(null, "prev")
          .then((cursor) => {
            return cursor.advance(26);
          })
          .then(function deleteRest(cursor){
            if (!cursor) return;
            cursor.delete();
            return cursor.continue().then(deleteRest);
          });
        });
        return callback(null, res)
        })
      
      .catch((err) => {
      //const error = (`Request failed. Returned status of ${data.status}`);
      //data was causing problems after browserify/babelify
      console.log('dbhelper fetch restaurants catch', err);
      callback(err, null);
      });
    });
}
    

  
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        console.log("main fetchRest by neigh", error);
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

/**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

  /*-----------------------Fetching Reviews-------------------------- */

static fetchRestaurantReviewsById(id, callback) {
  const reviewURL = DBHelper.REVIEWS_URL + "/?restaurant_id=" + id;
  fetch(reviewURL)
  .then(res => {
    res.json()
    .then((data) => {
      callback(null, data)
    })
  })
  .catch((error) => callback(error, null))
}



/*Special thanks to Doug Brown aka TheInfiniteMonkey for his Udacity walkthrough of this project*/
}

module.exports = DBHelper;