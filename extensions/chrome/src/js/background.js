chrome.browserAction.onClicked.addListener(function (activeTab) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "point"}, function (response) {
    });
  });
});
