request = new XMLHttpRequest
request.open('GET', '../options/options.json', true)
request.send()

request.onload = function() {
  data = JSON.parse(this.response)
  for (var key in data) {
    data[key] = data[key].val
    if(localStorage[key]) { data[key] = localStorage[key] }
  }

  chrome.extension.onMessage.addListener(
    function(request, sender, sendMessage) {
      if(request.url) {
        chrome.tabs.query(
          {windowId: sender.tab.windowId},
          function(tabs) {
            var position = sender.tab.index;
            for(var i = position; i < tabs.length; i++) {
              if(tabs[i].openerTabId == sender.tab.id) {
                position = i
              }
            }
            request.openerTabId = sender.tab.id
            request.index = position + 1
            chrome.tabs.create(request, function(tab) { listenAndCloseTab(tab, request.url, sender.tab.id) })
          }
        )
      } else {
        sendMessage(data)
      }
    }
  )
}

function listenAndCloseTab (tab, url, originalTabId) {
  var listener = setInterval(function () {
    chrome.tabs.get(tab.id, function (tab) {
      if (tab.status === 'complete') {
        chrome.tabs.remove(tab.id)
        clearInterval(listener)
        // Unsubscription finished
        chrome.tabs.sendMessage(originalTabId, {muteURL: url})
      }
    })
  }, 500)
}
