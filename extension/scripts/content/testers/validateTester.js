/**
 * 

    submita praznu formu
    provjerava je li se ostalo na istoj strani

 */
class ValidateTester extends Tester {

    constructor(test, group, student, id) {
        super("validate", test, group, student, id);

        this.isSame = false;
        this.tempData = id + "tempValidateTester";

        this.addStep((callBack) => {
            this.saveStatus(undefined, "validacija...");

            document.querySelectorAll("input").forEach(e => {
                if (e.getAttribute("type") != "hidden") e.value = "";
            });

            var toStore = {};
            toStore[this.tempData] = window.location.href;
            chrome.storage.local.set(toStore);
            document.querySelector("form [type='submit']").click();
            this.isSame = true;  // ako se sljedeći korak pokrene na drugoj stranici napravit će novi objekt i samo će sljedeći korak biti pozvan
            callBack(this.WAIT_PAGE_CHANGE);
        });

        this.addStep((callBack) => {
            if (this.isSame === true) {
                this.saveStatus(true, "ostao na istoj stranici -> obavljena provjera na klijentskoj strani");
                this.gradeTest(true);
            } else {
                chrome.storage.local.get(this.tempData, items => {
                    var lastUrl = items[this.tempData].split("?")[0];  // u slučaju da su argumenti različiti
                    var currentUrl = window.location.href.split("?")[0];
                    if (lastUrl == currentUrl) {
                        this.saveStatus(true, "osviježio stranicu -> obavljena provjera na serveru");
                        this.gradeTest(true);
                    } else {
                        this.saveStatus(false, "promijenio stranicu");
                        this.gradeTest(false);
                    }
                });
            }
            callBack(this.STOP);
        });
    }
}