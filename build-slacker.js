(() => {
    "use strict";

    var eles = {}

    var vars = {
        slackBaseUrl: 'https://hooks.slack.com/services/',
        iconEmoji:    ':build_slacker:',
        botName:      'Build Slacker',
        channel:      null,
        webhook:      null,
    }

    var funcs = {
        init: () => {
            // Grab the Slack WebHook from storage
            chrome.storage.sync.get('webhook', (data) => {
                vars.webhook = data.webhook;
            });

            // Grab the Channel ID from storage
            chrome.storage.sync.get('channel', (data) => {
                vars.channel = `#${data.channel}`;
            })

            // Listen for changes to storage
            chrome.storage.onChanged.addListener(function(changes, namespace) {
                for (var key in changes) {
                    var storageChange = changes[key]
                    vars[key] = storageChange.newValue
                }
            });

            document.addEventListener('click', (e) => {
                if(e.target.id === 'runCustomBuildButton') {
                    funcs.sendToSlack('running a build: ' + document.getElementById('parameter_website_name').value)
                }
            })
        },
        sendToSlack: (text) => {
            // Build the payload to Slack
            var body = {
                text:       text,
                channel:    vars.channel,
                username:   vars.botName,
                icon_emoji: vars.iconEmoji
            }

            // Send it off
            fetch(`${vars.slackBaseUrl}${vars.webhook}`, {
                method: 'post',
                body:   JSON.stringify(body)
            })
        }
    }

    var tmpls = {
        templateStub: () => {
            return `
                <div>
                    Stub for demonstration purposes
                </div>
            `
        }
    }

    // Gotta wait for the window to load, so the elements are there
    window.addEventListener('load', funcs.init)

})()