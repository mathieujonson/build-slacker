(() => {
    "use strict";

    // Our elements
    var eles = {
        container: document.getElementsByClassName('container')[0],
        webhook:    document.getElementById('js-webhook'),
        submitWebhook: document.getElementsByClassName('js-submit-webhook')[0]
    };

    // Our variables
    var vars = {};

    // Our functions
    var funcs = {
        init: () => {
            chrome.storage.sync.get('webhook', (data) => {
                if(data.webhook) {
                    // Populate the input
                    eles.webhook.value = data.webhook;

                    // Add the channel markup
                    eles.container.insertAdjacentHTML('beforeend', tmpls.channelMarkup());
                    document.getElementsByClassName('js-submit-channel')[0].addEventListener('click', funcs.setChannel);

                    // Show the set message
                    document.getElementsByClassName('webhook-span')[0].classList.add('show');

                    chrome.storage.sync.get('channel', (data) => {
                        if(data.channel) {
                            // Populate the input
                            document.getElementById('js-channel').value = data.channel;

                            // Show the set message
                            document.getElementsByClassName('channel-span')[0].classList.add('show');

                            // Set the listener
                            document.getElementById('js-channel').addEventListener('input', funcs.removeChannel);
                        }
                    });
                }
            });
            document.getElementById('js-webhook').addEventListener('input', funcs.removeWebhook);
        },
        setWebhook: () => {
            // Set the key in storage
            chrome.storage.sync.set({'webhook': eles.webhook.value});

            // Display set message
            document.getElementsByClassName('webhook-span')[0].classList.add('show');

            // Display the token markup if it doesn't already exist
            if(!document.getElementById('js-channel')) {
                eles.container.insertAdjacentHTML('beforeend', tmpls.channelMarkup(eles.webhook.value));
                document.getElementsByClassName('js-submit-channel')[0].addEventListener('click', funcs.setChannel);
                document.getElementById('js-channel').addEventListener('input', funcs.removeChannel);
            }
        },
        setChannel: () => {
            // Display set message
            document.getElementsByClassName('channel-span')[0].classList.add('show');

            // Set the token in storage
            chrome.storage.sync.set({'channel': document.getElementById('js-channel').value});
        },
        removeWebhook: () => {
            // Remove it
            chrome.storage.sync.remove('channel');

            // Also remove the token
            chrome.storage.sync.remove('webhook');

            // Hide set message
            document.getElementsByClassName('webhook-span')[0].classList.remove('show');

            // Remove the token container
            document.getElementsByClassName('channel-container')[0].remove();
        },
        removeChannel: () => {
            // Remove it
            chrome.storage.sync.remove('channel');

            // Hide set message
            document.getElementsByClassName('channel-span')[0].classList.remove('show');
        },
    };

    // Our markup
    var tmpls = {
        channelMarkup: () => {
            return `
                <div class="channel-container">
                    <label for="js-channel">Channel Id</label>
                    <span class="channel-span">Channel Set</span>
                    <input type="text" id="js-channel">
                    <div class="user-options">
                        <button class="js-submit-channel">Set It</button>
                    </div>
                </div>
            `;
        }
    };

    // Our listeners
    eles.submitWebhook.addEventListener('click', funcs.setWebhook);

    funcs.init();
})();