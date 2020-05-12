/* ----------------------- Declare the variables ----------------------- */
const searchTerms = ["Ivan Aivazovsky", "Henry Pether", "Robin Jacques"];
var images_Array = [];
let buttons = document.getElementsByClassName("buttons");

/* ----------------------- Setup the page ----------------------- */
window.addEventListener("load", init);
window.addEventListener('resize', resizePage);

function init() {
    //check that the button_Nav is exists or not --> index.html or search2.html
    //index.html --> Flickr search
    if (typeof (document.getElementById("buttons_Nav")) != 'undefined' && document.getElementById("buttons_Nav") != null) {

        onloadFunction();

        for (let i = 0; i < searchTerms.length; i++) {
            let newB = document.createElement("li");
            newB.setAttribute("class", "buttons");
            let newT = document.createTextNode(searchTerms[i]);
            newB.appendChild(newT);
            //add buttons to the 'sidebar'
            document.getElementById("buttons_Nav").appendChild(newB);
            //add event listeners to the buttons
            newB.addEventListener("click", function () {
                console.log("button pressed -> add " + searchTerms[i] + " into searchTerms");
                //if app is not online --> offline, so load the last loaded images to the screen
                if (!navigator.onLine) {
                    console.log("App is offline, so add last loaded images to the page");

                }
                //app is online
                else{
                    getImages(searchTerms[i]);
                }
            });
        }
        loadFromStorage();
    }
    //search2.html --> Script search
    else {

    }
}

/* ----------------------- load and check the localStorage ----------------------- */
function loadFromStorage() {
    console.log('%c 1 - loadFromStorage called', 'background: #222; color: #bada55');

    //app is offline
    if (!navigator.onLine) {

        console.log("App is offline, so add last loaded images to the page if loaded earlier");

        let last_search_terms = window.localStorage.getItem("last_search");
        let images_LocalStorage = window.localStorage.getItem("images");

        /*  check that the app used earlier or not*/
        if (last_search_terms != null) {
            console.log("LOCALSTORAGE is NOT empty. Used earlier.");
            //load the last loaded images to the screen if possible
            images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
            showImages(images_LocalStorage);
        }
        else{
            console.log("LOCALSTORAGE is EMPTY.");
        }


        //get images from localstorage
        //var images_LocalStorage = localStorage.getItem("images");
        if(!images_LocalStorage){
            console.log("images not stored in localStorage earlier");
        }
        else{
            console.log("images stored in localStorage earlier");
            images_LocalStorage = (images_LocalStorage) ? JSON.parse(images_LocalStorage) : [];
            console.log(images_LocalStorage);

        }

    }
    //app is online
    else{
        let last_search_terms = window.localStorage.getItem("last_search");
        if (last_search_terms != null) {
            console.log("LOCALSTORAGE is NOT empty.");
            getImages(last_search_terms);
        } else {
            console.log("LOCALSTORAGE is EMPTY.");
        }
    }
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

    for(let i=0; i < all_script.length; i++) {
        if (all_script[i].src.toString() !== full.toString()) {
            //do nothing because the script is not in the DOM
        }
        else{
            //remove the same script tag
            all_script[i].parentNode.removeChild( all_script[i] );
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
    console.log(images);
    console.log("%c  3 - showImages called", 'background: #222; color: #bada55');
    if(!navigator.onLine){
        console.log("OFFLINE");
    }

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
    }
    else{
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

function removeItemFromLocalStorage(key){
    window.localStorage.removeItem(key);
}

function addItemToLocalStorage(key,value){
    window.localStorage.setItem(key, value);
}