!function a(i,u,c){function s(t,e){if(!u[t]){if(!i[t]){var n="function"==typeof require&&require;if(!e&&n)return n(t,!0);if(l)return l(t,!0);var r=new Error("Cannot find module '"+t+"'");throw r.code="MODULE_NOT_FOUND",r}var o=u[t]={exports:{}};i[t][0].call(o.exports,function(e){return s(i[t][1][e]||e)},o,o.exports,a,i,u,c)}return u[t].exports}for(var l="function"==typeof require&&require,e=0;e<c.length;e++)s(c[e]);return s}({1:[function(e,h,t){"use strict";!function(){function i(n){return new Promise(function(e,t){n.onsuccess=function(){e(n.result)},n.onerror=function(){t(n.error)}})}function a(n,r,o){var a,e=new Promise(function(e,t){i(a=n[r].apply(n,o)).then(e,t)});return e.request=a,e}function e(e,n,t){t.forEach(function(t){Object.defineProperty(e.prototype,t,{get:function(){return this[n][t]},set:function(e){this[n][t]=e}})})}function t(t,n,r,e){e.forEach(function(e){e in r.prototype&&(t.prototype[e]=function(){return a(this[n],e,arguments)})})}function n(t,n,r,e){e.forEach(function(e){e in r.prototype&&(t.prototype[e]=function(){return this[n][e].apply(this[n],arguments)})})}function r(e,r,t,n){n.forEach(function(n){n in t.prototype&&(e.prototype[n]=function(){return e=this[r],(t=a(e,n,arguments)).then(function(e){if(e)return new u(e,t.request)});var e,t})})}function o(e){this._index=e}function u(e,t){this._cursor=e,this._request=t}function c(e){this._store=e}function s(n){this._tx=n,this.complete=new Promise(function(e,t){n.oncomplete=function(){e()},n.onerror=function(){t(n.error)},n.onabort=function(){t(n.error)}})}function l(e,t,n){this._db=e,this.oldVersion=t,this.transaction=new s(n)}function f(e){this._db=e}e(o,"_index",["name","keyPath","multiEntry","unique"]),t(o,"_index",IDBIndex,["get","getKey","getAll","getAllKeys","count"]),r(o,"_index",IDBIndex,["openCursor","openKeyCursor"]),e(u,"_cursor",["direction","key","primaryKey","value"]),t(u,"_cursor",IDBCursor,["update","delete"]),["advance","continue","continuePrimaryKey"].forEach(function(n){n in IDBCursor.prototype&&(u.prototype[n]=function(){var t=this,e=arguments;return Promise.resolve().then(function(){return t._cursor[n].apply(t._cursor,e),i(t._request).then(function(e){if(e)return new u(e,t._request)})})})}),c.prototype.createIndex=function(){return new o(this._store.createIndex.apply(this._store,arguments))},c.prototype.index=function(){return new o(this._store.index.apply(this._store,arguments))},e(c,"_store",["name","keyPath","indexNames","autoIncrement"]),t(c,"_store",IDBObjectStore,["put","add","delete","clear","get","getAll","getKey","getAllKeys","count"]),r(c,"_store",IDBObjectStore,["openCursor","openKeyCursor"]),n(c,"_store",IDBObjectStore,["deleteIndex"]),s.prototype.objectStore=function(){return new c(this._tx.objectStore.apply(this._tx,arguments))},e(s,"_tx",["objectStoreNames","mode"]),n(s,"_tx",IDBTransaction,["abort"]),l.prototype.createObjectStore=function(){return new c(this._db.createObjectStore.apply(this._db,arguments))},e(l,"_db",["name","version","objectStoreNames"]),n(l,"_db",IDBDatabase,["deleteObjectStore","close"]),f.prototype.transaction=function(){return new s(this._db.transaction.apply(this._db,arguments))},e(f,"_db",["name","version","objectStoreNames"]),n(f,"_db",IDBDatabase,["close"]),["openCursor","openKeyCursor"].forEach(function(a){[c,o].forEach(function(e){a in e.prototype&&(e.prototype[a.replace("open","iterate")]=function(){var e,t=(e=arguments,Array.prototype.slice.call(e)),n=t[t.length-1],r=this._store||this._index,o=r[a].apply(r,t.slice(0,-1));o.onsuccess=function(){n(o.result)}})})}),[o,c].forEach(function(e){e.prototype.getAll||(e.prototype.getAll=function(e,n){var r=this,o=[];return new Promise(function(t){r.iterateCursor(e,function(e){e?(o.push(e.value),void 0===n||o.length!=n?e.continue():t(o)):t(o)})})})});var d={open:function(e,t,n){var r=a(indexedDB,"open",[e,t]),o=r.request;return o&&(o.onupgradeneeded=function(e){n&&n(new l(o.result,e.oldVersion,o.transaction))}),r.then(function(e){return new f(e)})},delete:function(e){return a(indexedDB,"deleteDatabase",[e])}};void 0!==h?(h.exports=d,h.exports.default=h.exports):self.idb=d}()},{}],2:[function(e,t,n){"use strict";var r,o=function(){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e}}(),a=e("idb"),c=(r=a)&&r.__esModule?r:{default:r};var u=c.default.open("restaurants",3,function(e){switch(e.oldVersion){case 0:e.createObjectStore("restaurants",{keyPath:"id"});case 1:e.createObjectStore("pending",{keyPath:"id",autoIncrement:!0});case 2:e.createObjectStore("reviews",{keyPath:"id"}).createIndex("restaurant_id","restaurant_id")}}),i=function(){function i(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,i)}return o(i,null,[{key:"getData",value:function(){return u.then(function(e){if(e)return e.transaction("restaurants").objectStore("restaurants").getAll()})}},{key:"fetchRestaurants",value:function(t){i.getData().then(function(e){if(0<e.length)return t(null,e);fetch(i.DATABASE_URL,{credentials:"same-origin"}).then(function(e){return e.json()}).then(function(n){return u.then(function(e){if(e){var t=e.transaction("restaurants","readwrite").objectStore("restaurants");n.forEach(function(e){t.put(e)}),t.openCursor(null,"prev").then(function(e){return e.advance(26)}).then(function e(t){if(t)return t.delete(),t.continue().then(e)})}}),t(null,n)}).catch(function(e){console.log("dbhelper fetch restaurants catch",e),t(e,null)})})}},{key:"fetchRestaurantById",value:function(r,o){i.fetchRestaurants(function(e,t){if(e)o(e,null);else{var n=t.find(function(e){return e.id==r});n?o(null,n):o("Restaurant does not exist",null)}})}},{key:"fetchRestaurantByCuisine",value:function(r,o){i.fetchRestaurants(function(e,t){if(e)o(e,null);else{var n=t.filter(function(e){return e.cuisine_type==r});o(null,n)}})}},{key:"fetchRestaurantByNeighborhood",value:function(r,o){i.fetchRestaurants(function(e,t){if(e)console.log("main fetchRest by neigh",e),o(e,null);else{var n=t.filter(function(e){return e.neighborhood==r});o(null,n)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(r,o,a){i.fetchRestaurants(function(e,t){if(e)a(e,null);else{var n=t;"all"!=r&&(n=n.filter(function(e){return e.cuisine_type==r})),"all"!=o&&(n=n.filter(function(e){return e.neighborhood==o})),a(null,n)}})}},{key:"fetchNeighborhoods",value:function(o){i.fetchRestaurants(function(e,n){if(e)o(e,null);else{var r=n.map(function(e,t){return n[t].neighborhood}),t=r.filter(function(e,t){return r.indexOf(e)==t});o(null,t)}})}},{key:"fetchCuisines",value:function(o){i.fetchRestaurants(function(e,n){if(e)o(e,null);else{var r=n.map(function(e,t){return n[t].cuisine_type}),t=r.filter(function(e,t){return r.indexOf(e)==t});o(null,t)}})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id="+e.id}},{key:"imageUrlForRestaurant",value:function(e){return"/img/"+e.photograph}},{key:"mapMarkerForRestaurant",value:function(e,t){var n=new L.marker([e.latlng.lat,e.latlng.lng],{title:e.name,alt:e.name,url:i.urlForRestaurant(e)});return n.addTo(newMap),n}},{key:"fetchRestaurantReviewsById",value:function(e,t){fetch(i.REVIEWS_URL+"/?restaurant_id="+e).then(function(e){e.json().then(function(e){t(null,e)})}).catch(function(e){return t(e,null)})}},{key:"favToggle",value:function(e,t){document.getElementById("fav-button-"+e).onClick=null,i.favUpdate(e,t,function(e,t){e?console.log("There was an error processing favoriting"):(console.log("favToggle res is: ",t),document.getElementById("fav-button-"+t.id).style.background=t.value?"url('../img/star_filled.svg') no-repeat":"url('../img/star_empty.svg') no-repeat")})}},{key:"favUpdate",value:function(e,t,n){var r=i.DATABASE_URL+"/"+e+"/?is_favorite="+t;console.log("dbHelper favUpdate url ",r);i.updateCachedData(e,{is_favorite:t}),i.addToQueue(r,"PUT"),n(null,{id:e,value:t})}},{key:"updateCachedData",value:function(r,o){var a=c.default.open("restaurants");a.then(function(e){e.transaction("restaurants","readwrite").objectStore("restaurants").get("-1").then(function(e){if(e){var n=e.data,t=n.filter(function(e){return e.id===r})[0];if(t)Object.keys(o).forEach(function(e){t[e]=o[e]}),a.then(function(e){var t=e.transaction("restaurants","readwrite");return t.objectStore("restaurants").put({id:"-1",data:n}),t.complete})}else console.log("There was no cached data")})}),a.then(function(e){e.transaction("restaurants","readwrite").objectStore("restaurants").get(r+"").then(function(e){if(e){var n=e.data;if(console.log("Restaurant Data: ",n),n)Object.keys(o).forEach(function(e){n[e]=o[e]}),a.then(function(e){var t=e.transaction("restaurants","readwrite");return t.objectStore("restaurants").put({id:r+"",data:n}),t.complete})}else console.log("There is no cached data")})})}},{key:"addToQueue",value:function(t,n,r){c.default.open("restaurants").then(function(e){e.transaction("pending","readwrite").objectStore("pending").put({data:{url:t,method:n,body:r}})}).catch(function(e){}).then(i.nextItem())}},{key:"nextItem",value:function(){i.tryCommitPending(i.nextItem)}},{key:"tryCommitPending",value:function(o){var a=void 0,i=void 0,u=void 0;c.default.open("restaurants").then(function(r){if(console.log("tryCommitPending !db.objectStoreNames.length : ",!r.objectStoreNames.length),console.log("tryCommitPending !db.objectStoreNames.length2 : ",r.objectStoreNames),!r.objectStoreNames.length)return console.log("This database is not available (addToQueue)"),void r.close();r.transaction("pending","readwrite").objectStore("pending").openCursor().then(function(e){if(e){var t=e.value;if(a=t.data.url,i=t.data.method,u=t.data.body,console.log("tryCommitPending after db Transaction url, method, body : ",a,i,u),a&&i&&("POST"!==i||u)){var n={body:JSON.stringify(u),method:i};console.log("To be updated in db (tryCommitPending) :",n),fetch(a,n).then(function(e){console.log("tryCommitPending res : ",e),e.ok||e.redirected||console.log("tryCommitPending not online")}).then(function(){r.transaction("pending","readwrite").objectStore("pending").openCursor().then(function(e){e.delete().then(function(){o()})}),console.log("This entry was removed from the queue because it was sent to the server")})}else e.delete().then(o())}else console.log("tryCommitPending there is no cursor so it should return")}).catch(function(e){console.log("Error reading pending entry",e)})})}},{key:"REVIEWS_URL",get:function(){return"http://localhost:1337/reviews"}},{key:"DATABASE_URL",get:function(){return"http://localhost:1337/restaurants"}}]),i}();t.exports=i},{idb:1}],3:[function(e,t,n){"use strict";var r,o=e("./dbhelper.js"),v=(r=o)&&r.__esModule?r:{default:r};var a=0;document.addEventListener("DOMContentLoaded",function(e){p(),l(),d(),s(),i()});var i=function(){var e={root:document.querySelector("#maincontent"),rootMargin:"0px",threshold:u()};new IntersectionObserver(c,e)},u=function(){for(var e=[],t=1;t<=20;t++){var n=t/20;e.push(n)}return e.push(0),e},c=function(e,t){e.forEach(function(e){e.intersectionRatio>a?(e.target.classList.remove("hidden"),e.target.classList.add("show")):(e.target.classList.add("hidden"),e.target.classList.remove("show")),a=e.intersectionRatio})},s=function(){document.getElementById("neighborhoods-select").addEventListener("change",function(){m()}),document.getElementById("cuisines-select").addEventListener("change",function(){m()})},l=function(){v.default.fetchNeighborhoods(function(e,t){e?console.error(e):(self.neighborhoods=t,f())})},f=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.neighborhoods,n=document.getElementById("neighborhoods-select");e.forEach(function(e){var t=document.createElement("option");t.innerHTML=e,t.value=e,n.append(t)})},d=function(){v.default.fetchCuisines(function(e,t){e?console.error(e):(self.cuisines=t,h())})},h=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.cuisines,n=document.getElementById("cuisines-select");e.forEach(function(e){var t=document.createElement("option");t.innerHTML=e,t.value=e,n.append(t)})},p=function(){self.newMap=L.map("map",{center:[40.722216,-73.987501],zoom:12,scrollWheelZoom:!1}),L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",{mapboxToken:"pk.eyJ1IjoibW1rZXBsZXIiLCJhIjoiY2pqMXp6b2t0MGVvMzN3b2FxbTA5aGcxciJ9.WalEAPr3uW5Iztb-PYr0FA",maxZoom:18,attribution:'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',id:"mapbox.streets"}).addTo(self.newMap),m()},m=function(){var e=document.getElementById("cuisines-select"),t=document.getElementById("neighborhoods-select"),n=e.selectedIndex,r=t.selectedIndex,o=e[n].value,a=t[r].value;v.default.fetchRestaurantByCuisineAndNeighborhood(o,a,function(e,t){e?console.error(e):(g(t),y())})},g=function(e){self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers&&self.markers.forEach(function(e){return e.remove()}),self.markers=[],self.restaurants=e},y=function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants,t=document.getElementById("restaurants-list");e.forEach(function(e){t.append(b(e))}),w()},b=function(t){var e=document.createElement("li"),n=document.createElement("picture"),r=void 0,o="/img/"+(r=t.photgraph?t.photograph:t.id)+".jpg",a="/img/"+r+"-400.jpg",i=document.createElement("source");i.media="(min-width: 1481px)",i.srcset=o;var u=document.createElement("source");u.media="(max-width: 1480px) and (min-width: 769px)",u.srcset=a;var c=document.createElement("source");c.media="(max-width: 768px) and (min-width: 490px)",c.srcset=o;var s=document.createElement("source");s.media="(max-width: 489px)",s.srcset=a;var l=document.createElement("img");l.className="restaurant-img",l.alt="An image of "+t.name+".",l.src=o,n.append(i),n.append(u),n.append(c),n.append(s),n.append(l),e.append(n);var f=document.createElement("h3");f.innerHTML=t.name,e.append(f);var d=document.createElement("p");d.innerHTML=t.neighborhood,e.append(d);var h=document.createElement("p");h.innerHTML=t.address,e.append(h);var p=document.createElement("a");p.innerHTML="View Details",p.setAttribute("role","button"),p.setAttribute("aria-label","View details for "+t.name),p.addEventListener("keypress",E),p.href=v.default.urlForRestaurant(t);var m=!(!t.is_favorite||"true"!==t.is_favorite.toString()),g=document.createElement("button");return g.className="favMain",g.id="fav-button-"+t.id,g.style.background=m?"url('../img/star_filled.svg') no-repeat":"url('../img/star_empty.svg') no-repeat",g.onclick=function(e){return _(t.id,!m)},e.append(p),e.appendChild(g),e},_=function t(n,e){var r=document.getElementById("fav-button-"+n),o=self.restaurants.filter(function(e){return e.id===n})[0];console.log("in fav toggle restaurant",o),o&&(o.is_favorite=e,r.onclick=function(e){return t(o.id,!o.is_favorite)},v.default.favToggle(n,e))},w=function(){(0<arguments.length&&void 0!==arguments[0]?arguments[0]:self.restaurants).forEach(function(e){var t=v.default.mapMarkerForRestaurant(e,self.newMap);t.on("click",function(){window.location.href=t.options.url}),self.markers.push(t)})},E=function(e){e.preventDefault();var t=event.charCode||event.keyCode;32!==t&&13!==t||e.target.click()}},{"./dbhelper.js":2}]},{},[2,3]);