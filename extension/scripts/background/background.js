// omogući extenziju za dani tab
chrome.runtime.onMessage.addListener(function (msg, sender) {
  if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
    chrome.pageAction.show(sender.tab.id);
  }
});


/** 
 * Za tab pamti studenta (jmbag) i grupu. 
 * key:[tabID]  values: .group .jmbag 
 */
var newMetas = [];    // jer je moguće ručno promijeniti studenta pa to "nadjača" metapodatke 

/**
 *  - contentu odgovora koji je njegov tab id i koji student/grupa se ocjenjuje 
 *  - popup obavještava kojeg studenta/grupu se ocjenjuje
 */
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.subject == "What's my id?") {
      var id = sender.tab.id;
      var data = { tabId : id};
      if (newMetas[id]) {
        data.group = newMetas[id].group;
        data.jmbag = newMetas[id].jmbag;
      } 
      sendResponse(data);
    }
      
    if (request.subject == "newMeta") {
      if (!newMetas[request.tabId]) newMetas[request.tabId] = {};
      newMetas[request.tabId].group = request.group;
      newMetas[request.tabId].jmbag = request.jmbag;
    }
  }
);