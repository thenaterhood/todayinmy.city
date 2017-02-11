/**
 * Retrieves the first wikipedia article for a provided
 * name and passes it to the provided callback. If it fails,
 * "null" will be provided to the callback, or if provided,
 * the failCallback will be called.
 */
function getWikipediaExcerpt(name, callback, failCallback)
{
    $.getJSON("https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=" + name + "&redirects=1&callback=?",
        function(json) {
            handleAPIResponse(json, callback, failCallback);
        })
        .fail(handleAPIResponse(null, failCallback, failCallback));
}

function handleAPIResponse(wikipediaData, callback, failCallback)
{
    if (failCallback === null) {
        failCallback = callback;
    }

    if (wikipediaData === null) {
        failCallback(null);
        return;
    }

    let query = wikipediaData.query.pages;
    for (first in query) break;

    if (query[first].hasOwnProperty('missing')) {
        failCallback(null);
        return;
    }

    let data = []
    data.title = query[first].title;
    data.extract = query[first].extract;
    data.url = 'https://en.wikipedia.org/wiki/' + data.title

    callback(data);
}

