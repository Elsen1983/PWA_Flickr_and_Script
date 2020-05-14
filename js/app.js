/* ----------------------- Declare the variables ----------------------- */
const searchTerms = ["Ivan Aivazovsky", "Henry Pether", "Robin Jacques"];
var images_Array = [];
let buttons = document.getElementsByClassName("buttons");

/* ----------------------- Setup the page ----------------------- */
window.addEventListener("load", init);
window.addEventListener('resize', resizePage);

function init() {
    onloadFunction();
    checkNetwork();
    // loadFromStorage();

}



/* ----------------------- Search Flickr - getImages -----------------------*/
function getImages(searchTermText) {

    console.log('%c  2 - getImage() called with ' + searchTermText, 'background: #222; color: #bada55');

    window.localStorage.setItem('last_search', searchTermText);

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
    // fetch(scriptTag.src).then(function (response) {
    //     console.log(response);
    //
    // })
    bodyZero.appendChild(scriptTag);
    disableButtons();
}

/* -------------------Handle FlickrSearch Results ------------------*/
function showImages(images) {
    addArrowButtons();
    console.log(images);
    console.log("%c  3 - showImages called", 'background: #222; color: #bada55');

    let flickrImageArray = [];
    document.getElementById('content_div').innerHTML = "";
    if (images.stat === 'fail') {
        document.getElementById('content_div').innerHTML = "Error";
        enableButtons();
    } else {
        /* clear the images array, because we want to store just the last searchTerm + images in the localStorage*/
        images_Array.length = 0;

        let targetnr = images.photos.photo.length;
        if (targetnr === 0) {
            document.getElementById('content_div').innerHTML = "No Results";
            enableButtons();
        } else {
            for (let i = 0; i < images.photos.photo.length; i++) {
                let url = "https://farm" + images.photos.photo[i].farm;
                let imgName = "/";
                let title = images.photos.photo[i].title;

                //if(caches.match())

                url += ".static.flickr.com";

                imgName += images.photos.photo[i].server + "/";
                imgName += images.photos.photo[i].id + "_";
                imgName += images.photos.photo[i].secret;
                let big_Url = url + imgName + ".jpg";
                // console.log("Image: " + imgName + ".jpg");
                let image_name_extension = imgName + ".jpg";

                /*  Add the current images into the 'images_Array' with name+extension */
                images_Array.push(image_name_extension);

                //clear the images in localStorage
                removeItemFromLocalStorage("images");
                //add current images into localStorage
                addItemToLocalStorage("images", JSON.stringify(images_Array));

                //??need here to check the net connection is ready or not
                flickrImageArray.push(new FlickrImage(big_Url, title, image_name_extension));
            }
            createImages(flickrImageArray);

        }
    }
}

/* - Constructor for FlickrImages object*/
function FlickrImage(image_URL, image_Title, image_NameAndExtension) {
    console.log("FlickrImage constructor called");
    this.imageSRC = image_URL;
    this.imageTitle = image_Title;
    this.imageName = image_NameAndExtension;
}

FlickrImage.prototype.getImageObject = function () {
    console.log("FlickrImage.prototype.getImageObject called");
    //console.log("return promises: " + this.imageSRC);

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
    console.log("createImages called");
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

//Show-hide menu for btn
function hide_Menu() {
    const x = document.getElementById("product_inner_container");
    // console.log(x.style.display);
    if (x.style.display === "none") {
        x.style.display = "flex";
    } else {
        x.style.display = "none";
    }
}

//hide some element from the DOM
//must use it because JS not reading the CSS style on onload (just inline style)
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
    //scroll down button
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
    //scroll up button
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

function checkNetwork() {

    console.log('%c 1 - checkNetwork() called', 'background: #222; color: #bada55');

    /*  Check that the button_Nav is exists or not --> index.html or search2.html */
    /*  Option 1 - index.html --> Flickr search */
    if (typeof (document.getElementById("buttons_Nav")) != 'undefined' && document.getElementById("buttons_Nav") != null) {
        console.log("-----------------------");
        console.log("---- Flickr Search ----");
        console.log("-----------------------\n");
        /* Option 1 - App is OFFLINE */
        if (!navigator.onLine) {
            console.log("App is OFFLINE");
            if (checkLocalStorageUsage() === false) {

                console.log("LOCALSTORAGE is NOT used earlier.");

                document.getElementById('loading_txt').innerHTML = "Sorry, Can't access Flickr.";
                document.getElementById('content_div').innerHTML = "Try again later.";
                makeButtons("checkNetwork");

            } else {
                console.log("LOCALSTORAGE is used earlier.");
                console.log("load images from CACHE...");
                let x = window.caches.open("v1");
                console.log("length" + x.length);

            }
        }
        /* Option 2 - App is Online */
        else {
            console.log("App is ONLINE");
            /*  never used before */
            if (checkLocalStorageUsage() === false) {
                console.log("LOCALSTORAGE is NOT used earlier.");
                /*  generate the buttons */
                makeButtons("searchNetwork");
            }
            /*  used before */
            else{
                console.log("LOCALSTORAGE is used earlier.");
                console.log("load images from CACHE...");
                /*  generate the buttons */
                makeButtons("searchNetwork");
                /* load images from Cache */

            }

        }
    }/* Option 1.b - App is never used before or localStorage and cache are cleaned out */
    else {
        /*  Search SCRIPT page */
        console.log("-----------------------");
        console.log("---- Script Search ----");
        console.log("-----------------------\n");
    }
}

function checkLocalStorageUsage() {

    console.log('%c 2 - checkLocalStorageUsage() called', 'background: #222; color: #bada55');

    let last_search_terms = window.localStorage.getItem("last_search");
    let images_LocalStorage = window.localStorage.getItem("images");

    let used = false;

    /* Option 1.a - App is used before */
    if (last_search_terms != null && images_LocalStorage != null) {
        used = true;
        return used;
        //load the last loaded images to the screen if possible
        // images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
        // showImages(images_LocalStorage);
    }
    /* Option 1.b - App is never used before or localStorage and cache are cleaned out */
    else {

        return used;
    }


    //get images from localstorage
    //var images_LocalStorage = localStorage.getItem("images");
    // if (!images_LocalStorage) {
    //     console.log("images not stored in localStorage earlier");
    //     /* indicate that app is offline and never used before */
    // } else {
    //     console.log("images stored in localStorage earlier");
    //     /* load images from localStorage */
    //     images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
    //     console.log(images_LocalStorage);
    //
    // }
}

function makeButtons(type) {

    /*  remove the buttons generated before */
    let buttonsForRemove = document.getElementById("buttons_Nav");
    buttonsForRemove.innerHTML = '';

    for (let i = 0; i < searchTerms.length; i++) {
        let newB = document.createElement("li");
        newB.setAttribute("class", "buttons");
        let newT = document.createTextNode(searchTerms[i]);
        newB.appendChild(newT);
        /*  add buttons to the 'sidebar' */
        document.getElementById("buttons_Nav").appendChild(newB);
        /*  add event listeners to the buttons */
        newB.addEventListener("click", function () {

            if (type === "checkNetwork") {
                console.log("button pressed -> check Network because app offline");
                checkNetwork();
            }

            if(type === "searchNetwork"){
                console.log("button pressed -> add " + searchTerms[i] + " into searchTerms");
                /*  add selected term into searchTerms */
                getImages(searchTerms[i]);
            }

        });
    }
}




















/* ----------------------- load and check the localStorage ----------------------- */
function loadFromStorage(btnInfo) {


    /* Option 1 - App is OFFLINE */
    if (!navigator.onLine) {

        console.log("App is offline, so try to add last loaded images to the page if possible");

        /* Option 1.a - App is used before */
        if (last_search_terms != null) {
            console.log("LOCALSTORAGE is used earlier.");
            //load the last loaded images to the screen if possible
            images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
            showImages(images_LocalStorage);
        }
        /* Option 1.b - App is never used before or localStorage and cache are cleaned out */
        else {
            console.log("LOCALSTORAGE is NOT used earlier.");
        }


        //get images from localstorage
        //var images_LocalStorage = localStorage.getItem("images");
        if (!images_LocalStorage) {
            console.log("images not stored in localStorage earlier");
            /* indicate that app is offline and never used before */
        } else {
            console.log("images stored in localStorage earlier");
            /* load images from localStorage */
            images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
            console.log(images_LocalStorage);

        }

    }
    /* Option 2 - App is ONLINE */
    else {
        console.log("App is online, so try to add last loaded images to the page if possible or load from network");
        /*  Option 2.a - Found earlier search term and images in localStorage */
        if (last_search_terms != null && images_LocalStorage != null) {
            console.log("LOCALSTORAGE is NOT empty.");
            /* try to load images first from cache */
            // if(images_LocalStorage != null){
            //     console.log("Load images from Cache.");
            getImages(last_search_terms);
            // }
            // else{
            //     console.log("Load images from network.");
            //     //getImages(last_search_terms);
            // }

        }
        /*  Option 2.a - Didn't find earlier search term and images in localStorage */
        else {
            console.log("LOCALSTORAGE is EMPTY.");
            console.log("Load images from network.");
            //getImages(last_search_terms);
        }
    }
}