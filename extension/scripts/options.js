
/**
 * Definira klik na tab koji mijenja prikazani tab.
 * 
 * @param {*} event   kliknuti element
 */
function changeTab(event) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  var clickedTab = event.currentTarget;
  document.getElementById(clickedTab.attributes.tab.value).style.display = "block";
  clickedTab.className += " active";
}

function importExportOptions() {
    document.getElementById("importTests").addEventListener("click", () => loadFile(parseTests));
    document.getElementById("importStudents").addEventListener("click", () => loadFile(parseStudents));

    document.getElementById("exportJSON").addEventListener("click", () =>
        chrome.storage.local.get(null, results =>
            download("rezultatiJSON.txt", JSON.stringify(results), "plain"))
    );

    function loadNewItems(newItems) {
        /**
         * Iz from kopira vrijednosti u to.
         * Ako se neka vrijednost već nalazi u to onda se ne kopira.
         * Kopiraju se samo property koju su zajednički.
         */
        function recursiveCopy(from, to) {
            var keys = Object.keys(from);
            for (let i in keys) {
                let key = keys[i];
                if(to[key] == undefined) continue;
                if (typeof(from[key]) == "object") {
                    recursiveCopy(from[key], to[key]);
                } else if (!to[key]) {
                    to[key] = from[key];
                }
            }
        }
        chrome.storage.local.get(null, oldItems => {
            recursiveCopy(oldItems, newItems);
            chrome.storage.local.set(newItems);
        });
    }

    document.getElementById("importJSON").addEventListener("click", () =>
        loadFile(text => loadNewItems(JSON.parse(text)))
    );

    // ako se stavi samo createReport, budući da je createReport u drugoj skripti, on misli da je createReport nepostavljena varijabla... zato je lambda
    document.getElementById("report").addEventListener("click", () => createReport());
}

function generalOptions() {
    chrome.storage.sync.get("options", items => {
        document.getElementById("paging-class").value = items.options.pagingClass;
        document.getElementById("edit-class").value = items.options.editClass;
        document.getElementById("delete-class").value = items.options.deleteClass;
        document.getElementById("paging-max").value = items.options.pagingMax;;
        
        document.getElementById("form-textlen").value = items.options.formTextlen;
        document.getElementById("form-max").value = items.options.formMax;
        document.getElementById("form-min").value = items.options.formMin;

        document.getElementById("save-testers").addEventListener("click", () => {
            var maxPages = document.getElementById("paging-max").value;
            if (!isInteger(maxPages)) {
                alert("Broj stranica mora biti cijeli broj.");
                return;
            }
            var cPage = document.getElementById("paging-class").value;
            var cEdit = document.getElementById("edit-class").value;
            var cDelete = document.getElementById("delete-class").value;
            if (cPage == null || cPage == ""
                || cEdit == null || cEdit == ""
                || cDelete == null || cDelete == "") {

                alert("Imena klasa moraju biti definirana");
                return;
            }
            items.options.pagingClass = cPage;
            items.options.editClass = cEdit;
            items.options.deleteClass = cDelete;
            items.options.pagingMax = parseInt(maxPages);
            chrome.storage.sync.set(items);
        });

        document.getElementById("save-forms").addEventListener("click", () => {
            var tLen = document.getElementById("form-textlen").value;
            if (!isInteger(tLen) || tLen < 1) {
                alert("Duljina teksta mora biti pozitivan cijeli broj");
                return;
            }
            numMin = document.getElementById("form-min").value;
            numMax = document.getElementById("form-max").value;
            if (!isInteger(numMin) || !isInteger(numMax) || parseInt(numMin) > parseInt(numMax)) {
                alert("Min i max su cijeli brojevi pri ćemu min ne može biti veći od max");
                return;
            }
            items.options.formTextlen = parseInt(tLen);
            items.options.formMax = parseInt(numMax);
            items.options.formMin = parseInt(numMin);
            chrome.storage.sync.set(items);
        });
    });
}

function isInteger(x) {
    if (Number.isNaN(x)) return false;
    if (x.toString().includes('.')) return false;
    if (x.toString().includes(',')) return false;
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".tablinks").forEach((element) => element.addEventListener("click", changeTab));
    document.querySelector(".tablinks").click(); // početni tab (bit će prvi jer querySelector vraća prvi s tom klasom)

    importExportOptions();
    generalOptions();
});
