

class EditTester extends Tester {

    /**
     * 
     * @param {*} test          ime testa za bodovanje dodavanja
     * @param {*} group         grupa u kojoj je student koji se boduje
     * @param {*} student       jmbag studenta
     * @param {*} id            identifikacija testera
     * @param {*} pagerClass    klasa elementa kojim se mjenja stranica
     * @param {*} editClass     klasa gumba kojim se pokreće ažuriranje
     * @param {*} fillForms     funkcija koja popunjavanja forme na trenutnoj stranici
     * @param {*} getAllMeta    funkcija koja vraća metapodatke trenunte stranice
     */
    constructor(test, group, student, id, pagerClass, editClass, fillForms, getAllMeta) {
        super("edit", test, group, student, id);
        this.pagerClass = pagerClass;
        this.editClass = editClass;
        this.fillForms = fillForms;
        this.getAllMeta = getAllMeta;

        this.tempOld = id + "editTempOld";
        this.tempNew = id + "editTempNew";

        this.addStep((callBack) => {
            this.saveStatus(undefined, "ažuriranje...");
            
            Utils.retrieveFromOthers(this.id, data => {
                if (data == undefined) {
                    this.saveStatus(false, "tester ažurira samo element koji je dodao create tester");
                    callBack(this.STOP);
                } else {
                    var save = {};
                    save[this.tempOld] = data;
                    chrome.storage.local.set(save);
                    this.saveStatus(undefined, "staro: " + data.toString());

                    // traži element i klikne edit gumb
                    Utils.findRowInTable(
                        data,

                        row => {
                            this.saveStatus(true, "pronađen je u tablici");
                            var editBtn = row.querySelector("[class='" + this.editClass + "']");
                            if (editBtn == undefined) {
                                this.saveStatus(false, "nema gumba za ažuriranje (class=" + this.editClass + ")");
                                callBack(this.STOP);
                            } else {
                                this.saveStatus(undefined, "edit gumb kliknut");
                                editBtn.click();
                                callBack(this.WAIT_PAGE_CHANGE);
                            }

                        }, () => {
                            this.saveStatus(false, "dodani element nije na trenutnoj strani");
                            this.gradeTest(false);
                            callBack(this.STOP);

                        }, () => {
                            this.saveStatus(false, "nema tablice");
                            this.gradeTest(false);
                            callBack(this.STOP);
                        }
                    );
                }
            })

        });

        this.addStep((callBack) => {
            var meta = this.getAllMeta();
            if (meta.page && meta.page.toLowerCase() == "edit") {
                this.saveStatus(true, "prebacio se na edit");
            } else {
                this.saveStatus(false, "nije se prebacio na edit");
            }
            callBack();
        });
        
        this.addStep((callBack) => {
            var allAdded = this.fillForms();
            this.saveStatus(undefined, "novo: " + allAdded.toString());
            var data = {};
            data[this.tempNew] = allAdded;
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
                callBack(this.STOP);  // sve stranice prođene i nije nađen -> test gotov

            }, () => {
                callBack(this.WAIT_PAGE_CHANGE);

            }, this.pagerClass, (this.id + "edit"), (stepIndex == this.steps.length), -1);

            var toRetrieve = {};
            toRetrieve[this.tempNew] = null;
            toRetrieve[this.tempOld] = null;
            chrome.storage.local.get(toRetrieve, items => {

                // traži stari - nesmije biti
                Utils.findRowInTable(
                    items[this.tempOld],

                    () => {
                        this.saveStatus(false, "pronađen je stari podatak");
                        this.gradeTest(false);
                        callBack(this.STOP);
                    }
                );

                // traži novi - mora biti
                Utils.findRowInTable(
                    items[this.tempNew],

                    () => {
                        this.saveStatus(true, "pronađen je novi podatak");
                        this.gradeTest(true);
                        Utils.saveForOthers(this.id, items[this.tempNew]);
                        callBack(this.STOP);

                    }, () => pageChanger.nextPage(),

                    () => {
                        this.saveStatus(false, "nema tablice");
                        this.gradeTest(false);
                        callBack(this.STOP);
                    }
                );
            });
        }
    }
}