function kpmod() {
    return this;
}
kpmod.prototype = {

    entryCreateDetached: function () {
        var res = {};
        res.title = "";
        res.username = "";
        res.password = "";
        res.url = "";
        res.comment = "";
        res.created = new Date();
        res.modified = res.created;
        return res;
    },
    entryCreateAttached: function () {
        var res = this.entryCreateDetached();
        this.entryAttach(res);
        return res;
    },
    entryAttach: function (entry) {
        if (entry instanceof Array)
            Array.prototype.push.apply(this.entryList(), entry);
        else
            this.entryList().push(entry);
    },
    entryList: function () {
        if (!this.items)
            this.items = [];
        return this.items;
    },
    entryRemove: function (entry) {
        this.entryList().splice(this.entryList().indexOf(entry), 1);
    },
    entryClear: function () {
        this.entryList().length = 0;
    },
    entrySearch: function (search) {
        var res = [];
        var its = this.entryList();
        for (var idx = 0; idx < its.length; idx++)
            if (this._searchFunction(its[idx], search))
                res.push(its[idx]);
        return res;
    },
    _searchFunction: function (entry, search) {
        var props = ['title', 'username', 'url', 'comment'];
        for (var idx = 0; idx < props.length; idx++)
            if (entry[props[idx]].toUpperCase().indexOf(search.toUpperCase()) > -1)
                return true;
        return false;
    },
    saveToString: function () {
        return JSON.stringify(this.entryList(), function (key, val) {
            if (key == '$$hashKey') { //this is an Angular prop that must be removed
                return undefined;
            }
            return val;
        });

    },
    loadFromString: function (content) {
        this.entryClear();
        var array = this.entryList();
        Array.prototype.push.apply(array, JSON.parse(content));
    }
}
;

function kpdb(name) {
    this.name = name;
    return this;
}

kpdb.prototype = {
    _namit: function () {
        return "keepass5-" + this.name;
    },
    write: function (content) {
        localStorage.setItem(this._namit(), content);
    },
    read: function () {
        return localStorage.getItem(this._namit());
    },
    remove: function () {
        localStorage.removeItem(this._namit());
    },
    exists: function () {
        return this.read() !== null;
    },
};

function kpctrl(dbName) {
    if (dbName == undefined)
        dbName = "default";
    this.db = new kpdb(dbName);
    this.mod = new kpmod();
    return this;
}

kpctrl.prototype = {
    setPassword: function (password) {
        this.password = password;
    },
    passwordNotValid: function (pw) {
        var p = pw;
        return !!(typeof p !== 'string' || p.length < 1);
    },
    folderValid: function (pw) {
        var p = pw;
        return !!(typeof p !== 'string' || p.length < 1);
    },
    save: function () {
        var content = sjcl.encrypt(this.password, this.mod.saveToString());
        this.db.write(content);
    },
    load: function () {
        var content = sjcl.decrypt(this.password, this.db.read());
        this.mod.loadFromString(content);
    },
    loadOk: function () {
        try {
            this.load();
            return true;
        } catch (err) {
            return false;
        }
    },
    destroy: function () {
        this.db.remove();
        this.mod.entryClear();
    }
};

function kpnav() {
    this.state = {};
    this.view = "";
    return this;
}

kpnav.prototype = {
    show: function (view) {
        var parts = view.split("/");
        if (parts.length > 1)
            this.state[parts[0]] = view;
        else {
            var st = this.state[view];
            if (st !== undefined)
                view = st;
        }
        this.view = view;
    },
    showIf: function (view) {
        return this.view === view;
    },
    showIfState: function (view) {
        var parts = view.split("/");
        if (parts.length > 1)
            return this.state[parts[0]] === view;
        else return false;

    },
};

