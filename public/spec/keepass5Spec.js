describe("kpmod", function () {
    var mod;
    beforeEach(function () {
        mod = new kpmod();
    });

    it("entryCreate should not return undefined", function () {
        expect(mod.entryCreateDetached()).toBeDefined();
    });
    it("entryList should return an array of length 0", function () {
        expect(mod.entryList()).toEqual([]);
    });
    it("attached entry should be later returned by entry list", function () {
        var entry = mod.entryCreateDetached();
        mod.entryAttach(entry);
        expect(mod.entryList()).toEqual([entry]);
    });
    it("attach should work with array", function () {
        mod.entryAttach([mod.entryCreateDetached(), mod.entryCreateDetached()]);
        expect(mod.entryList().length).toEqual(2);
    });
    it("different instances should not interfere with each other", function () {
        var mod2 = new kpmod();
        var e1 = mod.entryCreateDetached();
        var e2 = mod2.entryCreateDetached();
        var e3 = mod.entryCreateDetached();
        mod.entryAttach([e1, e3]);
        mod2.entryAttach([e2]);

        expect(mod.entryList()).toEqual([e1, e3]);
        expect(mod2.entryList()).toEqual([e2]);
    });
    it("different instances should not interfere with each other", function () {
        var e1 = mod.entryCreateAttached();
        var e2 = mod.entryCreateAttached();
        var e3 = mod.entryCreateAttached();
        mod.entryRemove(e2);
        expect(mod.entryList()).toEqual([e1, e3]);
    });
    it("entryCreate should update 'created' and 'modified' fields", function () {
        var mockDate = new Date(2011, 11, 30, 22, 45, 55, 777);
        jasmine.clock().mockDate(mockDate);
        var entry = mod.entryCreateDetached();
        expect(entry.created).toEqual(mockDate);
        expect(entry.modified).toEqual(mockDate);
    });
    it("entryCreate should define basic properties", function () {
        var entry = mod.entryCreateDetached();
        expect(entry.title).toBeDefined();
        expect(entry.username).toBeDefined();
        expect(entry.password).toBeDefined();
        expect(entry.url).toBeDefined();
        expect(entry.comment).toBeDefined();
        expect(entry.created).toBeDefined();
        expect(entry.modified).toBeDefined();
    });
    it("entryClear should work without element", function () {
        mod.entryClear();
        expect(mod.entryList().length).toEqual(0);
    });
    it("entryClear should not change array instance", function () {
        mod.entryCreateDetached();
        var array = mod.entryList();
        mod.entryClear();
        expect(mod.entryList() == array).toEqual(true, "should be same instance");
    });
    it("entryClear should clear a list with one entry", function () {
        mod.entryCreateDetached();
        mod.entryClear();
        expect(mod.entryList().length).toEqual(0);
    });
    it("entryCreateAttached should add entry to list", function () {
        mod.entryCreateAttached();
        mod.entryCreateAttached();
        expect(mod.entryList().length).toEqual(2);
    });
    it("entrySearch with custom search function should return correct list", function () {
        var e1 = mod.entryCreateAttached();
        var e2 = mod.entryCreateAttached();
        var e3 = mod.entryCreateAttached();
        e1.url = "ok-1";
        e2.url = "nope";
        e3.url = "ok-2";
        mod._searchFunction = function (entry, search) {
            return entry.url.indexOf(search) > -1;
        };
        expect(mod.entrySearch("ok")).toEqual([e1, e3]);
    });
    function searchOk(propertyName) {
        var e1 = mod.entryCreateDetached();
        e1[propertyName] = "maTCH";
        expect(mod._searchFunction(e1, "match")).toBe(true, propertyName + " should match");
        expect(mod._searchFunction(e1, "fail")).toBe(false, propertyName + " should not match");
    }

    it("default search should be case insensitive for name,username,url,comment", function () {
        searchOk("title");
        searchOk("username");
        searchOk("url");
        searchOk("comment");
    });
    it("default search should not use password field", function () {
        var e1 = mod.entryCreateDetached();
        e1.password = "findme";
        expect(mod._searchFunction(e1, "findme")).toBe(false, "password should never match");
    });
    it("save should generate json string and load restore it", function () {
        mod.entryCreateAttached().name = "bob bank";
        mod2 = new kpmod();
        mod2.loadFromString(mod.saveToString());
        expect(mod2.entryList().length).toEqual(1, "one entry should be restored, but none was found");
        expect(mod2.entryList()[0].name).toEqual("bob bank");
    });
    it("save/load should not change list array instance", function () {
        mod.entryCreateDetached().name = "bob bank";
        var array = mod.entryList();
        mod.loadFromString(mod.saveToString());
        expect(mod.entryList() == array).toEqual(true, "should be same instance");
    });
    it("save/add entry/load should restore correct instances", function () {
        mod.entryCreateAttached().name = "bob bank";
        var content = mod.saveToString();
        mod.entryCreateAttached().name = "foo";
        mod.loadFromString(content);
        expect(mod.entryList().length).toEqual(1);
    });
    it("load bad string should throw exception and clear previous entry", function () {
        mod.entryCreateAttached();
        expect(function () {
            mod.loadFromString("bad json model");
        }).toThrow();
        expect(mod.entryList().length).toEqual(0);
    });

});

describe("kpdb", function () {

    var db;
    beforeEach(function () {
        db = new kpdb("testing");
    });

    it("write and read should return correct string", function () {
        db.write("content1");
        expect(db.read()).toEqual("content1");
    });
    it("write, remove and read should return null", function () {
        db.write("content1");
        db.remove();
        expect(db.read()).toBeNull();
    });
    it("write/exists should be true, remove/exists should false", function () {
        db.write("content1");
        expect(db.exists()).toEqual(true);
        db.remove();
        expect(db.exists()).toEqual(false);
    });

});

describe("aes", function () {

    it("encrypt and decrypt should return correct string", function () {
        var encrypted = sjcl.encrypt("Secret Passphrase", "Message");
        var decrypted = sjcl.decrypt("Secret Passphrase", encrypted);
        expect(decrypted).toEqual("Message");
    });

});

describe("kpctrl", function () {
    var ctrl;
    beforeEach(function () {
        ctrl = new kpctrl("testing");
    });

    it("clean database, should add entry,save,load successfully", function () {
        ctrl.db.remove();
        ctrl.mod.entryCreateAttached().name = "entry1";
        ctrl.setPassword("master-password");
        ctrl.save();
        var ctrl2 = new kpctrl("testing");
        ctrl2.setPassword("master-password");
        ctrl2.load();
        var el = ctrl2.mod.entryList();
        expect(el.length).toEqual(1);
        expect(el[0].name).toEqual("entry1");
    });
    it("constructor without parameter should create database with name 'default'", function () {
        ctrl2 = new kpctrl();
        expect(ctrl2.db.name).toEqual("default");
    });
    it("should not save entries in clear text", function () {
        ctrl.mod.entryCreateDetached().name = "find me";
        ctrl.setPassword("master-password");
        ctrl.save();
        expect(ctrl.db.read()).not.toContain("find me");
    });
    it("wrong password and load should throw an exception", function () {
        ctrl.mod.entryCreateDetached();
        ctrl.setPassword("master-password");
        ctrl.save();
        ctrl.setPassword("wrong-password");
        expect(function () {
            ctrl.load();
        }).toThrow();
    });
    it("wrong password and canLoad return false", function () {
        ctrl.setPassword("master-password");
        ctrl.save();
        ctrl.setPassword("wrong-password");
        expect(ctrl.loadOk()).toEqual(false);
    });
    it("good password and loadOk return true", function () {
        ctrl.setPassword("master-password");
        ctrl.save();
        expect(ctrl.loadOk()).toEqual(true);
    });
    it("undefined or blank password should return passwordNotValid", function () {
        expect(ctrl.passwordNotValid(undefined)).toEqual(true);
        expect(ctrl.passwordNotValid("")).toEqual(true);
        expect(ctrl.passwordNotValid("a")).toEqual(false);
    });
    it("clear should remove db and clear entries",function(){
        ctrl.mod.entryCreateAttached().name = "entry1";
        expect(ctrl.mod.entryList().length).toEqual(1);
        ctrl.setPassword("master-password");
        ctrl.save();
        ctrl.destroy();
        expect(ctrl.mod.entryList().length).toEqual(0);
        expect(ctrl.loadOk()).toEqual(false);
    });
});

describe("kpnav", function () {
    var nav;
    beforeEach(function () {
        nav = new kpnav();
    });

    it("show should make current the view", function () {
        nav.show("view1");
        expect(nav.showIf("view1")).toEqual(true);
    });
    it("showIf should return false if current view is different", function () {
        nav.show("view1");
        expect(nav.showIf("view2")).toEqual(false);
    });
    it("showIf should return false if no previous view was set", function () {
        expect(nav.showIf("view2")).toEqual(false);
    });
    it("show view/state, show view",function(){
        nav.show("view1/state1");
        nav.show("view2");
        nav.show("view1");
        expect(nav.showIf("view1/state1")).toEqual(true);
    });
    it("showIfState should honor view/state",function(){
        nav.show("view1/state1");
        nav.show("view2");
        expect(nav.showIfState("view1/state1")).toEqual(true);
    });
    it("showIfState should honor view/state",function(){
        nav.show("view1/state1");
        nav.show("view2");
        expect(nav.showIfState("view1/state1")).toEqual(true);
    });

});