
/**
 * Ako testovi i studenti već nisu zadani čita ih iz zadanih datoteka.
 * Ako vrijednosti već postoje ne radi ništa.
 * 
 * @param {*} testsFile     putanja do popisa testova
 * @param {*} studentsFile  putanja do popisa studenta
 */
function readDefaultValues(testsFile, studentsFile) {

    function errorHandler(e) {
        var msg = '';
      
        switch (e.code) {
          case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
          case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
          case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
          default:
            msg = 'Unknown Error';
            break;
        };
      
        console.log('Error: ' + msg);
      }

    function readFile(fileName, callbackFunction) {
        chrome.runtime.getPackageDirectoryEntry(function(root) {
            root.getFile(fileName, {}, function(fileEntry) {
              fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                  callbackFunction(this.result);
                };
                reader.readAsText(file);
              }, errorHandler);
            }, errorHandler);
          });
    }
    
    chrome.storage.sync.get("tests", items => {
      if (items.tests == null) readFile(testsFile, parseTests);
    })

    setTimeout(function () { // jer se inače paralelno izvedu, a studenti ovise o testovima
      chrome.storage.local.get("students", items => {
        if (items.students == null) readFile(studentsFile, parseStudents);
      })
    }, 3000);
}

/**
 * Ako opcije nisu definirane postavlja ih na defaultne vrijednosti.
 */
function setDefaultOptions() {
  chrome.storage.sync.get("options", items => {
    if (!items.options) items.options = {};
    if (!items.options.pagingClass) items.options.pagingClass = "page-link";
    if (!items.options.editClass) items.options.editClass = "btn btn-sm";
    if (!items.options.deleteClass) items.options.deleteClass = "btn btn-sm btn-danger delete";
    if (!items.options.pagingMax) items.options.pagingMax = 3;
    if (!items.options.formTextlen) items.options.formTextlen = 15;
    if (!items.options.formMax) items.options.formMax = 1000;
    if (!items.options.formMin) items.options.formMin = -1000;
    chrome.storage.sync.set(items);
  });
}

chrome.runtime.onInstalled.addListener(function () {
  readDefaultValues("init/tests.txt", "init/students.txt");
  setDefaultOptions();
});
