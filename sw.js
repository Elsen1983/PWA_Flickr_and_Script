/*  importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js'); */

/*  workbox.googleAnalytics.initialize(); */

/*  Current version of the cache.   */
const cache_Name = 'v1';

/*  The 'immutable_cache_Files' contains URLs that we know never change. These can safely be copied from cache to cache.
    files that never change. Copy them directly to the new cache.   */
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

/*  ----------------------- 1 - Call 'install' event for the service worker ----------------------- */
/*  Cache on installation / for every consequent request you should check the cache first, then the network if it
    wasn't in the cache (if found online then add it to the cache). Call it when the installation phase starts. */
self.addEventListener('install', function (e) {
    log(' Installing');

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


/*  ----------------------- 2 - Call 'activate' event for the service worker -----------------------    */
/*  Call it when the activation phase starts.   */
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


/*  ----------------------- 3 - Call 'fetch' event for the service worker -----------------------    */
/*  This is fired whenever the web page requests some resource. This can be embedded media (e.g. <img> tags in the HTML)
    , clicking on links, JavaScript code (E.g XMLHttpRequest objects, JSON-P, Fetch, etc), and so on. So, the fetch
    event handler is called every time your web pages requests a resource over the internet.    */
self.addEventListener('fetch', function (e) {

    console.log("REQUEST TYPE - " + e.request.method);

    /*  If not a GET request */
    if (e.request.method !== 'GET') {
        log(' fetch event ignored.', e.request.method, e.request.url);
        return;
    }else{
        console.log("Method: " + e.request.method);
        console.log("Destination: " + e.request.destination);
    }

    /*  Parse the URL   */
    const requestURL = new URL(e.request.url);

    /*  Switch-case for different cases in cache policy.    */
    switch (requestURL.hostname) {

        /*  Option 1 - Local request */
        /*  Check network first and if not find then send back fallback content indicating the app is offline. */
        case "webdevcit.com" || "localhost":
            console.log('Fetch intercepted for:', requestURL);
            /*  Option 1.a - local movieObj.js --> JSON-P containing Script data*/
            /*  Cache Policy: Skip caching local JSON file(s) */
            if (/movieObj.js/.test(requestURL.href)) {


                let fetchedP = fetch(e.request);
                return fetchedP
                    .then(function (resp) {
                        return resp
                    })
                    .catch(function () {
                        return new Response(
                            "<h1>Offline</h1>",
                            {headers: {"Content-Type": "text/html"}}
                        );
                    });
            }
            /*  Option 1.b - local request, which is not movieObj.js JSON-P file.    */
            /*  Cache Policy: Cache immediately when SW installed. Check "install" event.   */
            else {
                e.respondWith(
                    caches.open(cache_Name).then(function (cache) {
                        return cache.match(e.request).then(function (response) {
                            return response ||
                                fetch(e.request)
                                    .then(function (response) {
                                        cache.put(e.request, response.clone());
                                        return response;
                                    });
                        });
                    })
                );
            }

            break;

        /*  Option 2 - Flickr Image requests */
        /*  If a request doesn't match anything in the cache, get it from the network,
            send it to the page and add it to the cache at the same time.   */
        case "farm66.static.flickr.com":
            log(' Fetching Flickr Image requests');
            console.log('Fetch intercepted for:', requestURL);

            /*  Comment: I know we looking for 'jpg' files only but added 'gif' too here.   */
            if (/\.(jpg|JPG|gif|GIF)$/.test(requestURL.href)) {
                // console.log("---- Flickr IMAGE request detected ----");
                e.respondWith(
                    caches.open(cache_Name)
                        .then(function (cache) {
                            return cache.match(e.request)
                                .then(response => {
                                    return response || fetch(e.request)
                                        .then(response => {
                                            console.log("Image is not in the cache, so caching it.");
                                            cache.put(e.request, response.clone());
                                            return response;
                                        })
                                        .catch(function () {
                                            //if image is missing then display the missing-image.jpg from cache
                                            return caches.match('./img/missing_image.jpg');
                                        });
                                });
                        })
                );
            }

            break;

        /*  Option 3 - Flickr JSON request  */
        /*  Check the Network first, if it can't be accessed then just send back fallback content indicating
            the app is offline (i.e. some JSON describing what happened).   */
        case "www.flickr.com":
            log(' Fetching Flickr JSON request');
            console.log(requestURL);
            e.respondWith(
                /*  first check network*/
                fetch(e.request)
                    .catch(
                           /*   send back fallback  */
                        function() { return new Response(
                            "showImages({offline: true})",
                            {headers: {"Content-Type": "text/javascript"}}
                        );}
                    )
            );
            break;
    }

    // //https://developers.google.com/web/fundamentals/primers/service-workers
    // //console.log('Fetch intercepted for:', e.request.url);
    //
    // e.respondWith(
    //     caches.match(e.request)
    //         .then(function(response) {
    //             // Cache hit - return response
    //             if (response) {
    //                 return response;
    //             }
    //
    //             return fetch(e.request).then(
    //                 function(response) {
    //                     // Check if we received a valid response
    //                     if(!response || response.status !== 200 || response.type !== 'basic') {
    //                         return response;
    //                     }
    //
    //                     // IMPORTANT: Clone the response. A response is a stream
    //                     // and because we want the browser to consume the response
    //                     // as well as the cache consuming the response, we need
    //                     // to clone it so we have two streams.
    //                     var responseToCache = response.clone();
    //
    //                     caches.open(cache_Name)
    //                         .then(function(cache) {
    //                             cache.put(e.request, responseToCache);
    //                         });
    //
    //                     return response;
    //                 }
    //             );
    //         })
    // );


});

/*  ----------------------- 4 - Functions -----------------------   */


/*  Request.destination : https://developer.mozilla.org/en-US/docs/Web/API/Request/destination  */
function isImage(fetchRequest) {
    return (
        fetchRequest.method === 'GET' && fetchRequest.destination === 'image'
    );
}

/*  Each logging line will be prepended with the service worker version */
function log(message) {
    console.log("%c [ServiceWorker - '" + cache_Name + "]", 'background: #FFFFFF; color: #329011', message);
}


/*  ----------------------- 5 - Extra Information -----------------------  */

/*  REQUEST
    Request objects represents the URL of some resource. Many of the methods requiring a Request object
    as a parameter will accept the URL as a string (they will create the Request object from it).
    These objects can identify resources online or in the cache.    */

/*  RESPONSE
    Response objects represent the data/resource that come back from a request (they can come
    from the network or the cache)  */


/*  waitUntil()
    We can use the waitUntil() event method to make sure the service worker knows the process is still underway.
    This is a method of the Event object that is passed to the event handler. It is passed a Promise and won't
    terminate until the Promise is resolved/rejected. (The Promise should resolve when the asynchronous code
    of the event handler is finished.)   */

/*  respondWith()
    Call the event.respondWith() method to pass a Response object back to the window or tab that made the request.  */

/*  fetch()
    The fetch() returns a Promise that resolves to a Response object for the request.
    I.e. it will try and load the file from the internet and create a Response object with what is returned.    */

/*  cache.open()
    This method returns a promise that resolves to a Cache object.  */


/*  ----------------------- 6 - Example codes   ----------------------- */

/*  Deleting a files in the /images/ folder from the example-cache cache.

    caches.open('example-cache').then(function(cache) {
        cache.matchAll('/images/').then(function(response) {
            response.forEach(function(element, index, array) {
                cache.delete(element);
            });
        });
    })
 */
