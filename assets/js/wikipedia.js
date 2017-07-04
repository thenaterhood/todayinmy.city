function Wikipedia()
{
    this.baseUrl = 'https://en.wikipedia.org';
    this.apiUrl = this.baseUrl + '/w/api.php';

    /**
     * Retrieves the first wikipedia article for a provided
     * name and passes it to the provided callback. If it fails,
     * "null" will be provided to the callback, or if provided,
     * the failCallback will be called.
     */
    this.getArticleExcerpt = function (name, callback, failCallback)
    {
        let getParams = {
            'format': 'json',
            'action': 'query',
            'prop': 'extracts',
            'exintro': '',
            'explaintext': '',
            'titles': name,
            'redirects': '1',
            'callback': '?'
        };

        let queryString = this._buildQueryString(getParams);
        let queryUrl = this.apiUrl + queryString;
        let inst = this;

        $.getJSON(queryUrl)
            .done(function(json) {
                inst._handleAPIResponse(json, callback, failCallback);
            })
            .fail(function(data) {
                inst._handleAPIResponse(null, failCallback, failCallback);
            });
    }

    this._handleAPIResponse = function (wikipediaData, callback, failCallback)
    {
        if (failCallback === null) {
            failCallback = callback;
        }

        if (wikipediaData === null) {
            failCallback(null);
        } else {
            let query = wikipediaData.query.pages;
            for (first in query) break;

            if (query[first].hasOwnProperty('missing')) {
                failCallback(null);
            } else {

                let data = []
                data.title = query[first].title;
                data.extract = query[first].extract;
                data.url = this.baseUrl + '/wiki/' + data.title

                callback(data);
            }
        }
    }

    /**
     * Builds a GET query string with the base url and an
     * object containing key/value pairs
     */
    this._buildQueryString = function(getParams)
    {
        let query = '?';
        let x;

        for (x in getParams) {
            if (x === "callback") {
                query += "callback=" + getParams[x];
            } else {
                query += encodeURIComponent(x) + "=" + encodeURIComponent(getParams[x]) + "&";
            }
        }

        return query;
    }
}
