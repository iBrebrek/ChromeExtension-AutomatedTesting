
// reci backgroundu da omogući extenziju za ovu stranicu
chrome.runtime.sendMessage({
  from:    'content',
  subject: 'showPageAction'
});

chrome.runtime.onMessage.addListener(function (msg, sender) {
  if (msg.subject === 'fillForm') {
    fillForms();
  }
});

function fillForms() {

  function generateString(length) {
    var string = "";
    var possible = "ABCČĆDĐEFGHIJKLMNOPQRSŠTUVWXYZŽabcčćdđefghijklmnopqrsštuvwxyzž";

    for (var i = 0; i < length; i++)
      string += possible.charAt(Math.floor(Math.random() * possible.length));

    return string;
  }

  function generateDecimal(min, max, decimals) {
    return (Math.random() * (max - min) + min).toFixed(decimals);
  }

  function generateInteger(min, max) {
    return generateDecimal(min, max, 0);
  }

  function nonCustomInputFills(e) {
    var type = e.getAttribute("type");

    if (type == "text") { // tekst
      var len = e.getAttribute("maxlength");
      if (!len) len = options.formTextlen;

      e.value = generateString(len);
      allAdded.push(e.value);

    } else if (type == "number") {  // broj
      var min = e.getAttribute("min");
      if (!min) min = options.formMin;
      var max = e.getAttribute("max");
      if (!max) max = options.formMax;

      e.value = generateInteger(min, max);
      allAdded.push(e.value);
    }
  }

  var allAdded = [];

  document.querySelectorAll("form input")
    .forEach(e => {
      var customType = e.getAttribute("auto-fill-type");
      var customMax = e.getAttribute("auto-fill-max");
      var customMin = e.getAttribute("auto-fill-min");
      if (Number.isNaN(customMax)) customMax = undefined;
      else customMax = Number(customMax);
      if (Number.isNaN(customMin)) customMin = undefined;
      else customMin = Number(customMin);

      if (customType == "text") {   // custom tekst
        if (!customMax) customMax = options.formTextlen;
        if (!customMin) customMin = customMax;
        if (customMax < customMin) customMin = customMax;

        var stringLen = generateInteger(customMin, customMax);
        e.value = generateString(stringLen);
        allAdded.push(e.value);

      } else if (customType == "number") {  // custom number
        if (!customMax) customMax = options.formMax;
        if (!customMin) customMin = options.formMin;
        if (customMax < customMin) customMin = customMax;

        var customDecimals = e.getAttribute("auto-fill-decimals");

        if (!customDecimals || Number.isNaN(customDecimals)) {
          e.value = generateInteger(customMin, customMax);
        } else {
          e.value = generateDecimal(customMin, customMax, parseInt(customDecimals));
        }
        allAdded.push(e.value);

      } else if (customType == undefined) { // custom nije definiran
        nonCustomInputFills(e);
      }
    }
  );

  document.querySelectorAll("form select")
    .forEach(e => {
      // istina je da nema smisla da netko stavi disabled na svaku opciju, no da ne bi zapeli u beskonačnoj petlji...
      var isAllDisabled = true;
      e.querySelectorAll("option").forEach(option => {
        if (option.disabled !== true) isAllDisabled = false;
      });
      
      if (isAllDisabled) { 
        e.selectedIndex = 0;
      } else {
        do {
          e.selectedIndex = generateInteger(0, e.options.length - 1);
        } while (e.options[e.selectedIndex].disabled === true);
      }

      allAdded.push(e.options[e.selectedIndex].text);
    }
  );

  return allAdded;
}

chrome.runtime.onMessage.addListener(function (msg, sender) {
  if (msg.subject === 'highlight') {
    document.querySelectorAll("tr").forEach(function (element) {
      var a = element.innerText;
      var b = element.textContent;
    });
  }
});

function getAllMeta() {
  var metas = {};
  document.querySelectorAll("meta").forEach(meta => {
    for (let index = 0; index < meta.attributes.length; index++) {
      let attribute = meta.attributes[index];
      metas[attribute.name] = attribute.value;
    }
  });
  return metas;
}

// vraća popis metapodataka (key->value)
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.subject == "meta") {
      sendResponse({ meta: getAllMeta() });
    }
  }
);

var VALIDATE_TEST = "Validacija";
var CREATE_TEST = "Dodavanje novog podatka";
var EDIT_TEST = "Ažuriranje jednostavnog podatka";
var PAGING_TEST = "Straničenje i sortiranje u jednostavnom tabličnom prikazu";
var DELETE_TEST = "Brisanje podatka";
var DIALOG_BEFORE_DELETE_TEST = "Potvrda prije brisanja podatka";

/**
 * 
 * @param {string} name     ime testera (create, validate, edit..)
 * @param {*} isStarting    true ako započinje testiranje, false ako nastavlja
 */
function startTest(name, isStarting) {
  /*
  Treba paziti na ime testa koje se predaje konstruktoru testera!
  Ime testa mora biti isto imenu testa koji je lokalno pohranjen
  */

  var meta = getAllMeta();
  var group = meta.group;
  var student = meta.jmbag;

  chrome.runtime.sendMessage({ subject: "What's my id?" }, response => {

    var tester;
    var id = response.tabId;
    if (response.hasOwnProperty("group")) group = response.group;  
    if (response.hasOwnProperty("jmbag")) student = response.jmbag;  // ako je u popup ručno odabran student (nadjača metapodatke)

    switch (name) {
      case "create":
        tester = new CreateTester(CREATE_TEST, group, student, id, 
                  options.pagingClass, fillForms, getAllMeta);
        break;
      case "validate":
        tester = new ValidateTester(VALIDATE_TEST, group, student, id);
        break;
      case "edit":
       tester = new EditTester(EDIT_TEST, group, student, id, 
                  options.pagingClass, options.editClass, fillForms, getAllMeta);
       break;
      case "paging":
        tester = new PaginationTester(PAGING_TEST, group, student, id, options.pagingClass, options.pagingMax);
        break;
      case "delete":
        tester = new DeleteTester(DELETE_TEST, group, student, id, 
                    options.deleteClass, DIALOG_BEFORE_DELETE_TEST);
        break;
      case "composite":
        tester = new CompositeTester(VALIDATE_TEST, CREATE_TEST, EDIT_TEST, DELETE_TEST, PAGING_TEST, 
                    DIALOG_BEFORE_DELETE_TEST, group, student, id, options.editClass, options.deleteClass, 
                    options.pagingClass, fillForms, getAllMeta, options.pagingMax);
        break;
  
      default:
        console.log("ERROR: krivo ime testera");
        return;
      }

      test(isStarting, tester);
  });
}

/**
 * Započinje/nastavlja testiranje.
 * 
 * @param {*} isStarting    true ako započinje testiranje, false ako nastavlja
 * @param {*} tester        tester koji obavlja testiranje
 */
function test(isStarting, tester) {

  var port = chrome.runtime.connect({ name: "testing" });
  port.postMessage({ isStarting: isStarting, testName: tester.name, tabId: tester.id });

  port.onMessage.addListener(function (msg) {

    tester.executeStep(msg.stepIndex, result => {
      if (result === tester.WAIT_PAGE_CHANGE) {
        setTimeout(() => {
          port.postMessage({ isOver: result === tester.STOP, testName: tester.name, tabId: tester.id });
        }, 2000); // čeka 2 sec 
      } else {
        port.postMessage({ isOver: result === tester.STOP, testName: tester.name, tabId: tester.id });
      }
    });
  });
}

// popup započinje testiranje
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {

    switch (request.subject) {
      case "testCreate":
        startTest("create", true);
        break;
      case "testValidate":
        startTest("validate", true);
        break;
      case "testEdit":
        startTest("edit", true);
        break;
      case "testPaging":
        startTest("paging", true);
        break;
      case "testDelete":
        startTest("delete", true);
        break;
      case "testAll":
        startTest("composite", true);
        break;

      default:
        return;
    }
  }
);

/** defaultne vrijednosti zadane u opcijama */
var options;

chrome.storage.sync.get("options", items => {
  options = items.options;

  // u slučaju ako proces testiranja nije gotov (nastavlja na novoj strani)
  // stavljeno u callback sync.get jer je dohvat opcija asinkron pa da se opcije ne bi učitale prekasno
  startTest("create", false);
  startTest("validate", false);
  startTest("edit", false);
  startTest("paging", false);
  startTest("delete", false);
  startTest("composite", false);
});
