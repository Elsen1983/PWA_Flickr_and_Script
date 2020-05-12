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
                //getImages(searchTerms[i]);
            });
        }
        loadFromStorage();
    }
    //search2.html --> Script search
    else {

    }
}

/* ----------------------- Check if any search terms are in local storage. ----------------------- */
function loadFromStorage() {
    console.log('%c 1 - loadFromStorage called', 'background: #222; color: #bada55');
    let last_search_terms = localStorage.getItem("last_search");
    if (last_search_terms != null) {
        console.log("LOCALSTORAGE is NOT empty.");
        //getImages(last_search_terms);
    } else {
        console.log("LOCALSTORAGE is EMPTY.");
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