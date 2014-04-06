GOTAA.IndexController = Ember.Controller.extend({
});

var getJSON = function(data) {
  var json = JSON.parse(JSON.stringify(data));
  delete json.validationFailed;
  delete json.parentObj;
  return JSON.stringify(json);
};
GOTAA.HomeController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columns", []);
  },

  columns : Utils.hasMany(ColumnData.ColumnData),
  data : null,
  module : null,
  ariaHidden : false,
  newObj : false,


  onOk : function() {
    var data = this.get("data"), module = this.get("module"),
        model = this.get("model"), modules = model.get("modules"),
        newObj = this.get("newObj");
    if(data instanceof GOTAA.ModuleObject) {
      if(newObj) {
        $.ajax({url : "/create_module", data : {data : getJSON(data)}, method : "POST"}).then(function(retdata) {
          data.set("idNum", retdata.data.id);
          var idx = modules.findBy("col", data.get("col"));
          if(idx >= 0) {
            modules.insertAt(idx, data);
          }
          else {
            modules.pushObject(data);
          }
        }, function(reason) {
          console.log(reason);
        });
      }
      else {
        $.ajax({url : "/save_module", data : {data : getJSON(data)}, method : "POST"});
      }
    }
    else {
      if(newObj) {
        $.ajax({
          url : "/create_module_data",
          data : {
            data : getJSON(data),
            id : module.get("idNum"),
            type : module.get("type"),
          },
          method : "POST"
        }).then(function(retdata) {
          var dataArr = module.get("data");
          data.set("idNum", retdata.data.id);
          dataArr.unshiftObject(data);
        }, function(reason) {
          console.log(reason);
        });
      }
      else {
        $.ajax({
          url : "/save_module_data",
          data : {
            data : getJSON(data),
            id : module.get("idNum"),
            type : module.get("type"),
          },
          method : "POST"
        });
      }
    }
    $("#add-module-window").modal('hide');
    this.set("ariaHidden", true);
  },

  onCancel : function() {
    this.set("data", null);
    this.set("ariaHidden", true);
    //$("#add-module-window").modal('hide');
  },

  actions : {
    addModule : function() {
      this.set("columns", GOTAA.ColumnDataMap.module);
      this.set("data", GOTAA.ModuleObject.create());
      this.set("ariaHidden", false);
      this.set("newObj", true);
      $("#add-module-window").modal('show');
    },

    addData : function(module) {
      var type = module.get("type");
      this.set("columns", GOTAA.ColumnDataMap[type]);
      this.set("data", GOTAA.ModuleDataObjectMap[type].create());
      this.set("module", module);
      this.set("ariaHidden", false);
      this.set("newObj", true);
      $("#add-module-window").modal('show');
    },

    editModule : function(module) {
      this.set("columns", GOTAA.ColumnDataMap.module);
      this.set("data", module);
      this.set("ariaHidden", false);
      this.set("newObj", false);
      $("#add-module-window").modal('show');
    },

    editData : function(data, module) {
      var type = module.get("type");
      this.set("columns", GOTAA.ColumnDataMap[type]);
      this.set("data", data);
      this.set("module", module);
      this.set("ariaHidden", false);
      this.set("newObj", false);
      $("#add-module-window").modal('show');
    },

    deleteData : function(data, module) {
      $.ajax({
        url : "/delete_module_data",
        data : {
          id : data.get("idNum"),
          type : module.get("type"),
        },
        method : "GET"
      }).then(function(retdata) {
        module.get("data").removeObject(data);
      });
    },
  },
});

GOTAA.ProfileController = Ember.Controller.extend({
  init : function() {
    this._super();
    this.set("columns", GOTAA.ColumnDataMap.invite);
  },

  isEditing : false,
  columns : Utils.hasMany(ColumnData.ColumnData),
  data : Ember.Object.create(),
  ariaHidden : false,

  onOk : function() {
    var data = this.get("data"), module = this.get("module"),
        model = this.get("model"), modules = model.get("modules"),
        newObj = this.get("newObj");
    $.ajax({url : "/invite_member", data : {data : getJSON(data)}, method : "POST"}).then(function(retdata) {
      console.log(retdata);
    }, function(reason) {
      console.log(reason);
    });
    $("#invite-member-window").modal('hide');
    this.set("ariaHidden", true);
  },

  onCancel : function() {
    this.set("data", null);
    this.set("ariaHidden", true);
    //$("#invite-member-window").modal('hide');
  },

  actions : {
    editProfile : function() {
      this.set("isEditing", true);
    },

    saveProfile : function() {
      var model = this.get("model");
      $.ajax({
        url : "/update_profile",
        data : {data : getJSON(model)},
        method : "POST",
      }).then(function(retdata) {
        alert("Give this link to member " + retdata.data.url + ".");
      });
      this.set("isEditing", false);
    },

    inviteMember : function() {
      this.set("data", Ember.Object.create({parentObj : "dummy"}));
      this.set("ariaHidden", false);
      $("#invite-member-window").modal('show');
    },
  },
});
