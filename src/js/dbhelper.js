/**
 * Common database helper functions.
 */

import idb from 'idb';

/**
 * Using Switch up from Jake Archibald's example of IDB with Promises to create all stores with fall through
 */
const dbPromise = idb.open("restaurants", 3, upgradeDB => {
    switch(upgradeDB.oldVersion) {
      case 0:
        upgradeDB.createObjectStore("restaurants", {keyPath: "id"});
      case 1: 
        upgradeDB.createObjectStore("pending", {keyPath: "id", autoIncrement: true});
      case 2:
        {
          const reviewsStore = upgradeDB.createObjectStore("reviews", {keyPath: "id"});
          reviewsStore.createIndex("restaurant_id", "restaurant_id");
        }
    }
  });

class DBHelper {

  /**
   * Get Data From idb 
   */
   static getData(){
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

  /**
 * fetch reviews by id
 */

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


/**
 * Handling fav clicks and adding reviews when on and offline
 */


static favToggle(id, status) {
  const favorite = document.getElementById("fav-button-" + id);
  //turns off the ability to click a fav until after processing is over to prevent over clicking
  favorite.onClick = null;

  DBHelper.favUpdate(id, status, (error, res) => {
    
    if(error) {
      console.log("There was an error processing favoriting");
      return;
    }
    const fav = document.getElementById("fav-button-" + res.id)
    fav.style.background = res.value ? `url('../img/star_filled.svg') no-repeat` : `url('../img/star_empty.svg') no-repeat`;
  });
}


/**
 * calls functions to update the cache and add to the saving queue
 */
static favUpdate(id, status, callback) {
  //url to update favorite status
  const url = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${status}`;
  const method = "PUT";

  DBHelper.updateCache(id, status);
  DBHelper.addToQueue(url, method);

  //goes back to functin before and sends data for changing icon and error if there is one
  callback(null, {id, value: status});
}


/**
 * changes the favorite status of a restaurant in the idb restaurants objectStore
 */
static updateCache(rest_id, newData) {
  dbPromise
  .then(db => {
    const tx = db.transaction("restaurants", "readwrite")
    const store = tx.objectStore("restaurants");
    store.get(rest_id)
    .then(res => {
      const entry = res;
      entry.is_favorite = newData;
      dbPromise
        .then(db => {
          const tx = db.transaction("restaurants", "readwrite");
          const store = tx.objectStore("restaurants");
          store.put(entry);
          console.log("entry : ", entry);
          tx.complete;
        })
        .catch(error => {
          console.log("There was an error updating the idb entry");
        });
    })
  })
  .catch(error => {
    console.log("dbhelper updateCache error :  ", error);
  })
};

  /**
 * Adds an entry to the pending object store and sets in motion the calls to send that data to the api
 */
  static addToQueue(url, method, body) {
    dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending")
      .put({ data: {url, method, body}})
    })
    
    .then(DBHelper.nextItem())
    .catch(error => {});
  };


   /**
 * works like a recursive function calling the next function over and over until the pending object store entries have been updated in the api
 */
  static nextItem() {
    DBHelper.updateApi(DBHelper.nextItem);
  }

  /**
 * works like a recursive function calling the next function over and over until the pending object store entries have been updated in the api
 */
  static updateApi(callback) {
    let url;
    let method;
    let body;

    dbPromise.then(db => {
      //If there are no object stores return. db.Object store is a string
      if (!db.objectStoreNames.length) {
        db.close();
        return;
      }

      const tx = db.transaction("pending", "readwrite");
      tx.objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            console.log("There are no items waiting to be sent to the api");
            return;
          }
         
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = JSON.stringify(cursor.value.data.body);

            const entry = {
            body: body,
            method: method
          };

          //Makes sure your entry has all needed properties. Put doesn't need a body
          if ((!url || !method) || (method === "POST" && !body)) {
            cursor
              .delete()
              //starts the process over again for the next entry
              .then(callback());
            return;
          };

          fetch(url, entry)
            .then(res => {
            // if your response isn't ok or redirected it means you are offline
            if (!res.ok && !res.redirected) {
              console.log("The fetch did not work, you may be offline");
              return;
            }
          })
            .then(() => {
              const sent = db.transaction("pending", "readwrite");
              sent.objectStore("pending")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      //starts the process over again for the next entry
                      callback();
                    })
                })
            })
        })
        .catch(error => {
          console.log("Error deleting entry from pending");
          return;
        })
    })
  }

  

   /**
 * called from addReview function in review.js
 */
  static addReview (id, name, rating, comment, callback) {
  
    //Disable the save review button while processing. It is turned back on in the main function
    const saveButton = document.getElementById('review-save');
    saveButton.onclick = null; 

    const entry = {
      restaurant_id: id,
      name: name,
      createdAt: Date.now(),
      rating: rating,
      comments: comment,
    }
    
    DBHelper.saveReview(id, entry, (error, res) => {
      if(error) {
        callback(error, null);
        return;
      }
      
      callback(null, res)
    });
  }

   /**
 * sends the review entry to functions updating the cache and adding to the pending queue
 */
  static saveReview(id, entry, callback) {
    const url = `${DBHelper.REVIEWS_URL}`;
    const method = "POST";

    DBHelper.updateReviewInCache(id, entry);
    DBHelper.addToQueue(url, method, entry);

    callback(null, null);
  }

    /**
 * Adds a review to the idb reviews objectStore
 */
  static updateReviewInCache(id, entry) {
    dbPromise.then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");

      store.put({
        id: Date.now(),
        restaurant_id: id,
        data: entry
      });
      return tx.complete;
    });
  }

/*Special thanks to Doug Brown aka TheInfiniteMonkey for his Udacity walkthrough of this project, 
To Jake Archibald for his idb with promises page on github*/
}

module.exports = DBHelper;
