

class Utils {

    /**
     * Tester sprema podatak kako bi ga drugi tester mogao pročitati.
     * 
     * @param {*} id            id taba
     * @param {*} dataToSave    objekt/vrijednost koja se želi pohraniti
     */
    static saveForOthers(id, dataToSave) {
        var spacename = id+"saved";
        var data = {};
        data[spacename] = dataToSave;
        chrome.storage.local.set(data);
    }

    /**
     * Dohvaća podatak koji je spremio drugi tester pod istim id-em.
     *  
     * @param {*} id        id taba
     * @param {*} callBack  funkcija kojoj će biti predan spremljen objekt
     */
    static retrieveFromOthers(id, callBack) {
        var spacename = id+"saved";
        chrome.storage.local.get(spacename, items => callBack(items[spacename]));
    }

    /**
     * Traži redak u tablici.
     * 
     * @param {*} rowToFind         redak koji se traži (lista elemenata, raspored nije bitan)
     *                              npr. ako je redak: "Ime Prezime DOB" rowToFind mora biti lista točno te 3 riječi nebitnog rasporeda: [Ime, Prezime, DOB]
     *                              za taj primjer, ako se baš želi točan raspored, može se predati ["Ime Prezime DOB"] - samo 1 element u tablici
     * @param {*} actionOnFind      funkcija koja će biti pozvana ako je redak nađen, funkciji će biti predan taj redak (tr tag)
     * @param {*} actionOnNotFind   OPCIONALNO, funkcija koja će biti pozvana ako redak nije nađen, funkcija nema argumente
     * @param {*} actionOnNoTable   OPCIONALNO, funkcija koja će biti pozvana ako na stranici nema tablice, funkcija nema argumente
     */
    static findRowInTable(rowToFind, actionOnFind, actionOnNotFind, actionOnNoTable) {
        var table = document.querySelector("table");
        if (table) {
            var rows = table.querySelectorAll("tr");
            for (var index = 0; index < rows.length; index++) {
                var isFound = true;
                rowToFind.forEach(item => {
                    if (!rows[index].textContent.includes(item))
                        isFound = false;
                });
                if (isFound) {
                    actionOnFind(rows[index]);
                    return;
                }
            }
            if (actionOnNotFind) actionOnNotFind();
        } else {
            if (actionOnNoTable) actionOnNoTable();
        }
    }

    /**
     * Simulira klik unutar confirm popup-a.
     * 
     * @param {*} isConfirmed           true ako treba kliknuti pozitivan odgovor, false ako cancel
     * @param {*} actionInvokingDialog  akcija nakon koje se očekuje da će biti dijalog
     * @param {*} actionOnInvoke        OPCIONALNO, funkcija koja će biti pozvana ako se dijalog dosita pojavio
     * @param {*} actionOnNotInvoked    OPCIONALNO, funkcija koja će biti pozvana ako nije bilo dijaloga nakon poziva actionInvokingDialog
     */
    static expectDialog(isConfirmed, actionInvokingDialog, actionOnInvoke, actionOnNotInvoked) {

        /*
            window.confirm = function(str) {
            
                wasInvoked = true;
                return isConfirmed;
            }

         gornji kod NE promijeni confirm jer imaju različit execution environment
         zato je potrebno napravi script injection
         
         za pohranu vrarijable unutar ubačene skripte koristi se HTML5 storage
        */

        var s = document.createElement('script');
        if (isConfirmed) s.innerHTML = "confirm = function(){sessionStorage.wasInvoked = true; return true;}";
        else s.innerHTML = "confirm = function(){sessionStorage.wasInvoked = true; return false;}";
        document.body.appendChild(s);

        actionInvokingDialog();

        if (sessionStorage.wasInvoked) {
            if (actionOnInvoke) actionOnInvoke();
        } else if (actionOnNotInvoked) actionOnNotInvoked();

        // vratiti na staro, brisanjem umetnute skrtipe confirm se vrati na originalan kod
        document.body.removeChild(s);
        sessionStorage.removeItem("wasInvoked");
    }
}