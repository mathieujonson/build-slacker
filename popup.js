(() => {
    "use strict";

    // Our elements
    var eles = {
        container: document.getElementsByClassName('container')[0],
        apiKey:    document.getElementById('js-api-key'),
        submitApi: document.getElementsByClassName('js-submit-api')[0]
    };

    // Our variables
    var vars = {
        key:   null,
        token: null
    };

    // Our functions
    var funcs = {
        init: () => {
            chrome.storage.sync.get('apiKey', (data) => {
                if(data.apiKey) {
                    // Populate the input
                    eles.apiKey.value = data.apiKey;

                    // Add the token markup
                    eles.container.insertAdjacentHTML('beforeend', tmpls.tokenMarkup(eles.apiKey.value));
                    document.getElementsByClassName('js-submit-token')[0].addEventListener('click', funcs.setApiToken);

                    // Show the set message
                    document.getElementsByClassName('key-span')[0].classList.add('show');

                    chrome.storage.sync.get('apiToken', (data) => {
                        if(data.apiToken) {
                            // Populate the input
                            document.getElementById('js-api-token').value = data.apiToken;

                            // Show the set message
                            document.getElementsByClassName('token-span')[0].classList.add('show');
                        }
                    });
                }
            });
            document.getElementById('js-api-key').addEventListener('input', funcs.removeKey);
        },
        setApiKey: () => {
            // Set the key in storage
            chrome.storage.sync.set({'apiKey': eles.apiKey.value});

            // Display set message
            document.getElementsByClassName('key-span')[0].classList.add('show');

            // Display the token markup if it doesn't already exist
            if(!document.getElementById('js-api-token')) {
                eles.container.insertAdjacentHTML('beforeend', tmpls.tokenMarkup(eles.apiKey.value));
                document.getElementsByClassName('js-submit-token')[0].addEventListener('click', funcs.setApiToken);
                document.getElementById('js-api-token').addEventListener('input', funcs.removeToken);
            }
        },
        setApiToken: () => {
            // Display set message
            document.getElementsByClassName('token-span')[0].classList.add('show');


            // Set the token in storage
            chrome.storage.sync.set({'apiToken': document.getElementById('js-api-token').value});
        },
        removeKey: () => {
            // Remove it
            chrome.storage.sync.remove('apiKey');

            // Also remove the token
            chrome.storage.sync.remove('apiToken');

            // Hide set message
            document.getElementsByClassName('key-span')[0].classList.remove('show');

            // Remove the token container
            document.getElementsByClassName('token-container')[0].remove();
        },
        removeToken: () => {
            // Remove it
            chrome.storage.sync.remove('apiToken');

            // Hide set message
            document.getElementsByClassName('token-span')[0].classList.remove('show');
        },
    };

    // Our markup
    var tmpls = {
        tokenMarkup: (apiKey) => {
            return `
                <div class="token-container">
                    <label for="js-api-token">API Token</label>
                    <span class="token-span">Token Set</span>
                    <input type="text" id="js-api-token">
                    <div class="user-options">
                        <a href="https://trello.com/1/authorize?key=${apiKey}&scope=read%2Cwrite&name=trelloHelper&expiration=never&response_type=token" class="js-token-help" target="blank">Find it here</a>
                        <button class="js-submit-token">Set It</button>
                    </div>
                </div>
            `;
        }
    };

    // Our listeners
    eles.submitApi.addEventListener('click', funcs.setApiKey);

    funcs.init();
})();