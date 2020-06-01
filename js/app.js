/* ----------------------- Declare the variables ----------------------- */
const searchTerms = ["Ivan Aivazovsky", "Henry Pether", "Robin Jacques"];
var images_Array = [];
var buttons = document.getElementsByClassName("buttons");
var flickrImageArray = [];
var webWorker;

/* ----------------------- Setup the page ----------------------- */
window.addEventListener("load", init);
window.addEventListener('resize', resizePage);

function init() {
    onloadFunction();
    checkNetworkOnLoad();

}

/*  ----------------------- Search Flickr - getImages -----------------------    */
function getImages(searchTermText) {

    addArrowButtons();

    console.log('%c getImages() called with ' + searchTermText, 'background: #222; color: #bada55');

    let base_url = "https://www.flickr.com/services/rest?";
    let request = "method=flickr.photos.search";
    request += "&per_page=10";
    request += "&api_key=22303ae620835b04e5c55988c44ed6d3";
    request += "&text=" + escape(searchTermText);
    request += "&format=json&jsoncallback=showImages";
    request += "&tag_mode=all";
    let full = base_url + request;

    /*  To avoid adding script tags every time into the DOM when the user presses a button
        we check all the script tag and remove that "flickr script" which is the same like
        that generated above (full) */
    let all_script = document.getElementsByTagName("script");

    for (let i = 0; i < all_script.length; i++) {
        if (all_script[i].src.toString() !== full.toString()) {
            //do nothing because the script is not in the DOM
        } else {
            //remove the same script tag
            all_script[i].parentNode.removeChild(all_script[i]);
        }
    }
    //add back as last one again
    let scriptTag = document.createElement("script");
    scriptTag.setAttribute("src", full);
    scriptTag.setAttribute("type", "application/javascript");

    let bodyZero = document.querySelectorAll("body")[0];

    bodyZero.appendChild(scriptTag);

    disableButtons();
}

/*  -------------------Handle FlickrSearch Results ------------------    */
function showImages(images) {

    console.log("%c showImages() called", 'background: #222; color: #bada55');
    console.log(images);

    document.getElementById('content_div').innerHTML = "";

    if (images.stat === 'fail') {
        document.getElementById('content_div').innerHTML = "Error";
        enableButtons();
    } else {
        /* clear the image-arrays, because we want to store just the last searchTerm + images in the localStorage*/
        flickrImageArray.length = 0;
        images_Array.length = 0;

        let targetnr = images.photos.photo.length;
        if (targetnr === 0) {
            document.getElementById('content_div').innerHTML = "No Results";
            enableButtons();
        } else {
            /*  Clear the images in localStorage    */
            console.log('%c removeItemFromLocalStorage() called', 'background: #FFDEAD; color: #000000');
            removeItemFromLocalStorage("images");

            for (let i = 0; i < images.photos.photo.length; i++) {
                let url = "https://farm" + images.photos.photo[i].farm;
                let imgName = "/";
                let title = images.photos.photo[i].title;

                url += ".static.flickr.com";

                imgName += images.photos.photo[i].server + "/";
                imgName += images.photos.photo[i].id + "_";
                imgName += images.photos.photo[i].secret;

                let big_Url = url + imgName + ".jpg";
                let image_name_extension = imgName + ".jpg";

                /*  Add the current image Object into the 'images_Array' with name+extension */
                images_Array.push(new FlickrImage(big_Url, title, image_name_extension));

                flickrImageArray.push(new FlickrImage(big_Url, title, image_name_extension));
            }

            /*  Add current images into localStorage    */
            console.log('%c addItemToLocalStorage() called', 'background: #FFDEAD; color: #000000');
            addItemToLocalStorage("images", JSON.stringify(images_Array));

            createImages(flickrImageArray);

        }
    }
}

/*  Constructor for FlickrImages object    */
function FlickrImage(image_URL, image_Title, image_NameAndExtension) {
    this.imageSRC = image_URL;
    this.imageTitle = image_Title;
    this.imageName = image_NameAndExtension;
}

FlickrImage.prototype.getImageObject = function () {

    return new Promise((resolve, reject) => {
        // Create an image object
        let imageObject = new Image();
        imageObject.src = this.imageSRC;

        document.getElementById("loading_txt").style.display = "none";

        imageObject.onload = () => {

            imageObject.onclick = () => {
                console.log("Modal activated on clicked image :" + this.imageTitle);
                imageTitleOnModal(this.imageTitle)
            };

            resolve(imageObject);
        };

        imageObject.onerror = () => {
            imageObject.innerHTML = "Can't Load";
            reject();
        };
    });
};

function imageTitleOnModal(getTitle) {
    // console.log("getModalAndZoomImages called with title: " + getTitle);
    const modalPlace = document.getElementById("body_Tag");
    let modal = document.createElement("div");
    modal.setAttribute("id", "modal");
    let subModal = document.createElement("div");
    subModal.setAttribute("id", "subModal");
    let titleDiv = document.createElement("div");
    titleDiv.id = "modal_title_box";
    let titleText = document.createElement("p");
    titleText.textContent = getTitle;
    titleDiv.appendChild(titleText);
    modal.onclick = function () {
        modalPlace.removeChild(modalPlace.lastChild);
    };
    subModal.appendChild(titleDiv);
    modal.appendChild(subModal);
    modalPlace.appendChild(modal);
}

/* ------------------------ Place Images on the Page ------------ */
function createImages(flickr_array) {
    console.log("%c createImages() called", 'background: #222; color: #bada55');
    console.log(flickr_array);
    let promiseArray = [];

    for (let i = 0; i < flickr_array.length; i++) {

        let divObj = document.createElement("li");
        divObj.className = "imageTag";
        let loader = document.createElement("img");
        loader.src = 'img/loaderGif.gif';
        loader.className = "loader";
        divObj.appendChild(loader);
        let tempPromise = flickr_array[i].getImageObject();
        tempPromise.then(function (resolvedImage) {
            divObj.innerHTML = "";
            divObj.appendChild(resolvedImage);
        });
        promiseArray.push(tempPromise);
        document.getElementById('content_div').appendChild(divObj);
    }
    Promise.all(promiseArray).then(enableButtons);


    // Note: This suffices for this lab. In reality there is an issue with
    // an image not being found. I.e. the corresponding Promise will not
    // resolve, therefore all() cannot be invoked and the buttons
    // will remain disabled

    // However, We will leave this solution here in order to see how all() works
    // (and because Flickr is reliable enough for our purposes )

    // Possible solutions include using a timeout to enable the buttons after
    // a certain time has elapsed
}

/* ----------------- Enable and Display search buttons ----------- */
function enableButtons() {
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.cursor = "pointer"; //This makes it clickable
        // buttons[i].style.pointerEvents = "pointer";
        buttons[i].style.opacity = "1"; //This grays it out to look not disabled
    }
}

function disableButtons() {
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.cursor = "none"; //This makes it not clickable
        // buttons[i].style.pointerEvents = "none";
        buttons[i].style.opacity = "0.6"; //This grays it out to look disabled
    }
}

/* ----------------------- Functions for the basic site functionalities (e.g. hide buttons) */

/*  Show-hide menu for btn. */
function hide_Menu() {
    const x = document.getElementById("product_inner_container");
    // console.log(x.style.display);
    if (x.style.display === "none") {
        x.style.display = "flex";
    } else {
        x.style.display = "none";
    }
}

/*  Hide some element from the DOM. Must use it because JS not reading the CSS style on onload (just inline style). */
function onloadFunction() {
    const x = document.getElementById("product_inner_container");
    if (window.innerWidth > 479) {
        x.style.display = "flex";
    } else {
        x.style.display = "none";
    }
}

function resizePage() {
    let x = document.getElementById("product_inner_container");

    if (window.innerWidth === 479 || window.innerWidth < 479) {
        x.style.display = "none";
    }
    if (window.innerWidth > 479) {
        x.style.display = "flex";
    }
}

function removeItemFromLocalStorage(key) {
    window.localStorage.removeItem(key);
}

function addItemToLocalStorage(key, value) {
    window.localStorage.setItem(key, value);
}

function addArrowButtons() {
    /*  Scroll down button  */
    if (!document.getElementById("scrollDown")) {
        let scrollDownButton = document.createElement("i");
        scrollDownButton.className = "arrow down";
        scrollDownButton.id = "scrollDown";
        scrollDownButton.onclick = function () {
            let lastElement = document.getElementById("bottomOfContent");
            lastElement.scrollIntoView();
            lastElement.focus();
        };
        document.getElementById("topOfContent").appendChild(scrollDownButton);
    }
    /*  Scroll up button  */
    if (!document.getElementById("scrollUp")) {
        let scrollUpButton = document.createElement("i");
        scrollUpButton.className = "arrow up";
        scrollUpButton.id = "scrollUp";
        scrollUpButton.onclick = function () {
            if (window.innerWidth === 479 || window.innerWidth < 479) {
                let firstElement = document.getElementById("topOfContent");
                firstElement.scrollIntoView();
                firstElement.focus();
            } else {
                let firstElement = document.getElementById("body_Tag");
                firstElement.scrollIntoView();
                firstElement.focus();
            }
        };
        document.getElementById("bottomOfContent").appendChild(scrollUpButton);
    }
}

function checkNetworkOnLoad() {

    console.log('%c checkNetwork() called', 'background: #222; color: #bada55');

    /*  Check that the button_Nav is exists or not --> index.html or search2.html */
    /*  Option A - index.html --> Flickr search */
    if (typeof (document.getElementById("buttons_Nav")) != 'undefined' && document.getElementById("buttons_Nav") != null) {
        console.log("-----------------------");
        console.log("---- Flickr Search ----");
        console.log("-----------------------\n");

        let last_search_term = window.localStorage.getItem("last_search");
        let images_LocalStorage = window.localStorage.getItem("images");

        /* Option 1 - App is OFFLINE */
        if (!navigator.onLine) {
            console.log("App is OFFLINE");

            /*  Highlight the app is offline at the moment */
            if (typeof (document.getElementById("serverStatus")) != 'undefined' && document.getElementById("serverStatus") != null) {

            } else {
                addOfflineStatus("topOfContent");
            }

            /*  Option 1.a - LOCALSTORAGE is NOT used earlier.  */
            if (checkLocalStorageUsage(last_search_term, images_LocalStorage) === false) {
                console.log("LOCALSTORAGE is NOT used earlier.");
                document.getElementById('loading_txt').innerHTML = "Sorry, Can't access Flickr.";
                document.getElementById('content_div').innerHTML = "Try again later.";
                makeButtons("checkNetwork", last_search_term);

            }
            /*  Option 1.b - LOCALSTORAGE is used earlier.  */
            else {
                console.log("LOCALSTORAGE is used earlier.");
                console.log("load images from CACHE...");
                loadImagesFromCache(images_LocalStorage);
                addArrowButtons();
                makeButtons("checkNetwork", last_search_term);
                selectUsedButton(last_search_term);


            }
        }
        /* Option 2 - App is Online */
        else {
            console.log("App is ONLINE");

            if (typeof (document.getElementById("serverStatus")) != 'undefined' && document.getElementById("serverStatus") != null) {
                removeOnlineStatus("serverStatus");
            }

            /*  Option 2.a - LOCALSTORAGE is NOT used earlier.  */
            if (checkLocalStorageUsage(last_search_term, images_LocalStorage) === false) {
                console.log("LOCALSTORAGE is NOT used earlier.");
                /*  create the buttons */
                makeButtons("searchNetwork", last_search_term);
            }
            /*  Option 2.b - LOCALSTORAGE is used earlier.  */
            else {
                console.log("LOCALSTORAGE is used earlier.");
                /*  load images from Cache */
                console.log("load images from CACHE...");
                loadImagesFromCache(images_LocalStorage);
                addArrowButtons();
                /*  create the buttons */
                makeButtons("searchNetwork", last_search_term);
                selectUsedButton(last_search_term);


                // loadImagesFromCache();

            }

        }
    }
    /*  Option B - search2.html --> Search SCRIPT */
    else {
        console.log("-----------------------");
        console.log("---- Script Search ----");
        console.log("-----------------------\n");


        /*  If browser supports WebWorkers then add web-worker  */
        if (window.Worker) {
            console.log("Your browser support WebWorkers!");

            /*  Start a Web Worker. */
            startWorker();

            let input = document.getElementById("searchField");

            /*  Add eventListener to the input field.   */
            input.addEventListener("input", function (evt) {



                if (evt.inputType === "deleteContentBackward" || evt.inputType === "deleteContentForward") {
                    console.log("Delete");
                    if(this.value.trim() === ""){
                        document.getElementById("content_div").innerHTML = "";
                        document.getElementById("percentage").textContent = "0";
                        document.getElementById("progressBar").value = "0";
                    }else{
                        searchMovie(this.value);
                    }
                }

                /*  if the input is not empty after .trim() then call the searchMovie() function. */
                /*  .trim() is not supported in Internet Explorer 8 and earlier versions. */
                if (this.value.trim() !== "") {
                    searchMovie(this.value);
                }

            });
        } else {
            alert("Your browser not support WebWorkers!");
        }

    }
}

function checkLocalStorageUsage(lastSearchTerm, localStorageImages) {

    console.log('%c checkLocalStorageUsage() called', 'background: #222; color: #bada55');

    let used = false;

    /* Option 1.a - App is used before */
    if (lastSearchTerm != null && localStorageImages != null) {
        used = true;
        return used;
    }
    /* Option 1.b - App is never used before or localStorage and cache are cleaned out */
    else {
        return used;
    }
}

function makeButtons(type, term) {
    /*  remove the buttons generated before */
    let buttonsForRemove = document.getElementById("buttons_Nav");
    buttonsForRemove.innerHTML = '';


    for (let i = 0; i < searchTerms.length; i++) {
        let newB = document.createElement("li");
        newB.setAttribute("class", "buttons");
        newB.setAttribute("id", searchTerms[i]);
        let newT = document.createTextNode(searchTerms[i]);
        newB.appendChild(newT);

        /*  add buttons to the 'sidebar' */
        document.getElementById("buttons_Nav").appendChild(newB);

        /*  add event listeners to the buttons */
        newB.addEventListener("click", function () {
            if (type === "checkNetwork") {
                console.log("button pressed -> check Network because app offline");
                /* double check the network when button clicked */
                if (checkNetwork() === false) {
                    checkNetworkOnLoad();
                } else {
                    addItemToLocalStorage('last_search', searchTerms[i]);
                    clearButtons(searchTerms[i]);
                    getImages(searchTerms[i]);
                }
            }
            if (type === "searchNetwork") {
                console.log("button pressed -> add " + searchTerms[i] + " into searchTerms");
                /* double check the network when button clicked */
                if (checkNetwork() === false) {
                    checkNetworkOnLoad();
                } else {
                    /*  add selected term into searchTerms */
                    addItemToLocalStorage('last_search', searchTerms[i]);
                    clearButtons(searchTerms[i]);
                    getImages(searchTerms[i]);
                }
            }
        });
    }
}

function checkNetwork() {
    let onlineStatus = false;
    if (!navigator.onLine) {
        if (document.getElementById("serverStatus") == null) {
            addOfflineStatus("topOfContent");
        }
        return onlineStatus;
    } else {
        /*  App is changed to online, so remove the "Offline text"    */
        removeOnlineStatus("serverStatus");
        onlineStatus = true;
        return onlineStatus;
    }
}

function clearButtons(id) {

    let buttons = document.getElementsByClassName('buttons');
    for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i];

        if (button.getAttribute("id") !== id) {
            button.style.color = "#000000";

        } else {
            selectUsedButton(id);
        }
    }
}

function selectUsedButton(id) {
    let used = document.getElementById(id);
    used.style.color = "#0000CD";
}

function addOfflineStatus(parent) {
    let status = document.createElement("p");
    status.setAttribute("id", "serverStatus");
    let newT = document.createTextNode("The application is currently OFFLINE...");
    status.appendChild(newT);
    status.style.textAlign = "center";
    document.getElementById(parent).appendChild(status);
}

function removeOnlineStatus(element) {
    /*  Removes an element (serverStatus)from the document    */
    let elem = document.getElementById(element);
    if (elem != null) {
        elem.remove();
    }
}

function loadImagesFromCache(imagesFromLocalStorage) {

    console.log('%c loadImagesFromCache() called', 'background: #222; color: #bada55');

    let newImageArray = [];
    let fromLocal = (imagesFromLocalStorage) ? JSON.parse(imagesFromLocalStorage) : [];

    for (let i = 0; i < fromLocal.length; i++) {
        let element = fromLocal[i];
        newImageArray.push(element);
    }

    let promiseArray = [];

    document.getElementById('content_div').innerHTML = "";


    for (let i = 0; i < fromLocal.length; i++) {

        if (caches.match(newImageArray[i].imageSRC)) {

            let divObj = document.createElement("li");
            divObj.className = "imageTag";

            /*  We call the loadImage function and call .then on the Promise that it returns,
                passing a function that we want to receive the realized Image.    */
            let tempPromise = loadImage(fromLocal[i].imageSRC, fromLocal[i].imageTitle);

            tempPromise.then(resolvedImage => {
                divObj.innerHTML = "";
                divObj.appendChild(resolvedImage);
            }).catch(error => {
                console.log(error);
            });
            promiseArray.push(tempPromise);

            document.getElementById('content_div').appendChild(divObj);
        }
    }
    Promise.all(promiseArray).then(enableButtons);
}

function loadImage(url, title) {

    console.log('%c loadImage() called', 'background: #222; color: #bada55');
    /*  We are going to return a Promise when .then() will give us an Image that should be fully loaded. */
    return new Promise((resolve, reject) => {
        /*  Create the image that we are going to use to hold the resource.  */
        const imageObject = new Image();

        document.getElementById("loading_txt").style.display = "none";

        /*  The Image API deals in even listeners and callbacks we attach a listener for the "load" event which fires
            when the Image has finished the network request and populated the Image with data.  */
        imageObject.addEventListener('load', () => {

            imageObject.onclick = () => {
                console.log("Modal activated on clicked image :" + title);
                imageTitleOnModal(title);
            };
            /*  You have to manually tell the Promise that you are done dealing with asynchronous stuff and
                you are ready for it to give anything that attached a callback through .then() a realized value.
                We do that by calling resolve and passing it the realized value.   */
            resolve(imageObject)
        });

        imageObject.addEventListener("error", () => {
            imageObject.innerHTML = "Can't Load";
            reject();
        });

        /*  Setting the Image.src is what starts the networking process to populate an image.  After you set it,
            the browser fires a request to get the resource.  We attached a load listener which will be called once
            the request finishes and we have image data.    */
        imageObject.src = url;
    });
}

/*  Add a button to the page that allows you delete all the files
    you downloaded from Flickr (and only those files) from the cache.
    However, shouldn't delete the images of the last search
    assuming there was one. */
async function deleteCachedImages() {

    let images_LocalStorage = window.localStorage.getItem("images");

    let fromLocal = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
    let fromLocalUrls = fromLocal.map(x => x.imageSRC);

    let cachedImages = [];
    let differentImages = [];

    // Get a list of all of the caches for this origin
    const cacheNames = await caches.keys();

    for (const name of cacheNames) {
        // Open the cache
        const cache = await caches.open(name);

        // Get a list of entries. Each item is a Request object
        for (const request of await cache.keys()) {
            // If the request URL matches, add the response to the result
            if (request.url.startsWith('https://farm66.static.flickr.com')
                && request.url.endsWith('.jpg' || '.gif' || '.png')) {
                cachedImages.push(request.url);
            }
        }
    }

    /*  Find the different images.  */
    differentImages = cachedImages.filter(e => !fromLocalUrls.includes(e));

    // console.log("------ LOCALSTORAGE IMAGES   -----");
    // fromLocalUrls.forEach(function (entry) {
    //     console.log(entry);
    // });
    // console.log("------ CACHED IMAGES   -----");
    // cachedImages.forEach(function (entry) {
    //     console.log(entry);
    // });
    //
    // console.log("------ DIFFERENT IMAGES   -----");
    // differentImages.forEach(function (entry) {
    //     console.log(entry);
    // });

    /* Delete the 'different' images from cache.    */
    caches.open(cacheNames.toString()).then(function (cache) {
        for (let i = 0; i < differentImages.length; i++) {
            cache.delete(differentImages[i].toString()).then(function (response) {
                // console.log("Removed from cache: " + differentImages[i].toString());
            });
        }
    })

}

function searchMovie(searchText) {

    console.log("The input was: " + searchText);
    //Delaying the function execute
    if (this.timer) {
        window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(function() {
        /*  Execute the function 500 millisecond after when user stop typing.   */

        /*  Check that the application is offline or online every time when user type a character. */
        if (checkNetwork() === true) {

            /*  Clear the content area.  */
            document.getElementById("content_div").innerHTML = "";

            webWorker.postMessage(searchText);

            webWorker.onmessage = function (e) {
                if(typeof e.data === "number"){
                    // console.log("Percentage: " + e.data);
                    document.getElementById("percentage").textContent = e.data;
                    document.getElementById("progressBar").value = e.data;
                }
                else{
                    for(let i =0; i < e.data.length; i++){
                        let button = document.createElement("button");
                        button.setAttribute("class", "openLinkButton");
                        button.innerHTML = e.data[i].title;
                        button.addEventListener("click", function () {
                            window.open(e.data[i].url);
                        });
                        document.getElementById("content_div").appendChild(button);
                    }
                    // document.getElementById("content_div").innerHTML = e.data.title;
                }


            }

        }
    }, 500);

}

function startWorker() {
    if (typeof(webWorker) == "undefined") {
        webWorker = new Worker("./js/web_worker.js");
    }
}
function stopWorker() {
    webWorker.terminate();
    webWorker = undefined;
}
