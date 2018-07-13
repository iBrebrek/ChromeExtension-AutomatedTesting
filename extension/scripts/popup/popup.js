

document.addEventListener("DOMContentLoaded", () => {

  chrome.storage.local.get("students", items => {
    initGUI(items.students);
    askForMeta(items.students);
  });

  enableDropMenu();
  document.querySelector("#forms").addEventListener("click", () => sendToContent("fillForm"));
  document.querySelector("#create").addEventListener("click", () => sendToContent("testCreate"));
  document.querySelector("#validate").addEventListener("click", () => sendToContent("testValidate"));
  document.querySelector("#edit").addEventListener("click", () => sendToContent("testEdit"));
  document.querySelector("#paging").addEventListener("click", () => sendToContent("testPaging"));
  document.querySelector("#delete").addEventListener("click", () => sendToContent("testDelete"));
  document.querySelector("#all").addEventListener("click", () => sendToContent("testAll"));

  document.querySelector("#stop").addEventListener("click", () => 
    chrome.runtime.sendMessage({subject : "STOP TESTING"})
  );

  document.querySelector("#log").addEventListener("click", () =>
    chrome.tabs.create({ url: chrome.extension.getURL("log.html") })
  );
});

/**
 * 
 * @param {*} groups    popis svih grupa (objekti)
 */
function initGUI(groups) {
  createDropdownGroups(Object.keys(groups));  // bitno da je ovo prije create table jer postavi trenutnu grupu
  createTable(groups[currentGroup]);

  // da header uvijek bude na vrhu tablice
  document.getElementById("tableContainer").addEventListener("scroll", function () {
    var translate = "translate(0," + this.scrollTop + "px)";
    this.querySelector("thead").style.transform = translate;
  });

  // da se svaki prikazani podatak ažurira ako je došlo do promjene
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName != "local") return;
    if (!changes.students) return;

    if (changes.students.newValue != changes.students.oldValue) {
      createTable(changes.students.newValue[currentGroup]);
    }
  });
}

/** objekt */
var currentStudent;
/** string */
var currentGroup;

/**
 * Obavještava background kojeg studenta/grupu se testira na trenutnom tabu.
 */
function sendMetaToBackground() {
  chrome.tabs.query({ // query se radi samo da bi se saznao id taba
    active: true,
    currentWindow: true
  }, function (tabs) {
    var data = { subject: "newMeta" };
    data.tabId = tabs[0].id;
    data.group = currentGroup;
    if (currentStudent) data.jmbag = currentStudent.jmbag;
    else data.jmbag = "";
    chrome.runtime.sendMessage(data);
  });
}

/**
 * Provjerava ima li content definirane metapodatke te postavlja trenutnu grupu i studenta ako metapodatci postoje.
 * 
 * @param {*} groups    popis svih grupa (objekti)
 */
function askForMeta(groups) {
  /*
    funkcije initGroup i initStudent su definirane unutar ove funkcije jer se obje funkcije 
    koriste samo kao početne vrijednosti ako su u contentu definirani metapodatci.
  */

  /**
 * Postavlja currentGroup.
 * Dropdown s popisom grupa postavlja na zadanu grupu.
 * 
 * @param {string} group    ime grupe koju treba postaviti
 */
  function initGroup(group) {
    var groupsDropdown = document.getElementById("groups");
    for (let i = 0; i < groupsDropdown.length; i++) {
      if (groupsDropdown.options[i].value == group) {
        groupsDropdown.value = group;
        groupsDropdown.dispatchEvent(new Event("change"));
        currentGroup = group;
        break;
      }
    }
  }

  /**
   * Postavlja currentStudent.
   * Označuje trenutno odabranog studenta (css klasa selected).
   * 
   * @param {*} group    ime grupe u kojoj je student
   * @param {*} jmbag    jmbag studenta
   * @param {*} groups   popis svih grupa (objekti)
   */
  function initStudent(group, jmbag, groups) {
    currentStudent = groups[group][jmbag];
    document.querySelectorAll("thead .selected").forEach(e => e.className = "unselected");
    var toSelect = document.querySelector("thead [student='" + currentStudent.jmbag + "']");
    if (toSelect) toSelect.className = "selected";
    sendMetaToBackground(); // da se vrati na prave metapodatke
  }

  /**
   * Od contenta traži metapodatke.
   */
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { subject: "meta" }, function (response) {
      if (response.meta.group) {
        initGroup(response.meta.group);

        if (response.meta.jmbag) {
          initStudent(response.meta.group, response.meta.jmbag, groups);
        }
      }
    });
  });
}

/**
 * Omogućuje otvaranje/zatvaranje opcija u kojima se nalazi popis testova.
 */
function enableDropMenu() {
  document.getElementById("dropMenubtn").addEventListener("click", () =>
    document.getElementById("dropdownCommands").classList.toggle("show"));

  // zatvara dropdown menu ako se klikne izvan toga
  window.addEventListener("click", function (event) {
    if (!event.target.matches('.dropMenubtn')) {

      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  });
}

/**
 * Stvara dropdown s grupama.
 * 
 * @param {*} groups  lista imena svih grupa
 */
function createDropdownGroups(groups) {
  var groupDropdown = document.getElementById("groups");
  var options = "";
  for (var index in groups) {
    var group = groups[index];
    options += "<option value='" + group + "'>" + group + "</option>";
  }
  groupDropdown.innerHTML = options;

  groupDropdown.addEventListener("change", function() {
    if (this.value != currentGroup) {
      currentGroup = this.value;
      currentStudent = undefined;
      sendMetaToBackground();
      chrome.storage.local.get("students", items => createTable(items.students[currentGroup]));
    }
  });
  currentGroup = groupDropdown.value;
}

/**
 * Stvara tablicu s popisom testova, studenta i bodova unutar jedne grupe.
 * Tablica ima header koji je uvijek pri vrhu. 
 * U headeru se klikom na ime studenta označi kojeg studenta se testira.
 * 
 * @param {*} students    popis svih studenta u grupi (objekti)
 */
function createTable(students) {
  
  var listOfStudents = [];
  for (var i in students) listOfStudents.push(students[i]);
  var comparator = new Intl.Collator("hr");
  listOfStudents.sort((s1, s2) => {
    var diff = comparator.compare(s1.lastName, s2.lastName);
    if (diff === 0) {
      return comparator.compare(s1.name, s2.name);
    } else {
      return diff;
    }
  });

  var tests = listOfStudents[0].tests;

  var header = document.querySelector("#tableContainer thead");
  header.innerHTML = "";
  var headerRow = header.insertRow();
  headerRow.insertCell().innerHTML = "test";
  headerRow.insertCell().innerHTML = "max";
  
  var team = headerRow.insertCell();
  team.setAttribute("student", "team");
  addClickOnStudent(team);
  if (!currentStudent) team.className = "selected";
  else team.className = "unselected";
  team.innerHTML = "ekipa";

  for (var i in listOfStudents) {
    var student = listOfStudents[i];
    var cell = headerRow.insertCell();
    if (currentStudent && currentStudent.jmbag == student.jmbag) cell.className = "selected";
    else cell.className = "unselected";
    cell.setAttribute("student", student.jmbag);
    cell.innerHTML = student.name + " " + student.lastName;
    addClickOnStudent(cell);
  }
  
  headerRow.insertCell().innerHTML = "kriterij";

  var tbody = document.querySelector("#tableContainer tbody");
  tbody.innerHTML = "";

  for (var testName in tests) {
    var test = tests[testName];
    var row = tbody.insertRow();
    row.insertCell().innerHTML = test.name;
    row.insertCell().innerHTML = test.maxPoints;

    if (test.isIndividual) {
      row.insertCell(); // dodajemo prazan jer je taj red za ekipne bodove
      addIndividualPoints(row, listOfStudents, test);
    } else {
      addTeamPoints(row, test);
      for (var x in listOfStudents) row.insertCell(); // preskačemo polja kolko studenta
    }

    row.insertCell().innerHTML = test.criterion;
  }
}

/**
 * Na zadani HTML element dodaje odabir trenutnog studenta pomoću klika.
 * 
 * @param {*} element 
 */
function addClickOnStudent(element) {
  element.addEventListener("click", e => {
    chrome.storage.local.get("students", items => {
      if (!items.students[currentGroup]) return;
      var jmbag = e.srcElement.getAttribute("student");
      if (jmbag == "team") {
        currentStudent = undefined;
      } else {
        currentStudent = items.students[currentGroup][jmbag];
      }
      document.querySelectorAll("thead .selected").forEach(e => e.className = "unselected");
      document.querySelector("thead [student='" + jmbag + "']").className = "selected";
      sendMetaToBackground();
    });    
  });
}

/**
 * U dani redak dodaje input za bodove testa - svi u grupi imaju isti broj bodova.
 * 
 * @param {*} row 
 * @param {*} test 
 */
function addTeamPoints(row, test) {
  var currentPoints = document.createElement("input");
  currentPoints.setAttribute("type", "number");
  currentPoints.setAttribute("min", 0);
  currentPoints.setAttribute("max", test.maxPoints);
  currentPoints.setAttribute("step", 0.5);
  currentPoints.setAttribute("group", currentGroup);
  currentPoints.setAttribute("test", test.name);
  currentPoints.className = "teamPoints";

  currentPoints.value = test.points;

  currentPoints.addEventListener("change", function () {
    var g = this.getAttribute("group");
    var t = this.getAttribute("test");

    var newValue = this.value;

    chrome.storage.local.get("students", function (items) {
      var group = items.students[g];
      for (var studentID in group) {
        group[studentID].tests[t].points = newValue;
      }
      chrome.storage.local.set(items);
    });
  });

  row.insertCell().appendChild(currentPoints);
}

/**
 * U dani redak dodaje input (za svakog studenta po 1) za bodove testa - bodovi su na razini studenta.
 * 
 * @param {*} row 
 * @param {*} students  lista svih studenta u grupi
 * @param {*} test 
 */
function addIndividualPoints(row, students, test) {
  for (var i in students) {
    var student = students[i];
    
    var currentPoints = document.createElement("input");
    currentPoints.setAttribute("type", "number");
    currentPoints.setAttribute("min", 0);
    currentPoints.setAttribute("max", test.maxPoints);
    currentPoints.setAttribute("step", 0.5);
    currentPoints.setAttribute("student", student.jmbag);
    currentPoints.setAttribute("group", student.group);
    currentPoints.setAttribute("test", test.name);
    currentPoints.className = "individualPoints";

    currentPoints.value = student.tests[test.name].points;

    currentPoints.addEventListener("change", function () {
        var g = this.getAttribute("group");
        var s = this.getAttribute("student");
        var t = this.getAttribute("test");

        var newValue = this.value;

        chrome.storage.local.get("students", function(items) {
            var updatedTest = items.students[g][s].tests[t];
            updatedTest.points = newValue;
            chrome.storage.local.set(items);
        });
    });

    row.insertCell().appendChild(currentPoints);
  }
}

/**
 * Contentu šalje poruku s danom temom.
 * 
 * @param {string} subject    naredba poslana content skripti.
 */
function sendToContent(subject) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {subject: subject}
    );
  });
}

