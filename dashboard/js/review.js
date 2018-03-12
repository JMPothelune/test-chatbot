var _th_ = document.createElement('th'),
    _td_ = document.createElement('td');
    _tr_ = document.createElement('tr');
    _i_ = document.createElement('i'); 
    _i_.className = ["mdl-color-text--blue-grey-300 material-icons"];

var REVIEW_ICONS = {
    "good":"sentiment_very_satisfied",
    "bad":"sentiment_very_dissatisfied",
    "neutral":"sentiment_neutral"
    }

function getReviews() {
    // Built http request
    var http = new XMLHttpRequest();
    http.open('GET', '/api/review', true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
        if (http.readyState === 4 && http.status === 200 && http.responseText) {
            onReviewHandler(JSON.parse(http.responseText));
        }
    };

    // Send request
    http.send();
}

var reviews = [];
var tbody = document.getElementById("conversation-list");

function onReviewHandler(data) {
    
    reviews = [];
    var reviewsValues = {good:0, neutral:0, bad:0};

    for (var i=0, maxi=data.rows.length; i < maxi; ++i) {
        var review = data.rows[i].doc; 
        reviews.push(review);
        if(review.review) {reviewsValues[review.review] ++;}
    }

    reviews.sort(function(a,b){
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return (b.date || 0) -  (a.date || 0);
      });
    console.log(reviews)
    console.log(reviewsValues)

    setDataValue(tbody, reviews)
    setRateValues(reviewsValues)

}

function showReview(review){
    
    ConversationPanel.clear();
    for (var i=0, maxi=review.conversation.length; i < maxi; ++i) {
        var payload = review.conversation[i];
        ConversationPanel.displayMessage(payload , i%2 == 0 ?  'watson' : 'user')
    }
}


function setRateValues(reviewsValues) {

    var sum = reviewsValues.good + reviewsValues.neutral + reviewsValues.bad;
    console.log("sum", sum)
    if(sum> 0){

        document.getElementById('stats-bad').style = "width:"+reviewsValues.bad/sum*100+"%;";
        document.getElementById('stats-neutral').style = "width:"+reviewsValues.neutral/sum*100+"%;";
        document.getElementById('stats-good').style = "width:"+reviewsValues.good/sum*100+"%; ";
    }
}


function setDataValue(tbody, data) {
    tbody.innerHTML = "";
    for (var i=0, maxi=data.length; i < maxi; ++i) {
        var review = data[i];
        var tr = _tr_.cloneNode(false);
        {
            var td = _td_.cloneNode(false);
            td.appendChild(document.createTextNode(review.date ? moment.unix(review.date).calendar() : 'Inconnue'));
            tr.appendChild(td);
        }
        
        {
            var td = _td_.cloneNode(false);
            td.appendChild(document.createTextNode(review.conversation ? review.conversation.length : '?'));
            tr.appendChild(td);
        }
        
        {
            var ic = _i_.cloneNode(false);
            var td = _td_.cloneNode(false);
            ic.innerHTML = review.review ?  REVIEW_ICONS[review.review] || ' ' : ' ';
            td.appendChild(ic);
            tr.appendChild(td);
        }
        tr.className = i;
        tr.addEventListener("click",onItemClick(review, i));
        tbody.appendChild(tr);
    }
}


function onItemClick(review, i){
    return  function(event){
        console.log(i)
        showReview(review)
    }
} 

window.onload = function(){
    getReviews();
}