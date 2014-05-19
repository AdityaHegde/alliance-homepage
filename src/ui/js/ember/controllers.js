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

    createMember : function() {
      this.loadColumnsAndShowWindow(null, this.store.createRecord('member'), true);
    },

    updateMember : function(member) {
      this.loadColumnsAndShowWindow(null, member, false);
    },

    removeMember : function(member) {
      member.deleteRecord();
      GOTAA.saveRecord(member);
    },

  },

  col : ColumnData.ColumnData.create({
    name : "test",
    btnLabel : "Browse",
    method : "ReadAsDataURI",
    accept : "image/*",
  }),
  row : Ember.Object.create(),
});

GOTAA.MemberslistController = SortFilter.SortFilterController.extend({
  init : function() {
    this._super();
    this.set("columnData", GOTAA.ColumnDataMap.profile);
  },
  memberViewing : null,
  columnData : Utils.hasMany(ColumnData.ColumnData),

  sortProperties : ['gotaname'],
  filterProperties : [
    SortFilter.FilterProperty.create({
      filterProperty : "gotaname",
    }),
    /*SortFilter.FilterProperty.create({
      filterProperty : "fealty",
      filteredByRegex : false,
    }),*/
  ],
  membersArray : function() {
    var model = this.get("model");
    return model && model.content && model.content.content;
  }.property("model.@each"),

  actions : {
    memberDetails : function(member) {
      this.set("memberViewing", member);
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
        //Utils.binaryInsert(modules, data, this.comparator);
        document.location.reload(false);
      }
    }
    else if(data instanceof GOTAA.Module) {
      document.location.reload(false);
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
    if(module) module.get("moduleData").removeObject(data);
  },

  addingMember : false,
  modulePermissions : [],
  members : [],
  modulePermissionNames : function() {
    var modulePermissions = this.get("modulePermissions"),
        members = this.get("members"), modulePermissionNames = [];
    for(var i = 0; i < modulePermissions.length; i++) {
      var member = members.findBy("user_id", modulePermissions[i].get("user_id"));
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

  columnModify : {
    challenge : function(columnData, model) {
      for(var i = 3; i <= 5; i++) {
        if(columnData[i].set) {
          columnData[i].set("data", GOTAA.GlobalData.get("members"));
        }
        else {
          columnData[i].data = GOTAA.GlobalData.get("members");
        }
      }
      if(columnData[0].set) {
        columnData[0].set("data", GOTAA.GlobalData.get("challenges"));
      }
      else {
        columnData[0].data = GOTAA.GlobalData.get("challenges");
      }
    },

    "member-list" : function(columnData, model) {
      if(columnData[0].set) {
        columnData[0].set("data", GOTAA.GlobalData.get("members"));
      }
      else {
        columnData[0].data = GOTAA.GlobalData.get("members");
      }
    },
  },

  positionsAvailable : [],
  currentModuleData : null,
  selectedPosition : null,

  onChallengeEnded : function() {
    var currentModule = this.get("currentModule"), currentModuleData = this.get("currentModuleData"),
        selectedPosition = this.get("selectedPosition");
    if(selectedPosition) {
      currentModuleData.set(selectedPosition, GOTAA.GlobalData.profile.get("user_id"));
    }
    currentModuleData.set("challengeStatus", 4);
    GOTAA.GlobalData.set("modId", currentModule.get("id"));
    GOTAA.GlobalData.set("modType", currentModule.get("type"));
    GOTAA.saveRecord(currentModuleData);
    $("#challenge-ended-window").modal("hide");
  },

  actions : {
    addModule : function() {
      if(GOTAA.ColumnDataMap.addmodule[1].set) {
        GOTAA.ColumnDataMap.addmodule[1].set("disabled", false);
      }
      else {
        GOTAA.ColumnDataMap.addmodule[1].disabled = false;
      }
      if(GOTAA.ColumnDataMap.addmodule[3].set) {
        GOTAA.ColumnDataMap.addmodule[3].set("disabled", false);
      }
      else {
        GOTAA.ColumnDataMap.addmodule[3].disabled = false;
      }
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.addmodule, this.store.createRecord("module"), true);
    },

    addData : function(module) {
      var type = module.get("type");
      this.set("module", module);
      if(this.columnModify[type]) {
        this.columnModify[type].call(this, GOTAA.ColumnDataMap[type], this.get("model"));
      }
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap[type], this.store.createRecord(GOTAA.ModuleDataObjectMap[type]), true);
    },

    editModule : function(module) {
      if(GOTAA.ColumnDataMap.addmodule[1].set) {
        GOTAA.ColumnDataMap.addmodule[1].set("disabled", true);
      }
      else {
        GOTAA.ColumnDataMap.addmodule[1].disabled = true;
      }
      if(GOTAA.ColumnDataMap.addmodule[3].set) {
        GOTAA.ColumnDataMap.addmodule[3].set("disabled", true);
      }
      else {
        GOTAA.ColumnDataMap.addmodule[3].disabled = true;
      }
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap.addmodule, module, false);
    },

    editData : function(data, module) {
      var type = module.get("type");
      this.set("module", module);
      if(this.columnModify[type]) {
        this.columnModify[type].call(this, GOTAA.ColumnDataMap[type], this.get("model"));
      }
      this.loadColumnsAndShowWindow(GOTAA.ColumnDataMap[type], data, false);
    },

    deleteModule : function(module) {
      module.deleteRecord();
      GOTAA.saveRecord(module).then(function() {
        document.location.reload();
      });
    },

    editModulePermission : function(module) {
      this.set("members", GOTAA.GlobalData.get("members"));
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
        user_id : this.get("selectedMember"),
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

    expandModule : function(moduleView) {
      moduleView.set("expanded", false);
    },

    contribute : function(item, camp, view) {
      var store = view.get("controller").store,
          campMemItm = store.getById("camp-member-item", GOTAA.GlobalData.profile.get("user_id")+"__"+item.get("item"));
      if(!campMemItm) {
        campMemItm = store.createRecord("camp-member-item", {
          item : item.get("item"),
          qty : 0,
        });
      }
      view.set("campMemItm", campMemItm);
      item.set("crafting", true);
    },

    submitCraft : function(item, camp, view) {
      item.set("crafting", false);
      var campMemItm = view.get("campMemItm"),
          moduleObj = view.get("moduleObj"),
          store = campMemItm.store;
      GOTAA.GlobalData.setProperties({
        "type" : camp.get("type"),
        "fromlevel" : camp.get("fromlevel"),
        "tolevel" : camp.get("tolevel"),
      });
      GOTAA.saveRecord(campMemItm).then(function() {
      });
    },

    cancelCraft : function(item, camp, view) {
      item.set("crafting", false);
    },

    addSelf : function(module) {
      var type = module.get("type"), coldata = GOTAA.ColumnDataMap["member-list"],
          record = this.store.createRecord(GOTAA.ModuleDataObjectMap[type]);
      this.set("module", module);
      record.set("user_id", GOTAA.GlobalData.get("profile").get("user_id"));
      if(coldata[0].set) {
        coldata[0].set("fixedValue", "disabled");
        coldata[0].set("data", [GOTAA.GlobalData.get("members").findBy("user_id", record.get("user_id"))]);
      }
      else {
        coldata[0].fixedValue = "disabled";
        coldata[0].data = [GOTAA.GlobalData.get("members").findBy("user_id", record.get("user_id"))];
      }
      this.loadColumnsAndShowWindow(coldata, record, true);
    },

    editDataSelf : function(data, module) {
      var type = module.get("type"), coldata = GOTAA.ColumnDataMap["member-list"];
      this.set("module", module);
      if(coldata[0].set) {
        coldata[0].set("fixedValue", "disabled");
        coldata[0].set("data", [GOTAA.GlobalData.get("members").findBy("user_id", GOTAA.GlobalData.get("profile").get("user_id"))]);
      }
      else {
        coldata[0].fixedValue = "disabled";
        coldata[0].data = [GOTAA.GlobalData.get("members").findBy("user_id", GOTAA.GlobalData.get("profile").get("user_id"))];
      }
      this.loadColumnsAndShowWindow(coldata, data, true);
    },

    moveLeft : function(module) {
      $.ajax({
        url : "/module/moveHorizontal",
        data : {
          id : module.get("id"),
          dir : "left",
        },
      }).then(function(data) {
        document.location.reload(false);
      });
    },

    moveRight : function(module) {
      $.ajax({
        url : "/module/moveHorizontal",
        data : {
          id : module.get("id"),
          dir : "right",
        },
      }).then(function(data) {
        document.location.reload(false);
      });
    },

    moveUp : function(module) {
      $.ajax({
        url : "/module/moveVertical",
        data : {
          id : module.get("id"),
          dir : "up",
        },
      }).then(function(data) {
        document.location.reload(false);
      });
    },

    moveDown : function(module) {
      $.ajax({
        url : "/module/moveVertical",
        data : {
          id : module.get("id"),
          dir : "down",
        },
      }).then(function(data) {
        document.location.reload(false);
      });
    },

    openImage : function(image, view) {
      view.set("imageUrl", image);
      $(view.get("windowIdHref")).modal("show");
    },

    markAsEnded : function(moduleData, module) {
      this.set("currentModule", module);
      this.set("currentModuleData", moduleData);
      var positionsAvailable = [], positions = ["first", "second", "third"];
      this.set("selectedPosition", null);
      for(var i = 0; i < positions.length; i++) {
        var key = positions[i]+"Id";
        if(Ember.isEmpty(moduleData.get(key))) {
          positionsAvailable.push({ value : key, label : positions[i] + " - " + moduleData.get("challengeDataObj").get(key) });
        }
      }
      this.set("positionsAvailable", positionsAvailable);
    },

    addSelfToPos : function(moduleData, module, position) {
      moduleData.set(position, GOTAA.GlobalData.get("profile").get("user_id"));
      GOTAA.GlobalData.set("modId", module.get("id"));
      GOTAA.GlobalData.set("modType", module.get("type"));
      GOTAA.saveRecord(moduleData);
    },

    removeSelfFromPos : function(moduleData, module, position) {
      moduleData.set(position, null);
      GOTAA.GlobalData.set("modId", module.get("id"));
      GOTAA.GlobalData.set("modType", module.get("type"));
      GOTAA.saveRecord(moduleData);
    },
  },
});

GOTAA.ProfileController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("profileColumns", GOTAA.ColumnDataMap.profile);
  },

  isEditing : false,

  profileColumns : Utils.hasMany(ColumnData.ColumnData),

  actions : {
    editProfile : function() {
      this.set("isEditing", true);
    },

    saveProfile : function() {
      var model = this.get("model"), store = this.store, that = this;
      GOTAA.saveRecord(model).then(function() {
        var meta = store.metadataFor("profile");
        that.set("isEditing", false);
      }, function(message) {
        alert(message);
      });
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

GOTAA.AdminController = Ember.Controller.extend({
  jsondata : null,
  jsondatastr : function(key, value) {
    if(arguments.length === 1) {
      return JSON.stringify(this.get("jsondata"));
    }
    else {
      try {
        this.set("jsondata", JSON.parse(value));
      } catch (e) {}
      return value;
    }
  }.property("jsondata"),

  deepSearch : function(obj, jsondata) {
    if(Ember.typeOf(obj) === "object" || Ember.typeOf(obj) === "array") {
      for(var k in obj) {
        if(obj.hasOwnProperty(k)) {
          this.deepSearch(obj[k], jsondata);
        }
      }
    }
    if(Ember.typeOf(obj) === "object") {
      if(!obj.permission) {
        if(obj.id) {
          jsondata.usedId.removeObject(jsondata.usedId.findBy("idNum", obj.id));
          delete obj.id;
        }
        if(obj.user_id) {
          obj.user_id = jsondata.member.findBy("user_id", obj.user_id).user_id;
          delete obj.user_id;
        }
      }
    }
  },

  actions : {
    getData : function() {
      var that = this;
      $.ajax({
        url : "/backup/get",
        dataType : "json",
      }).then(function(data) {
        if(data.result.status == 0) {
          that.set("jsondata", data.result.data);
        }
        else {
          that.set("jsondata", data.result.message);
        }
      });
    },

    postData : function() {
      var jsondata = this.get("jsondata");
      this.deepSearch(jsondata, jsondata);
      $.ajax({
        url : "/backup/put",
        data : JSON.stringify(jsondata),
        method : "POST",
        dataType : "json",
      });
      this.set("jsondata", jsondata);
    },
  },
});
