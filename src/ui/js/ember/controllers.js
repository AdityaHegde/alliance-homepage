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
  ariaHidden : true,
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
    var data = this.get("data"), meta = this.store.metadataFor("member"),
        model = this.get("model"), members = model.get("members");
    members.pushObject(data);
    alert("Give this invitation url : "+meta.url+" to the member");
  },

  editing : function(key, value) {
    if(arguments.length > 1) {
      return value;
    }
    else {
      return Ember.isEmpty(GOTAA.GlobalData.get("allianceName")) && GOTAA.GlobalData.get("canEditAlliance");
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
      this.loadColumnsAndShowWindow(null, this.store.createRecord('member'), true);
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

  comparator : function(a, b) {
    return a.get("col") - b.get("col");
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
        Utils.binaryInsert(modules, data, this.comparator);
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

  addingMember : false,
  modulePermissions : [],
  members : [],
  modulePermissionNames : function() {
    var modulePermissions = this.get("modulePermissions"),
        members = this.get("members"), modulePermissionNames = [];
    for(var i = 0; i < modulePermissions.length; i++) {
      var member = members.findBy("email", modulePermissions[i].get("email"));
      if(member) {
        modulePermissionNames.pushObject(Ember.Object.create({
          name : member.get("name"),
          memberPermission : modulePermissions[i],
          member : member,
        }));
      }
    }
    return modulePermissionNames;
  }.property("modulePermissions.@each", "members.@each"),
  selectedMember : null,
  currentModule : null,

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
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.addmodule, module, false);
    },

    editData : function(data, module) {
      var type = module.get("type");
      this.set("module", module);
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap[type], data, false);
    },

    editModulePermission : function(module) {
      this.set("members", this.store.find("member"));
      this.set("modulePermissions", module.get("modulePermissions"));
      this.set("currentModule", module);
    },

    addMember : function() {
      this.set("addingMember", true);
    },

    cancelAddMember : function() {
      this.set("addingMember", false);
    },

    add : function() {
      var modulePermission = this.store.createRecord("module-permission", {
        moduleId : this.get("currentModule").get("moduleObj").get("id"),
        email : this.get("selectedMember"),
      }), modulePermissions = this.get("modulePermissions");
      GOTAA.saveRecord(modulePermission).then(function(data) {
        GOTAA.GlobalData.get("editableModules").pushObject(modulePermission);
        modulePermissions.pushObject(modulePermission);
      });
    },

    deleteMember : function(modulePermission) {
      modulePermission.deleteRecord();
      GOTAA.GlobalData.get("editableModules").removeObject(modulePermission);
      this.get("modulePermissions").removeObject(modulePermission);
      GOTAA.saveRecord(modulePermission);
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

GOTAA.PermissionController = GOTAA.ModelOperationController.extend({
  columnData : GOTAA.ColumnDataMap.permission,
  modalWindow : "#edit-permission-window",

  actions : {
    editPermission : function(permission) {
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.permission, permission, false);
    },
  },
});
