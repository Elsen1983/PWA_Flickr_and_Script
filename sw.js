//my current cache name (version)
var cache_Name = 'v1';

//immutable_cache_Files contains URLs that we know never change. These can safely be copied from cache to cache.
//files that never change
//looked for them in existing caches, and copied them directly to the new cache
var immutable_cache_Files = [
    "./js/main.js",
    "./js/plugins.js",
    "https://fonts.googleapis.com/css?family=Baloo+Bhai+2:800&display=swap"
];
//mutable_cache_Files contains URLs that we want to retrieve from the network every time we create a new cache.
var mutable_cache_Files = [
    "./index.html",
    "./search2.html",
    "./manifest.webmanifest.json",
    "./icon.png",
    "./icon_512.png",
    "./LICENSE",
    "./README.md",
    "./sw.js",
    "./css/index_myCSS.css",
    "./css/main.css",
    "./css/normalize.css",
    "./css/search2_myCSS.css",
    "./js/app.js",
    "./img/loaderGif.gif",
    "./img/search_icon.svg",
    "./img/missing_image.jpg"

];

/* ----------------------- 1 - Call 'install' event for the service worker ----------------------- */
/*
    Cache on installation / for every consequent request you should check the cache first, then the network if it
    wasn't in the cache (if found online then add it to the cache).
 */
self.addEventListener('install', function (e) {
    log(' Installing');
    //the install event must wait until the promise within this is actually going to be resolved
    e.waitUntil(
        //open 'cache_Name' from the caches
        caches
            .open(cache_Name)
            .then(function (cache) {
                log(' caching immutable_cache_Files:');
                //add all the default files into the cache
                let new_immutable_cache_Files = [];
                // install event first goes over all new_immutable_cache_Files and looks for them in all existing caches.
                return Promise.all(
                    immutable_cache_Files.map(function (url) {
                        return caches.match(url).then(function (response) {
                            //any requests that are found are copied to the new cache
                            if (response) {
                                return cache.put(url, response);
                            }
                            //those that are not  placed into the new_immutable_cache_Files array.
                            else {
                                new_immutable_cache_Files.push(url);
                                //return promises
                                return Promise.resolve();
                            }
                        });
                    })
                ).then(function () {
                    /* Once all the requests have been checked, the code uses cache.addAll()
                       to cache all the URLs in mutable_cache_Files and new_immutable_cache_Files. */
                    return cache.addAll(new_immutable_cache_Files.concat(mutable_cache_Files));

                }).then(function () {
                    log(' Installed');
                    return self.skipWaiting();
                });

            })
    );
});


/* ----------------------- 2 - Call 'activate' event for the service worker ----------------------- */
self.addEventListener('activate', function (e) {
    log(' Activating');
    //Wait until the following is done and only declare the service worker activated
    //if all of the following complete successfully
    e.waitUntil(
        //get all the cache keys
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(cacheNames.map(function (key) {
                    // If a cached item is saved under a previous cacheName
                    if (key !== cache_Name) {
                        // Delete that cached file
                        return caches.delete(key)
                            .then(function () {
                                log(' removes cached Files (' + key + ') from cache.');
                            });
                    }
                }))
            })
            .then(function () {
                log(' Activated');
                return self.skipWaiting();
        })
    );
    // Tell the active service worker to take control of the page immediately.
    return self.clients.claim();
});


/* ----------------------- 3 - Call 'fetch' event for the service worker ----------------------- */


/* ----------------------- 4 - Functions ----------------------- */
// each logging line will be prepended with the service worker version
function log(message) {
    console.log("%c [ServiceWorker - '" + cache_Name + "]", 'background: #FFFFFF; color: #329011', message);
}
