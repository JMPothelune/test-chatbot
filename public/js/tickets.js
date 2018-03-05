function getQueryParams(qs) {
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}



document.addEventListener("DOMContentLoaded", function(event) {
    var plateformDomElement = document.getElementsByName("platform")[0];
    var titleDomElement = document.getElementsByName("title")[0];
    var descDomElement = document.getElementsByName("message")[0];

    var queryParams = getQueryParams(document.location.search)
    plateformDomElement.value = queryParams.platform || "";
    titleDomElement.value = queryParams.title || "";
    descDomElement.value = queryParams.message || "";
});