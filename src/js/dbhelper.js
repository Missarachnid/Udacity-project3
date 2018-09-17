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
  })
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


/**
 * Handling fav clicks and adding reviews when on and offline
 */


static favToggle(id, status) {
  const fav = document.getElementById("fav-button-" + id);

  //turns off the ability to click a fav until after processing is over to prevent over clicking
  fav.onClick = null;

  DBHelper.favUpdate(id, status, (error, res) => {
    
    if(error) {
      console.log("There was an error processing favoriting");
      return;
    }

    console.log("favToggle res is: ", res);
    const fav2 = document.getElementById("fav-button-" + res.id)
    fav2.style.background = res.value ? "url('../img/star_filled.svg') center center no-repeat" : "url('../img/star_empty.svg') center center no-repeat"
  });
}



static favUpdate(id, status, callback) {
  //url to update favorite status
  const url = `${DBHelper.DATABASE_URL}/${id}/?is_favorite=${status}`;
  const method = "PUT";

  DBHelper.updateCachedData(id, {"is_favorite": status});

  DBHelper.addToQueue(url, method);

  callback(null, {id, value: status});
}


static updateCachedData(id, updateData) {
    const dbPromise = idb.open("restaurants");
 
    dbPromise.then(db => {
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx
        .objectStore("restaurants")
        //getting the last key to check if there are values
        .get("-1")
        .then(value => {
          if (!value) {
            console.log("There was no cached data");
            return;
          }
          const data = value.data;
          const restaurantArr = data.filter(i => i.id === id);
          const rest = restaurantArr[0];
          // Find data by id and update that id with updated data
          if (!rest)
            return;

          const keys = Object.keys(updateData);
          keys.forEach(j => {
            rest[j] = updateData[j];
          })

          // Put the data back in IDB storage
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({id: "-1", data: data});
            return tx.complete;
          })
        })
    })

    // Update restaurant data by id
    dbPromise.then(db => {
      const tx = db.transaction("restaurants", "readwrite");
      const value = tx
        .objectStore("restaurants")
        .get(id + "")
        .then(value => {
          if (!value) {
            console.log("There is no cached data");
            return;
          }
          const restaurantData = value.data;
          console.log("Restaurant Data: ", restaurantData);

          if (!restaurantData)
            return;

          const keys = Object.keys(updateData);
          keys.forEach(k => {
            restaurantData[k] = updateData[k];
          })

          // Change the restaurant data
          dbPromise.then(db => {
            const tx = db.transaction("restaurants", "readwrite");
            tx
              .objectStore("restaurants")
              .put({
                id: id + "",
                data: restaurantData
              });
            return tx.complete;
          })
        })
    })
  }
  
  static addToQueue(url, method, body) {
    const dbPromise = idb.open("restaurants");
    dbPromise.then(db => {
      const tx = db.transaction("pending", "readwrite");
      tx
      .objectStore("pending")
      .put({ data: {url, method, body}})
    })
    .catch(err => {})
    .then(DBHelper.nextItem());
  }

  static nextItem() {
    DBHelper.tryCommitPending(DBHelper.nextItem);
  }

  static tryCommitPending(callback) {
    let url;
    let method;
    let body;
   
    dbPromise.then(db => {
      if (!db.objectStoreNames.length) {
        console.log("This database is not available (addToQueue)");
        db.close();
        return;
      }

      const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }
          
          const value = cursor.value;
          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.body;

          // Make sure reviews are not missing the body, and none are missing url, if so they are deleted

          if ((!url || !method) || (method === "POST" && !body)) {
            cursor
              .delete()
              .then(callback());
            return;
          };

          const props = {
            body: JSON.stringify(body),
            method: method
          }

          console.log("To be updated in db (tryCommitPending) :", props);
          fetch(url, props)
            .then(res => {

            // Check to see if you are offline
            if (!res.ok && !res.redirected) {
              return;
            }

          })
            .then(() => {
              // After this was updated in the database it can be removed from the pending queue
              const entry = db.transaction("pending", "readwrite");
              entry
                .objectStore("pending")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      callback();
                    })
                })
              console.log("This entry was removed from the queue because it was sent to the server");
            })
        })
        .catch(err => {
          console.log("Error reading pending entry", err);
          return;
        })
    })
  }


/*Special thanks to Doug Brown aka TheInfiniteMonkey for his Udacity walkthrough of this project, 
To Jake Archibald for his idb with promises page on github*/
}

module.exports = DBHelper;