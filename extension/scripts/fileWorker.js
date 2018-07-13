/**
 * Korisniku otvara prozor za odabir dokumenta.
 * Sve pročitano iz odabranom dokumenta šalje u call back funkciju.
 * 
 * @param {*} callbackFunction      funkcija koja prima text dokumenta
 */
function loadFile(callbackFunction) {
    var element = document.createElement('input');
    element.setAttribute("type", "file");

    element.onchange = function() {
        var fileToLoad = element.files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadedEvent) {
            var textFromFile = fileLoadedEvent.target.result;
            callbackFunction(textFromFile);
        };
        fileReader.readAsText(fileToLoad, "UTF-8");
    }

    element.click();
}

function download(filename, text, format) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/' + format + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.click();
}

function createReport() {
    chrome.storage.local.get("students", function(results) {
        var unfinishedStudents = "";
        
        for (var group in results.students) {
            for (var student in results.students[group]) {
                var tests = results.students[group][student].tests;
                for (var test in tests) {
                    if (tests[test].time == "" || test[test].time == null) {
                        unfinishedStudents += student + " (" + group + ")\n";
                        break;
                    }
                }
            }
        }

        if (unfinishedStudents == "") {
            download('rezultati.csv', formatResults(results), "csv");
        } else {
            if (confirm('Postoje studenti kojima nije sve ispravljeno:\n' + unfinishedStudents)) {
                download('rezultati.csv', formatResults(results), "csv");
            } 
        }
    })
}

function formatResults(results) {
    //var text = "\uFEFF"; // dodajemo UTF-8 BOM za excel
    //text += "sep=\t \n"; // govori excelu da su stupci odvojeni tabom
    // excel prebriše UTF-8 BOM kada se doda separator, izgleda da se može definirati samo BOM ili samo sep
    var text = "\ufeff"; // UTF16-LE BOM kojemu je defaulti separator ;

    var sep = ";";

    text += "test"+sep+"kriterij"+sep+"max.bod.";

    var allStudents = [];

    for (var group in results.students) {
        for (var student in results.students[group]) {
            var s = results.students[group][student];
            allStudents.push(s);
        }
    }

    var comparator = new Intl.Collator("hr");
    allStudents.sort((s1, s2) => {
        var diff = comparator.compare(s1.lastName, s2.lastName);
        if (diff === 0) {
            return comparator.compare(s1.name, s2.name);
        } else {
            return diff;
        }
    });

    for (var index in allStudents) {
        text += sep + allStudents[index].name + " " + allStudents[index].lastName;
    } 

    text += "\r\n";
    
    var tests = allStudents[0].tests; // svejedno - svi imaju iste testove

    for (var testName in tests) {
        var t = tests[testName];
        text += t.name + sep + t.criterion + sep + t.maxPoints.toString().replace('.', ',');  // točka u zarez jer excel zbog točke odma pretvori broj u datum
        for (var i = 0; i < allStudents.length; i++) {
            text += sep + allStudents[i].tests[testName].points.toString().replace('.', ',');
        }
        text += "\r\n";
    }
    
    return text;
}




