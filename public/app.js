/**
 * Created by Simone on 23/09/2015.
 */
(function () {
    var app = angular.module('keepass5', []);
    var unlockDb = "home/unlockDb";
    var createDb = "home/createDb";
    var showDb = "home/showDb";
    var changePassword = "changePassword";
    var showHelp = "showHelp";
    var uploadPassword = "uploadPassword";

    app.controller("StartupController", function ($scope) {

        $scope.ctrl = new kpctrl("default");
        $scope.nav = new kpnav();
        $scope.nav.show($scope.ctrl.db.exists() ? unlockDb : createDb);
        $scope.show = function (view) {
            $scope.nav.show(view);
        };
        $scope.removeDb = function () {
            if (!confirm("Verra' eliminato l'archivio nel dispositivo. \r\n" +
                    "Sei sicuro di voler continuare?"))
                return;
            $scope.ctrl.destroy();
            $scope.nav.show(createDb);
        };

        $scope.passwordValid = function (pw) {
            var bad = $scope.ctrl.passwordNotValid(pw);
            if (bad)
                alert("password non valida, deve avere almeno un carattere");
            return !bad;
        };
        $scope.folderValid = function (folder) {
            var bad = $scope.ctrl.folderValid(folder);
            if (bad)
                alert("Cartella non valida, deve avere almeno un carattere");
            return !bad;
        };
        $scope.activateDownloadPassword = function () {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,'
                + encodeURIComponent($scope.ctrl.db.read()));
            element.setAttribute('download', "password.txt");

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        };
        $scope.activateUploadPassword = function () {
            $scope.nav.show(uploadPassword);
        };
    });

    app.controller("CreateDbController", function ($scope) {
        $scope.createDb = function () {
            if (!$scope.passwordValid(this.password))
                return;
            $scope.ctrl.setPassword(this.password);
            $scope.ctrl.save();
            this.password = "";
            $scope.nav.show(showDb);
        }
    });

    app.controller("ChangePasswordController", function ($scope) {
        $scope.changePassword = function () {
            if (!$scope.passwordValid(this.password))
                return;
            $scope.ctrl.setPassword(this.password);
            $scope.ctrl.save();
            this.password = "";
            $scope.nav.show(showDb);
        }
    });

    app.controller("UnlockDbController", function ($scope) {
        $scope.unlockDb = function () {
            if (!$scope.passwordValid(this.password))
                return;
            $scope.ctrl.setPassword(this.password);
            if (!$scope.ctrl.loadOk())
                alert("Password errata!");
            else {
                this.password = "";
                $scope.nav.show(showDb);
            }
        }

    });

    app.controller("ShowDbController", function ($scope) {
        $scope.searchString = "";
        $scope.clearSaveEntryForm = function () {
            $scope.mode = "browse";
            $scope.entry = $scope.ctrl.mod.entryCreateDetached();
        };
        $scope.clearSaveEntryForm();
        $scope.canSearch = function () {
            return $scope.ctrl.mod.entryList().length > 0 && $scope.mode === "browse";
        };
        $scope.inviteUserToAdd = function () {
            return $scope.ctrl.mod.entryList().length === 0 && $scope.mode === "browse";
        };
        $scope.hasEntriesToShow = function () {
            return $scope.entries().length > 0;
        };
        $scope.entries = function () {
            return $scope.ctrl.mod.entrySearch($scope.searchString);
        };
        $scope.saveForm = function () {
            if ($scope.entry.title.length === 0) {
                alert('Inserisci almeno il titolo');
                return false;
            }
            $scope.ctrl.save();
            $scope.clearSaveEntryForm();
        };
        $scope.enableForm = function (mode, btnCaption) {
            $scope.mode = mode;
            $scope.buttonCaption = btnCaption;
        };
        $scope.newEntry = function () {
            $scope.enableForm("new", "Aggiungi voce");
            $scope.entry = $scope.ctrl.mod.entryCreateDetached();
            $scope.saveEntry = function () {
                $scope.ctrl.mod.entryAttach($scope.entry);
                $scope.saveForm();
            };
        };
        $scope.editEntry = function (entry) {
            $scope.enableForm("edit", "Salva voce");
            $scope.entry = entry;
            $scope.saveEntry = function () {
                $scope.saveForm();
            };
        };
        $scope.deleteEntry = function () {
            if (!confirm('Sei sicuro di voler eliminare questa voce?'))
                return;
            $scope.ctrl.mod.entryRemove($scope.entry);
            $scope.ctrl.save();
            $scope.clearSaveEntryForm();
        };
        $scope.sanitizeUrl = function (url) {
            if (url && url.length > 0) {
                var r = new RegExp('^(?:[a-z]+:)?//', 'i');
                if (!r.test(url))
                    return "http://" + url;
            }
            return url;
        };

    });

    app.controller("UploadPasswordController", function ($scope) {
        $scope.uploadPassword = function () {
            var files = document.getElementById('input-file').files;
            if (!files.length || files.length !== 1) {
                alert('Seleziona il file delle password!');
                return;
            }
            if (!confirm('Se carichi il file delle password, ' +
                    'verranno eliminate tutte quelle presenti ora. Vuoi continuare?'))
                return;
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.ctrl.destroy();
                $scope.ctrl.db.write(e.target.result);
                location.reload();
            };
            reader.readAsText(files[0])
        }
    });

    app.controller("ExchangeServerUploadController", function ($scope) {
        $scope.upload = function () {
            if (!$scope.folderValid($scope.folder))
                return;
            $scope.show(showDb);
            $.ajax({
                url: "https://keepass5-giacomelli.rhcloud.com/api/storage/"
                + encodeURIComponent($scope.folder)
                , type: "post"
                , contentType: 'application/x-www-form-urlencoded'
                , data: 'content=' + encodeURIComponent($scope.ctrl.db.read())
                , success: function (data) {
                    if (data.success)
                        alert('Archivio caricato con successo');
                    else
                        alert('Operazione fallita');
                },
                error: function (req, textStatus, errorThrown) {
                    alert('Impossibile contattare il server')
                }
            });

        };
    });

    app.controller("ExchangeServerDownloadController", function ($scope) {
        $scope.download = function () {
            if (!$scope.folderValid($scope.folder))
                return;
            if (!confirm("Verra' eliminato l'archivio nel dispositivo. \r\n" +
                    "Sei sicuro di voler continuare?"))
                return;
            $.ajax({
                url: "https://keepass5-giacomelli.rhcloud.com/api/storage/"
                + encodeURIComponent($scope.folder)
                ,
                success: function (data) {
                    if (data.success) {
                        //alert('success=' + data.content);
                        $scope.ctrl.destroy();
                        $scope.ctrl.db.write(data.content);
                        location.reload();
                    }
                },
                error: function (req, textStatus, errorThrown) {
                    alert('Impossibile contattare il server')
                }
            });

        };
    });
})();
