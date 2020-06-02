/*  The web worker should do the following in response to a search term sent
    to it:
    1 - Automatically search though each film (i.e. loop through the
        array) in the JSON object.
    2 - For each film, check the title for occurrences of the search term
    3 - If you find a match send the (altered) title and the link for
        that film back to your main script (see next slide for how the title is
        altered).
    4 - As your search continues it should update your main script on
        its progress so it can update the progress bar and percentage
        completed text field. I.e. you should send it the percentage of the films
        you have searched. .
    5 - You should also inform the main script when the search is
        finished. You should convert the text that contained the match to highlight
        the match with a <mark> tag before you send it to the main script.
*/

/*  Development tips:
    The processing of nearly 1000 objects may take time when testing your code.
    To help with your development you might find it useful to arrange to
    only return a maximum of 100 results while testing (so you
    don't have to wait for the entire search to finish every time)
    It may also help to speed up your work flow to use a file with far
    fewer objects when testing your code at the beginning.

    Assuming you are sending percentage values to the main thread so it can
    draw the progress bar, the Web Worker could ensure the values are unique
    before sending them. I.e. there is no point in sending a value like 5% a 100
    times. Instead we send it once, and don't send the percentage value again
    until it has changed to 6%.

    Using regular expressions to wrap text around a given match.
    var regex = new RegExp("word",'ig');
    var text = "There is a word here";
    newText = text.replace(regex , '<mark>$&</mark>');
    console.log(newText);

    Communication
    Note that the communication from the WebWorker back to the main thread
    should be via JSON objects. This way we can send titles and descriptions with
    one message.
* */

/*  Declare 'global' variables. */
var movies = [];
let filmTitleSearch = "";
let outputMessage = {};
let foundFilmNumber = 0;
let currentPercentage = 0;
let previousPercentage = 0;

/*  Onmessage for incoming messages.    */
onmessage = function (incomingMessage) {

    // console.log("Webworker called with: " + incomingMessage.data);

    filmTitleSearch = incomingMessage.data;

    try {
        /*  Import the movieObj.js for films 'database'.  */
        /*  This time the processFilms(jsonp) function will called.   */
        importScripts("movieObj.js");
    } catch (error) {
        postMessage(error);
    }

    for (let i = 0; i < movies.length; i++) {
        currentPercentage = Math.round((i / movies.length) * 100);

        if (previousPercentage !== currentPercentage) {
            previousPercentage = currentPercentage;
            //setTimeout(function () {
                postMessage(currentPercentage);
                console.log("percentage: " + currentPercentage);
            //}, 100);
        }
    }

    /*  display the first 100 result from 'movies' array.   */
    let resultMoviesLimit = 100;
    outputMessage = movies.slice(0, resultMoviesLimit).map(film => ({title: film.title, url: film.url}));

    // console.log(outputMessage);
    postMessage(outputMessage);

    postMessage(100);
}

/*  processFilms function which automatically called when 'movieObj.js' imported.   */
function processFilms(jsonp) {
    // console.log("ProcessFilms called ...");
    /*  Must clear the movies array every time when new call is happening from app.js.  */
    movies.length = 0;
    foundFilmNumber = 0;

    for (let key in jsonp) {
        let filmTitle = jsonp[key].title.toString().toLowerCase();

        let filmObject = {
            title: markTitleSearch(jsonp[key].title, filmTitleSearch),
            url: jsonp[key].link
        }

        if (filmTitle.match(filmTitleSearch.toLowerCase())) {
            foundFilmNumber = movies.length + 1;
            movies.push(filmObject);
        }
    }
    // console.log("ProcessFilms Search finished...");
}

/*  Use this function to put <mark>text<mark> into the result title. In app.js use it to highlight the result.*/
function markTitleSearch(text, term) {
    return text.replace(new RegExp(term, "ig"), "<span class='insideSpan'>$&</span>");
}

/*  Used references */
/*  Using Web Workers : https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers  */
/*  The Basics of Web Workers : https://www.html5rocks.com/en/tutorials/workers/basics/ */
/*  WebWorker example using importScript  : https://gist.github.com/akirattii/8e6b579c59bd24a1bebfe9e192fbed45  */
