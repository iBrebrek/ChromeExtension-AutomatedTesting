
/*

  Za razlika od testera (koji se obavljaju na contentu),
  ova skripta se obavlja u backgroundu.

  Skripta pamti ime i zadnji korak testa.

  Ovo je potrebno jer se tokom testiranja može promijeniti stranica pa se u pozadini (ovdje) pamti stanje nakon svakog koraka.

  Omogućuje paralelno testiranje.
  Paralelno == 1 tab 1 test
*/

/** lista TesterHelper-a */
var allHelpers = [];

/**
 * Kada content stvori vezu ovdje se provjeri u kojem je koraku test.
 */
chrome.runtime.onConnect.addListener(function (port) {

  if (port.name != "testing") {
    port.disconnect();
  }

  port.onMessage.addListener(function (msg) {

    var helper = null;

    if (msg.isStarting) {
      helper = new TesterHelper(msg.tabId, msg.testName);
      allHelpers.push(helper);
    } else {
      allHelpers.forEach(h => {
        if (h.tabId == msg.tabId && h.testName == msg.testName) {  // već postoji -> nastavlja se
          helper = h;
        }
      });
    }

    if (helper == null) {
      port.disconnect();
      return;  // ovo je slučaj kada content samo provjerava mora li nastaviti
    }

    helper.processMsg(msg, port);
  });
});

class TesterHelper {

  constructor(tabId, testName) {
    this.tabId = tabId;
    this.testName = testName;

    this.nextIndex = -1;
  }

  processMsg(msg, port) {
    if (msg.isOver) {
      allHelpers.splice(allHelpers.indexOf(this), 1);
      port.disconnect();
    } else {
      this.nextIndex++;
      port.postMessage({ stepIndex: this.nextIndex });
    }
  }
}

// ako se želi zaustaviti svo testiranje
chrome.runtime.onMessage.addListener(
  function (request, sender) {
    if (request.subject == "STOP TESTING") {
      allHelpers = [];
    }
  }
);