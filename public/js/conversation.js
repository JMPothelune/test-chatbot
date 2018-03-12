// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function() {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWatson: '.from-watson',
      latest: '.latest',
      quickRepliesHolder: '#quickRepliesHolder'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };
  var conversationLogs = [];
  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown
  };

  // Initialize the module
  function init() {
    chatUpdateSetup();
    Api.sendRequest( '', null );
    setupInputBox();
  }
  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function(newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function(newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
    };
  }

// Set up the input box to underline text as it is typed
  // This is done by creating a hidden dummy version of the input box that
  // is used to determine what the width of the input text should be.
  // This value is then used to set the new width of the visible input box.
  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var minFontSize = 14;
    var maxFontSize = 16;
    var minPadding = 4;
    var maxPadding = 6;

    // If no dummy input box exists, create one
    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      document.body.appendChild(dummy);
    }

    function adjustInput() {
      if (input.value === '') {
        // If the input box is empty, remove the underline
        input.classList.remove('underline');
        input.setAttribute('style', 'width:' + '100%');
        input.style.width = '100%';
      } else {
        // otherwise, adjust the dummy text to match, and then set the width of
        // the visible input box to match it (thus extending the underline)
        input.classList.add('underline');
        var txtNode = document.createTextNode(input.value);
        ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
          'text-transform', 'letter-spacing'].forEach(function(index) {
            dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
          });
        dummy.textContent = txtNode.textContent;

        var padding = 0;
        var htmlElem = document.getElementsByTagName('html')[0];
        var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
        if (currentFontSize) {
          padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize)
            * (maxPadding - minPadding) + minPadding);
        } else {
          padding = maxPadding;
        }

        var widthValue = ( dummy.offsetWidth + padding) + 'px';
        input.setAttribute('style', 'width:' + widthValue);
        input.style.width = widthValue;
      }
    }

    // Any time the input changes, or the window resizes, adjust the size of the input box
    input.addEventListener('input', adjustInput);
    window.addEventListener('resize', adjustInput);

    // Trigger the input event once to set up the input box and dummy element
    Common.fireEvent(input, 'input');
  }

  
  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    conversationLogs.push(newPayload);
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text)
      || (newPayload.output && newPayload.output.text);
    if (isUser !== null && textExists) {
      // Create new message DOM element
      var messageDivs = buildMessageDomElements(newPayload, isUser);
      var imageDivs = buildImagesDomElements(newPayload, isUser);
      var choiceDivs = buildChoicesDomElements(newPayload, isUser);
      var videoDivs = buildVideoDomElements(newPayload, isUser);
      var reviewDivs = buildReviewDomElements(newPayload, isUser);
      var ticketDivs = buildTicketDomElements(newPayload, isUser);
      console.log("imageDivs", imageDivs)
      console.log("choiceDivs", choiceDivs)
      console.log("videoDivs", videoDivs)
      console.log("reviewDivs", reviewDivs)
      console.log("ticketDivs", ticketDivs)
      messageDivs= messageDivs.concat(imageDivs);
      messageDivs= messageDivs.concat(choiceDivs);
      messageDivs= messageDivs.concat(videoDivs);
      messageDivs= messageDivs.concat(reviewDivs);
      messageDivs= messageDivs.concat(ticketDivs);


      console.log("messageDivs", messageDivs)
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser
              ? settings.selectors.fromUser : settings.selectors.fromWatson)
              + settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function(element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function(currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom();
    }

    updateQuickReplies(newPayload);

    
  }

  // Display a user or Watson message that has just been sent/received
  function updateQuickReplies(newPayload) {

    var quickRepliesExists = (newPayload.output && newPayload.output.quickReplies);
    var quickRepliesHolder = document.querySelector(settings.selectors.quickRepliesHolder);

    // Remove alls
    while (quickRepliesHolder.firstChild) {
      quickRepliesHolder.removeChild(quickRepliesHolder.firstChild);
    } 

    if (quickRepliesExists) {
      // Create new quickReplies DOM element
      var quickRepliesDivs = buildQuickRepliesElements(newPayload);

      quickRepliesDivs.forEach(function(currentDiv) {
        quickRepliesHolder.appendChild(currentDiv);
      });
    }

    var input = document.getElementById('textInput');
    console.log("===============input", input)
    if(input){
      console.log("=============== newPayload.output", newPayload.output)      
      if(quickRepliesExists
        && (newPayload.output 
          && newPayload.output.options 
          && newPayload.output.options.includes("forceQuickReplies"))) {
            
            input.disabled="disabled";
            input.placeholder = "Séléctionner une des réponses"
          }else{
            input.disabled=null;
            input.placeholder = "Votre message"
          }
      

    }
  }


  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var textArray = isUser ? newPayload.input.text : newPayload.output.text;
    if (Object.prototype.toString.call( textArray ) !== '[object Array]') {
      textArray = [textArray];
    }

    var messageArray = [];

    textArray.forEach(function(currentText) {
      if (currentText) {

        text = currentText;
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                // <p>{messageText}</p>
                'tagName': 'p',
                'text': currentText
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    return messageArray;
  }

  // Constructs new DOM element from a message payload
  function buildImagesDomElements(newPayload, isUser) {
    
    var elementsArray = [];
    
    if(newPayload.output && newPayload.output.images){
      elementsArray = newPayload.output.images;
    }

    if (Object.prototype.toString.call( elementsArray ) !== '[object Array]') {
      elementsArray = [elementsArray];
    }
    console.log("buildImagesDomElements","elementsArray", elementsArray)

    var messageArray = [];

    elementsArray.forEach(function(element) {
      if (element) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', 'sub'],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                'tagName': 'div',
                'children': [{
                  'tagName': 'img',
                  "attributes" : [
                    {'name':'src', "value": element.src},
                    {'name':'width', "value": "300"}
                  ]
                }]
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    return messageArray;
  }

  // Constructs new DOM element from a message payload
  function buildChoicesDomElements(newPayload, isUser) {
    
    var elementsArray = [];
    
    if(newPayload.output && newPayload.output.choices){
      elementsArray = newPayload.output.choices;
    }

    if (Object.prototype.toString.call( elementsArray ) !== '[object Array]') {
      elementsArray = [elementsArray];
    }
    console.log("buildChoicesDomElements","elementsArray", elementsArray)

    var messageArray = [];

    elementsArray.forEach(function(element) {
      if (element) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', 'sub'],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                'tagName': 'div',
                'classNames': ['choice'],
                'children': [{
              
                  // <p>{messageText}</p>
                  'tagName': 'img',
                  "attributes" : [
                    {'name':'src', "value": element.image},
                    {'name':'width', "value": "300"}
                  ]
                  
                }]
              }]
            }]
          }]
        };
        
        var domElement = Common.buildDomElement(messageJson);
        domElement.addEventListener("click", function(e){
          var message = element.message || "trouvé";
          sendMessage(message);
        })
        messageArray.push(domElement);
      }
    });

    return messageArray;
  }


  // Constructs new DOM element from a message payload
  function buildReviewDomElements(newPayload, isUser) {
    
    if(!(newPayload.output && newPayload.output.options && newPayload.output.options.includes("review"))) {

      return [];
    }

    var conversationToSend = JSON.clone(conversationLogs);
  
    var elementsArray = [
      { value:"good", image:"../img/smiling.png"},
      { value:"neutral", image:"../img/confused.png"},
      { value:"bad", image:"../img/sad.png"}
    ];
    

    var messageArray = [];

    var buttonArray = [];
    
    elementsArray.forEach(function(element) {
      if (element) {
        buttonArray.push(
          {
            'tagName': 'div',
            'children': [{
              // <p>{messageText}</p>
              'tagName': 'img',
              'classNames': ['conversation-review-button', element.value],
              "attributes" : [
                {'name':'src', "value": element.image},
              ]
              
            }]
          })
      }
    });

    var messageJson = {
      // <div class='segments'>
      'tagName': 'div',
      'classNames': ['segments'],
      'children': [{
        // <div class='from-user/from-watson latest'>
        'tagName': 'div',
        'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', 'sub'],
        'children': [{
          // <div class='message-inner'>
          'tagName': 'div',
          'classNames': ['message-inner'],
          'children': [{
            'tagName': 'div',
            'classNames': ['conversation-review'],
            'children': buttonArray
          }]
        }]
      }]
    };
    
    var domParentElement = Common.buildDomElement(messageJson);

    console.log(domParentElement)
    elementsArray.forEach(function(element) {
      if (element) {
        domParentElement.getElementsByClassName(element.value)[0]
          .addEventListener("click", function(e){
            sendReview(conversationToSend, element.value)
          })
      }
    });

    return [domParentElement];
  }
  
  // Constructs new DOM element from a message payload
  function buildVideoDomElements(newPayload, isUser) {
    
    var elementsArray = [];
    
    if(newPayload.output && newPayload.output.video){
      elementsArray = newPayload.output.video;
    }

    if (Object.prototype.toString.call( elementsArray ) !== '[object Array]') {
      elementsArray = [elementsArray];
    }

    console.log("buildVideoDomElements","elementsArray", elementsArray)
    var messageArray = [];

    elementsArray.forEach(function(element) {
      if (element) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', 'sub'],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                'tagName': 'iframe',
                "attributes" : [
                  {'name':'src', "value": element},
                  {'name':'width', "value": "300"},
                  {'name':'frameborder', "value": "0"},
                  {'name':'allowfullscreen', "value": "true"}
                ]
              }]
            }]
          }]
        };
        
        var domElement = Common.buildDomElement(messageJson);
        domElement.addEventListener("click", function(e){
          var message = element.message || "trouvé";
          sendMessage(message);
        })
        messageArray.push(domElement);
      }
    });
    console.log("buildVideoDomElements","messageArray", messageArray)

    return messageArray;
  }

  
  
  // Constructs new DOM element from a message payload
  function buildTicketDomElements(newPayload, isUser) {
    
    var elementsArray = [];
    
    if(newPayload.output && newPayload.output.ticket){
      elementsArray = newPayload.output.ticket;
    }

    if (Object.prototype.toString.call( elementsArray ) !== '[object Array]') {
      elementsArray = [elementsArray];
    }

    console.log("buildTicketDomElements","elementsArray", elementsArray)
    var messageArray = [];

    elementsArray.forEach(function(element) {
      if (element) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', 'sub'],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                'tagName': 'a',
                'classNames': ['createTicket'],
                "attributes" : [
                  {'name':'href', "value": "./ticket.html?" + getAsUriParameters(element)}
                ],
                'text': "Ouvrir une demande"
              }]
            }]
          }]
        };
        
        var domElement = Common.buildDomElement(messageJson);
        domElement.addEventListener("click", function(e){
          var message = element.message || "trouvé";
          sendMessage(message);
        })
        messageArray.push(domElement);
      }
    });
    console.log("buildVideoDomElements","messageArray", messageArray)

    return messageArray;
  }
  // Constructs new DOM element from a message payload
  function buildQuickRepliesElements(newPayload) {
    var quickReplies = newPayload.output.quickReplies;
    if (Object.prototype.toString.call( quickReplies ) !== '[object Array]') {
      quickReplies = [quickReplies];
    }
    var quickRepliesArray = [];

    quickReplies.forEach(function(quickReply) {
      if (quickReply) {
        var messageJson = {
          // <div class='quickReply'>
          'tagName': 'div',
          'classNames': ['quickReply'],
          'text': quickReply.text
        };
        var domElement = Common.buildDomElement(messageJson);
        domElement.addEventListener("click", function(e){
          var message = quickReply.message || quickReply.text;
          sendMessage(message);
        })
        quickRepliesArray.push(domElement);
      }
    });



    return quickRepliesArray;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.
  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser
            + settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      sendMessage(inputBox.value)
      inputBox.value = '';
      // Clear input box for further messages
      Common.fireEvent(inputBox, 'input');
    }
  }

  function sendMessage(message){
    
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest(message, context);

  }
  function sendReview(conversation, review){
    console.log(Api);
    // Send the user message
    Api.sendReview(review, conversation);
  }
  
}());


function getAsUriParameters(data) {
  var url = '';
  for (var prop in data) {
     url += encodeURIComponent(prop) + '=' + 
         encodeURIComponent(data[prop]) + '&';
  }
  return url.substring(0, url.length - 1)
}

if (typeof JSON.clone !== "function") {
  JSON.clone = function(obj) {
      return JSON.parse(JSON.stringify(obj));
  };
}