/*  Current version of the cache */
const cache_Name = 'v1';

/*  The 'immutable_cache_Files' contains URLs that we know never change. These can safely be copied from cache to cache.
    files that never change. Copy them directly to the new cache. */
const immutable_cache_Files = [
    "./js/main.js",
    "./js/plugins.js",
    "https://fonts.googleapis.com/css?family=Baloo+Bhai+2:800&display=swap"
];
/*  The 'mutable_cache_Files' contains URLs that we want to retrieve from the network every time we create a new cache. */
const mutable_cache_Files = [
    "./index.html",
    "./search2.html",
    "./manifest.webmanifest.json",
    "./icon.png",
    "./icon_512.png",
    "./LICENSE",
    "./README.md",
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
    /*  The install event must wait until the promise within this is actually going to be resolved */
    // e.waitUntil(
    //     caches.open(cache_Name)
    //         .then(cache => {
    //             return cache.addAll(mutable_cache_Files);
    //         })
    // );


    e.waitUntil(
        /* Open 'cache_Name' from the caches */
        caches
            .open(cache_Name)
            .then(function (cache) {
                log(' caching immutable_cache_Files:');
                /* Add all the default files into the cache */
                let new_immutable_cache_Files = [];
                /*  Install event first goes over all new_immutable_cache_Files
                    and looks for them in all existing caches. */
                return Promise.all(
                    immutable_cache_Files.map(function (url) {
                        return caches.match(url).then(function (response) {
                            /*  Any requests that are found copied to the new cache */
                            if (response) {
                                return cache.put(url, response);
                            }
                            /*  Those that are not placed into the new_immutable_cache_Files array */
                            else {
                                new_immutable_cache_Files.push(url);
                                /*  Return promises */
                                return Promise.resolve();
                            }
                        });
                    })
                ).then(function () {
                    /* Once all the requests have been checked, the code uses cache.addAll()
                       to cache all the URLs in mutable_cache_Files and new_immutable_cache_Files. */
                    return cache.addAll(new_immutable_cache_Files.concat(mutable_cache_Files))
                        .then(function () {
                            log(' Installed');
                            return self.skipWaiting();
                        });
                })

            })
    );
});


/* ----------------------- 2 - Call 'activate' event for the service worker ----------------------- */
self.addEventListener('activate', function (e) {
    log(' Activating');
    /*  Wait until the following is done and only declare the service worker activated
        if all of the following complete successfully */
    e.waitUntil(
        /*  Get all the cache keys */
        caches.keys()
            .then(function (cacheNames) {
                return Promise.all(cacheNames.map(function (key) {
                    /*  If a cached item is saved under a previous cacheName */
                    if (key !== cache_Name) {
                        /*  Delete that cached file */
                        return caches.delete(key)
                            .then(function () {
                                log(' removes cached Files (' + key + ') from cache.');
                            });
                    }
                })).then(function () {
                    log(' Activated');
                    return self.skipWaiting();
                })
            })
    );
    /*  Tell the active service worker to take control of the page immediately */
    return self.clients.claim();
});


/* ----------------------- 3 - Call 'fetch' event for the service worker ----------------------- */
self.addEventListener('fetch', function (e) {

    console.log("REQUEST TYPE - " + e.request.method);
    /* if not a GET request */
    if (e.request.method !== 'GET') {
        log(" POST or PUT request!")
    }

    console.log('Fetch intercepted for:', e.request.url);

    e.respondWith(
        caches.match(e.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(e.request).then(
                    function(response) {
                        // Check if we received a valid response
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        var responseToCache = response.clone();

                        caches.open(cache_Name)
                            .then(function(cache) {
                                cache.put(e.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );


});

/* ----------------------- 4 - Functions ----------------------- */

/*  Each logging line will be prepended with the service worker version */
function log(message) {
    console.log("%c [ServiceWorker - '" + cache_Name + "]", 'background: #FFFFFF; color: #329011', message);
}
