

class DeleteTester extends Tester {

    /**
     * 
     * @param {*} test          ime testa za bodovanje brisanja
     * @param {*} group         grupa u kojoj je student koji se boduje
     * @param {*} student       jmbag studenta
     * @param {*} id            identifikacija testera
     * @param {*} deleteClass   klasa gumba kojim se pokreće brisanje
     * @param {*} dialogTest    ime testa za bodovanje dijaloga prije brisanja
     */
    constructor(test, group, student, id, deleteClass, dialogTest) {
        super("delete", test, group, student, id);
        this.deleteClass = deleteClass;

        this.tempOld = id + "deleteTempOld";
        this.tempNew = id + "deleteTempNew";

        this.dialogTest = dialogTest;

        this.isSame = false,

        this.addStep((callBack) => {
            this.saveStatus(undefined, "brisanje...");
            this.isSame = true; // za sljedeći korak
            
            Utils.retrieveFromOthers(this.id, data => {
                if (data == undefined) {
                    this.saveStatus(false, "delete tester briše samo element koji je dodao create ili edit tester");
                    callBack(this.STOP);
                } else {
                    // traži element i klikne delete gumb
                    Utils.findRowInTable(data,
                        row => {
                            this.saveStatus(true, "pronađen je u tablici");
                            var deleteBtn = row.querySelector("[class='" + this.deleteClass + "']");
                            if (deleteBtn == undefined) {
                                this.saveStatus(false, "nema gumba za brisanje (class=" + this.deleteClass + ")");
                                callBack(this.STOP);
                            } else {
                                this.saveStatus(undefined, "delete gumb kliknut --> cancel");
                                this.saveStatus(undefined, "upit prije brisanja...");
                                var dialogTester = new DeleteTester(this.dialogTest, this.group, this.student, this.id);
                                Utils.expectDialog(false, 
                                    () => deleteBtn.click(),
                                    () => {
                                        dialogTester.saveStatus(true, "Otvoren je popup dijalog");
                                        dialogTester.gradeTest(true);
                                    }, () => {
                                        dialogTester.saveStatus(false, "Nema popup dijalog prije brisanja");
                                        dialogTester.gradeTest(false);
                                    }
                                ); 
                                callBack(this.WAIT_PAGE_CHANGE);
                            }

                        }, () => {
                            this.saveStatus(false, "element dodan s create/edit testerom nije na trenutnoj strani");
                            callBack(this.STOP);

                        }, () => {
                            this.saveStatus(false, "nema tablice");
                            callBack(this.STOP);
                        }
                    );
                }
            });
        });

        this.addStep((callBack) => {
            if (this.isSame === true) {
                this.saveStatus(true, "ostao na istoj stranici");
                Utils.retrieveFromOthers(this.id, data => {
                    Utils.findRowInTable(data,
                        row => {
                            this.saveStatus(true, "nije brisan");
                            var deleteBtn = row.querySelector("[class='" + this.deleteClass + "']");
                            this.saveStatus(undefined, "delete gumb kliknut --> confirm");
                            Utils.expectDialog(true, () => deleteBtn.click()); 
                            callBack(this.WAIT_PAGE_CHANGE);

                        }, () => {
                            this.saveStatus(false, "obrisan je iako je brisanje prekinuto");
                            this.gradeTest(false);
                            callBack(this.STOP);
                        }
                    );
                });
            } else {
                this.saveStatus(false, "promijenio stranicu");
                this.gradeTest(false); 
                callBack(this.STOP);
            }
        });
        
        this.addStep((callBack) => {
            Utils.retrieveFromOthers(this.id, data => {
                Utils.findRowInTable(data,
                    () => {
                        this.saveStatus(false, "nije obrisan");
                        this.gradeTest(false);
                        callBack(this.STOP);

                    }, () => {
                        this.saveStatus(true, "obrisan");
                        this.gradeTest(true);
                        callBack(this.STOP);
                    }
                );
            });
        });
    }

}