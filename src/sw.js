import idb from "idb";

const staticCacheName = "restaurant-cache-v2";

const imageCache = "restaurant-imgs";


let allCaches = [staticCacheName, imageCache];

const toCache = [
  "/",
  "./restaurant.html",
  "./reviews.html",
  "./css/styles.css",
  "./js/bundle_main.js",
  "./js/bundle_restaurant.js",
  "./js/bundle_review.js",
  "./img/favicon.png",
];

/**
 * Must have access to idb to get restaurant and reviews data
 * Using Switch up from Jake Archibald's example of IDB with Promises to create all stores with fall through
 */
let dbPromise = idb.open("restaurants", 3, upgradeDB => {
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

 self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(staticCacheName)
    .then((cache) => {
      console.log("the cache is open");
      return cache.addAll(toCache);
    }).catch((err) => console.log("Error installing", err))
  );
});


  /**
   * Fetch Plan: seperate api 1337 vs. non api requests
   * Seperate review, restaurant under api: search for and return or fetch, save and return
   * Use existing code for non api, search for match and return or fetch, add to cache and return
   */

self.addEventListener("fetch", (event) => {
  let thisRequest = event.request;
  const fetchUrl = new URL(event.request.url);

  //handled by serveImage function
  if(fetchUrl.pathname.startsWith("/img/")){
    event.respondWith(serveImage(event.request));
    return;
  }

  //Check to see if request is for port 1337, this means it is contacting the api
  if(fetchUrl.port === "1337"){
    //if the parameters on the url include the restaurant id, this will save it to a variable
    let id = fetchUrl
      .searchParams
      .get("restaurant_id");

    //in a url for searching individual restaurants the id is not in the parameters, this splits the parts of the path into an array for searching
    const urlArr = fetchUrl
      .pathname
      .split("/");

    //if there is no id because there were no params on the url check to see if it is requesting data for a restaurant
    if(!id){
      if(fetchUrl.pathname.indexOf("restaurants")){
        //if the end of the requests is "/restaurants" there is something wrong with this url and it 
        //sets the variable to -1 so it will cause an error later on
        id = (urlArr[urlArr.length - 1] === "restaurants") ? "-1" : urlArr[urlArr.length - 1];
      } 
    }
    apiRequests(event, id);
  } else {
    nonapiRequests(event, thisRequest)
  }
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.filter(function(key) {
          return key.startsWith("restaurant-") &&
                 !allCaches.includes(key);
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener("message", (event) => {
    if (event.data.action === "skipWaiting") {
       self.skipWaiting();
    }
});

/**
 * 
 * Helper functions
 */

//Saves images in seperate cache
function serveImage(request) {

  return caches.open(imageCache)
  .then((cache) => {
    return cache.match(request.url)
    .then((response) => {
      if(response) return response;
      return fetch(request.url)
      .then((networkResponse) => {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      }).catch((err) => console.log("sw serve image error", err));
    });
  });
}

//handles requests made to the server, port 1337, seperates reviews for restaurant requests
const apiRequests = (event, id) => {
  // if the request is not "GET", it is returned to continue on fetching on the other end 
  if(event.request.method !== "GET"){
    return;
  }

  //keep functions to deal with restaurant requests and reviews seperate
  if(event.request.url.indexOf("reviews") > -1){
    reviewsRequest(event, id);
  } else {
    restaurantRequest(event, id);
  }
};

// handles requests not made to api
const nonapiRequests = (event, cacheData) => {
  //check for match in the cache, fetch and save if there is no match, then return
  event.respondWith(
    caches.match(cacheData)
    .then(res => {
      return (res || fetch(event.request)
        .then(data => {
          return caches
          .open(staticCacheName)
          .then(entry => {
            entry.put(event.request, data.clone());
            return data;
          });
        })
        .catch(error => {
          return new Response("You are not connected to the internet", {
            status: 404,
            statusText: "You are not connected to the internet, please check connection"
          });
      }));
    }));
};

const restaurantRequest = (event, id) => {
  //search the database
  event.respondWith(
    dbPromise
    .then(db => {
      return db
        .transaction("restaurants")
        .objectStore("restaurants")
        .get(id);
    })
    .then(entry => {
      //If there is data, return. If not make the fetch request
      return(entry && entry.data) || fetch(event.request)
      //save data from fetch request in idb
        .then(res => res.json())
        .then(data => {
          return dbPromise
            .then(db => {
              const tx = db.transaction("restaurants", "readwrite");
              const store = tx.objectStore("restaurants");
              store.put({id: id, data: data});
              return data;
            });
        });
    })
    .then(last => {
      return new Response(JSON.stringify(last));
    })
  .catch(error => {
    return new Response("Error fetching restaurant information", {status: 500});
  }));
};

const reviewsRequest = (event, id) => {
  //search the idb
  let dbPromise = idb.open("restaurants");
  event.respondWith(
    dbPromise
    .then(db => {
      const tx = db.transaction("reviews", "readwrite");
      const store = tx.objectStore("reviews");
      const index = store.index("restaurant_id");
      return index.getAll(Number(id));
    })
    .then(entry => {
      return (entry.length && entry) || fetch(event.request)
        .then(res => res.json())
        .then(data => {
          return dbPromise
            .then(db => {
              const tx = db.transaction("reviews", "readwrite")
              const store = tx.objectStore("reviews");
              data.forEach(item => {
                store.put({id: item.id, "restaurant_id": item["restaurant_id"], data: item})
              })
                return data;
            })
              .catch(e => {
                console.log("Error happened saving entry to db sw reviewRequest", e);
              })
        })
    })
      .then(last => {
        //data has to be in a certain format, this tests it. If it returns a data item(true), it is wrong. 
        //It needs to return a json with the keys and values from inside data obj
        if(last[0].data) {
          let temp = [];
          last.forEach(item => {
            temp.push(item.data);
          });
          const revData1 = JSON.stringify(temp);
          return new Response(revData1);
        }
        const revData2 = JSON.stringify(last);
        return new Response(revData2);
      })
      .catch(error => {
        console.log("sw error at bottom of reviewRequests : ", error);
        return new Response("Error fetching reviews information", {status: 500});
      })
  );

}

/* I was greatly helped with this by the old files from the "Introducing the Service Worker" lessons from earlier in the course and 
this page from Google https://developers.google.com/web/fundamentals/primers/service-workers/
Also the walkthrough by Doug Brown A.K.A. thefinitemonkey*/
