
/**
 * 
  fillForms + submit
  je li prebačeno na index?
  je li nađen u tablici?

 */
class CreateTester extends Tester {

    /**
     * 
     * @param {*} test          ime testa za bodovanje dodavanja
     * @param {*} group         grupa u kojoj je student koji se boduje
     * @param {*} student       jmbag studenta
     * @param {*} id            identifikacija testera
     * @param {*} pagerClass    klasa elementa kojim se mjenja stranica
     * @param {*} fillForms     funkcija koja popunjavanja forme na trenutnoj stranici
     * @param {*} getAllMeta    funkcija koja vraća metapodatke trenunte stranice
     */
    constructor(test, group, student, id, pagerClass, fillForms, getAllMeta) {
        super("create", test, group, student, id);
        this.pagerClass = pagerClass;
        this.fillForms = fillForms;
        this.getAllMeta = getAllMeta;

        this.tempData = id + "createTemp";
        
        this.addStep((callBack) => {
            this.saveStatus(undefined, "dodavanje...");
        
            var allAdded = this.fillForms();
            this.saveStatus(undefined, "input: " + allAdded.toString());
            var data = {};
            data[this.tempData] = allAdded;
            chrome.storage.local.set(data);

            this.saveStatus(undefined, "prebacivanje na index...");
            document.querySelector("form [type='submit']").click();
            callBack(this.WAIT_PAGE_CHANGE);
        });

        this.addStep((callBack) => {
            var meta = this.getAllMeta();
            if (meta.page && meta.page.toLowerCase() == "index") {
                this.saveStatus(true, "prebacio se na index");
            } else {
                this.saveStatus(false, "nije se prebacio na index");
            }
            callBack();
        });
    }

    // override
    executeStep(stepIndex, callBack) {
        if (stepIndex < this.steps.length) {
            super.executeStep(stepIndex, callBack);

        } else {
            var pageChanger = new PageChanger(() => {
                // ne predaje se akcija za svaku stranu jer se na novu stranu prelazi samo kada element nije nađen 
                // (kada je element nađen nesmije pozvati nextPage)
            }, () => {
                this.saveStatus(false, "nije pronađen u tablici");
                this.gradeTest(false);
                Utils.saveForOthers(this.id, undefined);
                callBack(this.STOP);  // sve stranice prođene i nije nađen -> test gotov

            }, () => {
                callBack(this.WAIT_PAGE_CHANGE);

            }, this.pagerClass, (this.id + "create"), (stepIndex == this.steps.length), -1);

            chrome.storage.local.get(this.tempData, items => 
                Utils.findRowInTable(
                    items[this.tempData], 
                    
                    () => {
                        this.saveStatus(true, "pronađen je u tablici");
                        this.gradeTest(true);
                        Utils.saveForOthers(this.id, items[this.tempData]);
                        callBack(this.STOP);  // nađen je -> test gotov
                   
                    }, () => pageChanger.nextPage(), // nije nađen -> sljedeća stranica

                    () => {
                        this.saveStatus(false, "nema tablice");
                        this.gradeTest(false);
                        Utils.saveForOthers(this.id, undefined);
                        callBack(this.STOP);  // nema tablice -> test je gotov
                    }
                )
            );
        }
    }
}