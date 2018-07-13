var DEFAULT_DELIMITER = "\t";

/**
 *  
 * @param {*} text              tekst koji se parsira
 * @param {*} getFromStorage    koje parametre treba učitati iz storage.local
 * @param {*} wordsConsumer     funkcija koja se poziva za svaku liniju, 
 *                              funkciji se predaje niz riječi i parameti dohvačene iz storage.sync
 * @param {*} endFunction       funkcija koja se pozove kada su sve linije obrađene, nema argumente
 */
function parseText(text, getFromStorage, wordsConsumer, endFunction) {

    chrome.storage.local.get(getFromStorage, items => {

        text.split("\n").forEach(line => {
            if (!line.trim()) return;
            var words = line.split(DEFAULT_DELIMITER);
            wordsConsumer(words.map(s => s.trim()), items);
        });

        endFunction();
    });
}

function parseStudents(text) {

    var students = {};

    parseText(text, { tests: {} }, (words, items) => {
        var newStudent = {};
        newStudent.jmbag = words[0];
        newStudent.lastName = words[1];
        newStudent.name = words[2];
        newStudent.group = words[3];
        newStudent.tests = items.tests;

        if(students[newStudent.group] == null) 
            students[newStudent.group] = {};

        students[newStudent.group][newStudent.jmbag] = newStudent;
    },
        () => chrome.storage.local.set({ "students": students })
    );
}

function parseTests(text) {

    var tests = {};

    parseText(text, {}, words => {
        var newTest = {};

        if (words[0]) {
            newTest.isIndividual = false;
            newTest.name = words[0];
        } else if (words[1]) {
            newTest.isIndividual = true;
            newTest.name = words[1];
        }

        newTest.maxPoints = words[2].replace(',', '.');
        newTest.criterion = words[3];

         // za lakše dodavanje studentu
        newTest.points = "";

        tests[newTest.name] = newTest;
    },
        () => {
            chrome.storage.local.set({ "tests": tests });
            // u slučaju ako su studenti bili dodani prije testova
            chrome.storage.local.get("students", items => {
                if (!items.hasOwnProperty("students")) return;
                for (var group in items.students) {
                    for (var student in items.students[group]) {
                        items.students[group][student].tests = tests;
                    }
                }
                chrome.storage.local.set(items);
            }) 
        }
    );
}