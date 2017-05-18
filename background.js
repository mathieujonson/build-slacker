var href = '';

// This calls like crazy, even if the URL doesn't change...checking for actual URL change before sending a message
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
        // getSelected actually got deprecated in Chrome 33...still works though...need to use the tabs.query when refactoring
        chrome.tabs.getSelected(null, function (tab) {
            // Url actually changed?!?  Update it and send a message
            if(tab.url != href) {
                href = tab.url;
                chrome.tabs.sendMessage(tab.id, {hasHistoryUpdated: true});
            }
        });
});