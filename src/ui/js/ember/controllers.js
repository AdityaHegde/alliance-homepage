GOTAA.IndexController = Ember.Controller.extend({
});

GOTAA.ModelOperationController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columns", this.get("columnData"));
  },

  columns : Utils.hasMany(ColumnData.ColumnData),
  columnData : [],
  data : Ember.Object.create(),
  newObj : false,
  ariaHidden : false,
  modalWindow : null,

  loadColumnsAndShowWindow : function(columns, data, newObj) {
    if(columns) this.set("columns", columns);
    this.set("data", data);
    this.set("newObj", newObj);
    this.set("ariaHidden", false);
    if(this.get("modalWindow")) $(this.get("modalWindow")).modal('show');
  },

  preSave : function() {
  },

  onSave : function() {
    var data = this.get("data"), module = this.get("module"),
        model = this.get("model"), modules = model.get("modules"),
        newObj = this.get("newObj");
    this.get("postSave").call(this);
    if(this.get("modalWindow")) $(this.get("modalWindow")).modal('hide');
    this.set("ariaHidden", true);
  },

  postSave : function() {
  },

  onCancel : function() {
    var data = this.get("data");
    this.set("data", null);
    this.set("ariaHidden", true);
    if(this.get("newObj")) {
      data.deleteRecord();
    }
    else {
      data.rollback();
    }
    //if(this.get("modalWindow")) $(this.get("modalWindow")).modal('hide');
  },

  actions : {
    deleteData : function(record) {
      var that = this;
      this.get("preDelete").apply(this, arguments);
      record.deleteRecord();
      GOTAA.saveRecord(record).then(function(data) {
        that.get("postDelete").call(that);
      });
    },
  },
});

GOTAA.AllianceController = GOTAA.ModelOperationController.extend({
  columnData : GOTAA.ColumnDataMap.invite,
  modalWindow : "#invite-member-window",

  postSave : function() {
    var data = this.get("data"),
        model = this.get("model"), members = model.get("members");
    members.pushObject(data);
  },

  editing : function(key, value) {
    if(arguments.length > 1) {
      return value;
    }
    else {
      return Ember.isEmpty(GOTAA.GlobalData.get("allianceName")) && GOTAA.CurrentProfile.get("canEditData");
    }
  }.property(),

  actions : {
    saveAlliance : function() {
      var model = this.get("model");
      GOTAA.saveRecord(model).then(function() {
        GOTAA.GlobalData.set("allianceName", model.get("name"));
        GOTAA.GlobalData.set("allianceMotto", model.get("motto"));
      });
      this.set("editing", false);
    },

    editAlliance : function() {
      this.set("editing", true);
    },

    inviteMember : function() {
      this.loadColumnsAndShowWindow([], this.store.createRecord('member'), true);
    },
  },
});

GOTAA.DashboardController = GOTAA.ModelOperationController.extend({
  init : function() {
    this._super();
    this.set("columns", []);
  },

  columns : Utils.hasMany(ColumnData.ColumnData),
  data : null,
  module : null,
  ariaHidden : true,
  modalWindow : "#add-module-window",

  preSave : function(data) {
    var data = this.get("data"), module = this.get("module"),
        model = this.get("model"), modules = model.get("modules"),
        newObj = this.get("newObj");
    if(!(data instanceof GOTAA.Module)) {
      GOTAA.GlobalData.set("modId", module.get("id"));
      GOTAA.GlobalData.set("modType", module.get("type"));
    }
  },

  postSave : function() {
    var data = this.get("data"), module = this.get("module"),
        model = this.get("model"), modules = model.get("modules"),
        newObj = this.get("newObj");
    if(newObj) {
      if(!(data instanceof GOTAA.Module)) {
        var dataArr = module.get("moduleData");
        dataArr.unshiftObject(data);
      }
      else {
        modules.pushObject(data);
      }
    }
  },

  preDelete : function(data, module) {
    this.set("data", data);
    this.set("module", module);
    if(!(data instanceof GOTAA.Module)) {
      GOTAA.GlobalData.set("modId", module.get("id"));
      GOTAA.GlobalData.set("modType", module.get("type"));
    }
  },

  postDelete : function() {
    var data = this.get("data"), module = this.get("module");
    module.get("moduleData").removeObject(data);
  },

  actions : {
    addModule : function() {
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.addmodule, this.store.createRecord("module"), true);
    },

    addData : function(module) {
      var type = module.get("type");
      this.set("module", module);
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap[type], this.store.createRecord(GOTAA.ModuleDataObjectMap[type]), true);
    },

    editModule : function(module) {
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.module, module, false);
    },

    editData : function(data, module) {
      var type = module.get("type");
      this.set("module", module);
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap[type], data, false);
    },
  },
});

GOTAA.ProfileController = Ember.Controller.extend({
  isEditing : false,

  actions : {
    editProfile : function() {
      this.set("isEditing", true);
    },

    saveProfile : function() {
      var model = this.get("model"), store = this.store;
      GOTAA.saveRecord(model).then(function() {
        var meta = store.metadataFor("profile");
        alert("Give this link to member " + meta.url + ".");
      });
      this.set("isEditing", false);
    },
  },
});
