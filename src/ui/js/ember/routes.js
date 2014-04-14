GOTAA.IndexRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return this.store.findById('profile', '0');
  },

  afterModel : function(model, transition) {
    var serializer = this.store.serializerFor("module"),
        globalPerms = GOTAA.GlobalData.get("permissions");

    GOTAA.GlobalData.set("profile", model);
    meta = this.store.metadataFor("profile");
    GOTAA.GlobalData.set("allianceName", meta.alliance.name);
    GOTAA.GlobalData.set("allianceMotto", meta.alliance.motto);

    for(var i = 0; i < meta.editableModules.length; i++) {
      meta.editableModules[i] = serializer.normalize(this.store.modelFor("module-permission"), meta.editableModules[i], "module-permission");
      GOTAA.GlobalData.get("editableModules").pushObject(this.store.push("module-permission", meta.editableModules[i]));
    }

    for(var i = 0; i < GOTAA.Permission.Operations.length; i++) {
      if(!globalPerms.findBy("oprn", GOTAA.Permission.Operations[i])) {
        var permission = meta.permissions.findBy("oprn", GOTAA.Permission.Operations[i]);
        if(permission) {
          permission = serializer.normalize(this.store.modelFor("permission"), permission, "permission");
          globalPerms.pushObject(this.store.push("permission", permission));
        }
        else {
          globalPerms.pushObject(this.store.createRecord("permission", {
            oprn : GOTAA.Permission.Operations[i],
            permission : 2,
          }));
        }
      }
    }

    if(transition.targetName === 'index.index') {
      this.transitionTo('alliance');
    }
  },
});

GOTAA.AllianceRoute = Ember.Route.extend({
  model : function(params, transtion) {
    if(GOTAA.GlobalData.get("allianceName")) {
      return this.store.findById('alliance', '0');
    }
    else {
      return this.store.createRecord('alliance');
    }
  },
});

GOTAA.DashboardRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return this.store.findById('dashboard', '0');
  },
});

GOTAA.ProfileRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return GOTAA.GlobalData.get("profile");
  },
});

GOTAA.PermissionRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return GOTAA.GlobalData.get("permissions");
  },
});
