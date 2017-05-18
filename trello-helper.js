    "use strict";

    var eles = {};

    var vars = {
        key:               null,
        token:             null,
        returnedListId:    '57d0282ed1cb0995d9b5f263',
        onItListId:        '57c9e09dd0dca2c30483d34e',
        peerReviewListId:  '57d0282570000099713f40f7',
        needsReviewListId: '57d028c20cb6dc5aad391c91',
        needsQaListId:     '57d305e5d0e02587c9d94dd9',
        iconEmoji:         ':robot_face:',
        botName:           'Trello Helper',
        webhook:           'https://hooks.slack.com/services/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',
        channelId:         '#selfslack',
        trelloBaseApi:     'https://api.trello.com/1',
        href:              null,
        isFirstInit:       true,
        currentJson:       null,
        id:                null,
        memberName:        null,
        memberUsername:    null,
        memberId:          null
    };

    var funcs = {
        init: () => {
            // Grab the key and token from storage
            chrome.storage.sync.get('apiKey', (data) => {
                vars.key = data.apiKey;
            });
            chrome.storage.sync.get('apiToken', (data) => {
                vars.token = data.apiToken;
            });

            // Grab the URL
            vars.href = window.location.href;

            // First time through?
            if(vars.isFirstInit) {
                vars.isFirstInit = false;

                // Add a listener for messages from the background js
                chrome.runtime.onMessage.addListener(function(request, sender) {
                    if(request.hasHistoryUpdated) {
                        funcs.init();
                    }
                });
            }

            // Check to see if we're looking at a card...if we are, grab the ID
            if (vars.href.indexOf('/c/') >= 0) {
                vars.id = vars.href.substring(21, 29);
            }
            else {
                // Not looking at a card?  Go ahead and quit
                return;
            }

            // Grab the current user full name...gotta wait for it to be on the page though
            var timeElapsed = 0,
                memberNameInterval =     window.setInterval(() => {
                    var memberName =     document.getElementsByClassName('js-member-name')[0],
                        memberAvatar =   document.getElementsByClassName('member-avatar')[0];

                    // We found the element, set the vars and continue
                    if(memberName && memberAvatar) {
                        vars.memberName =       memberName.innerText;
                        vars.memberUsername =   /\(([^)]+)\)/.exec(memberAvatar.alt)[1];

                        clearInterval(memberNameInterval)

                        // We have a member name, get the card info
                        funcs.getCardInfo();
                    }
                    // Nothing found yet, add to the timeElapsed
                    else {
                        timeElapsed += 50;
                    }

                    // We're not waiting longer than 3 seconds...if it's not there yet, it ain't happening
                    if(timeElapsed > 3000) {
                        clearInterval(memberNameInterval);
                    }
                }, 50);
        },
        getCardInfo: () => {
            // Pointless without the key and token
            if(!vars.key || !vars.token) {
                return;
            }

            fetch(`${vars.trelloBaseApi}/cards/${vars.id}?key=${vars.key}&token=${vars.token}`, {method: 'GET'})
                .then((response) => {
                    return response.json().then((json) => {
                        vars.currentJson = json;
                        switch (json.idList) {
                            case vars.onItListId:
                                funcs.addReviewReadyMarkup();
                                break;
                            case vars.needsReviewListId:
                                funcs.acceptReviewMarkupEligible();
                                break;
                            case vars.peerReviewListId:
                                funcs.addApproveRejectMarkup();
                                break;
                            default:
                                break;
                        }
                    });
                });
        },
        addReviewReadyMarkup: () => {
            // Grab the elements
            var sidebar = document.getElementsByClassName('window-sidebar'),
                reviewContainer = document.getElementsByClassName('review-container');

            // If the sidebar is there, and the container isn't, add that!
            if (sidebar[0] && !reviewContainer[0]) {
                // Add the markup
                sidebar[0].insertAdjacentHTML('afterbegin', tmpls.reviewReadyMarkup());

                // Add the listener
                document.getElementsByClassName('review-ready-button')[0].addEventListener('click', funcs.processReviewReady);
            }
        },
        processReviewReady: (e) => {
            // Don't follow the link...
            e.preventDefault();

            // If it's listed as critical, alert team via Slack
            if(vars.currentJson.labels.filter(e => e.name == 'critical').length > 0) {
                funcs.sendToSlack(`A <${vars.currentJson.shortUrl}|critical card> needs peer review.`);
            }

            // Remove the markup, it's no longer applicable
            document.getElementsByClassName('review-container')[0].remove();

            // Move the card
            funcs.moveCardToDestination(vars.needsReviewListId);

            // Run init again to add new markup
            funcs.init();
        },
        acceptReviewMarkupEligible: () => {
            // This one is deep, since we're only going to show the markup if they're not a member on the card...
            // We're going to make one batch call with all the members on the card, then check the markup on the page
            // to see if they're there....so, let's start with an empty array for the URLs we're going to batch
            var batchUrls = [];

            // Loop through the members on the card, add to the batch
            vars.currentJson.idMembers.forEach((element) => {
                batchUrls.push(`/members/${element}/fullName`);
            });

            // Joining the array with a comma, for a nice comma separated list
            batchUrls = batchUrls.join(',');

            // Nobody on the card?  Anyone can review...add the markup
            if(!batchUrls) {
                funcs.addAcceptReviewMarkup();
                return;
            }

            // Grab the usernames of our members
            fetch(`${vars.trelloBaseApi}/batch?key=${vars.key}&token=${vars.token}&urls=${batchUrls}`, {method: 'GET'})
                .then((response) => {
                    return response.json().then((json) => {
                        // Check to see if the member isn't found on the card...add the markup if they're not
                        if(!json.filter(e => e[200] == vars.memberName).length > 0) {
                            funcs.addAcceptReviewMarkup();
                        }
                    });
                });
        },
        addAcceptReviewMarkup: () => {
            // Grab the elements
            var sidebar =         document.getElementsByClassName('window-sidebar'),
                acceptContainer = document.getElementsByClassName('accept-container');

            // If the sidebar is there, and the container isn't, add that!
            if(sidebar[0] && !acceptContainer[0]) {
                //Add the markup
                sidebar[0].insertAdjacentHTML('afterbegin', tmpls.acceptReviewMarkup());

                // Add the listener
                document.getElementsByClassName('accept-review-button')[0].addEventListener('click', funcs.processAcceptReview);
            }
        },
        processAcceptReview: (e) => {
            // Don't follow the link...
            e.preventDefault();

            // If it's listed as critical, alert team via Slack
            if(vars.currentJson.labels.filter(e => e.name == 'critical').length > 0) {
                funcs.sendToSlack(`A <${vars.currentJson.shortUrl}|critical card> is now under peer review.`);
            }

            // Add current member to the card
            fetch(`${vars.trelloBaseApi}/members/${vars.memberUsername}?key=${vars.key}&token=${vars.token}&fields=id`, {method: 'GET'})
                .then((response) => {
                    return response.json().then((json) => {
                        fetch(`${vars.trelloBaseApi}/cards/${vars.id}/idMembers?key=${vars.key}&token=${vars.token}&value=${json.id}`, {method: 'PUT'});
                    });
                });

            // Move the card
            funcs.moveCardToDestination(vars.peerReviewListId);

            // Remove the markup, it's no longer applicable
            document.getElementsByClassName('accept-container')[0].remove();

            // Run init again to add new markup
            funcs.init();
        },
        addApproveRejectMarkup: () => {
            // Grab the elements
            var sidebar =         document.getElementsByClassName('window-sidebar'),
                acceptContainer = document.getElementsByClassName('accept-container');

            // If the sidebar is there, and the container isn't, add that!
            if(sidebar[0] && !acceptContainer[0]) {
                //Add the markup
                sidebar[0].insertAdjacentHTML('afterbegin', tmpls.approveRejectMarkup());

                // Add the listeners
                document.getElementsByClassName('approve-button')[0].addEventListener('click', funcs.processApproveRejectReview);
                document.getElementsByClassName('reject-button')[0].addEventListener('click', funcs.processApproveRejectReview);
            }
        },
        processApproveRejectReview: (e) => {
            // Don't follow the link
            e.preventDefault();

            // Was it approved, or rejected?
            var isApproved = e.target.classList.contains('approve-button');

            // Set the comment, and the destination
            var comment =     isApproved ? `This card is ready for @somebody` : `This card has some issues, let's talk!`,
                destination = isApproved ? vars.needsQaListId : vars.returnedListId;

            // Post a comment on the card
            fetch(`${vars.trelloBaseApi}/cards/${vars.id}/actions/comments?key=${vars.key}&token=${vars.token}&text=${encodeURIComponent(comment)}`, {method: 'post'});

            // Move the card to QA
            funcs.moveCardToDestination(destination);

            // Remove the markup
            document.getElementsByClassName('approve-reject-container')[0].remove();
        },
        moveCardToDestination: (destinationId) => {
            // Takes current card ID and moves it to the list ID provided
            fetch(`${vars.trelloBaseApi}/cards/${vars.currentJson.id}/idList?key=${vars.key}&token=${vars.token}&value=${destinationId}`, {method: 'PUT'});
        },
        sendToSlack: (text) => {
            // Build the payload to Slack
            var body = {
                text:       text,
                channel:    vars.channelId,
                username:   vars.botName,
                icon_emoji: vars.iconEmoji
            }

            // Send it off
            fetch(vars.webhook, {
                method: 'post',
                body:   JSON.stringify(body)
            });

        }
    };

    var tmpls = {
        reviewReadyMarkup: () => {
            return `
                <div class="window-module u-clearfix review-container">
                    <h3>Peer Review</h3>
                    <div class="u-clearfix">
                        <a class="button-link review-ready-button" href="#">
                            <span class="icon-sm icon-checklist"></span>&nbsp;Ready
                        </a>
                    </div>
                </div>
            `;
        },
        acceptReviewMarkup: () => {
            return `
                <div class="window-module u-clearfix accept-container">
                    <h3>Peer Review</h3>
                    <div class="u-clearfix">
                        <a class="button-link accept-review-button" href="#">
                            <span class="icon-sm icon-checklist"></span>&nbsp;Assign To Me
                        </a>
                    </div>
                </div>
            `;
        },
        approveRejectMarkup: () => {
            return `
                <div class="window-module u-clearfix approve-reject-container">
                    <h3>Peer Review</h3>
                    <div class="u-clearfix">
                        <a class="button-link approve-button" href="#">
                            <span class="icon-sm icon-checklist"></span>&nbsp;Approve
                        </a>
                        <a class="button-link reject-button" href="#">
                            <span class="icon-sm icon-remove"></span>&nbsp;Reject
                        </a>
                    </div>
                </div>
            `;
        }
    };

    // Gotta wait for the window to load, so the elements are there
    window.addEventListener('load', funcs.init);