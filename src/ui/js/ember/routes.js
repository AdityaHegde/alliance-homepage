GOTAA.IndexRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return this.store.findById('profile', '1');
  },

  afterModel : function(model, transition) {
    var serializer = this.store.serializerFor("module"),
        globalPerms = GOTAA.GlobalData.get("permissions");

    GOTAA.GlobalData.set("profile", model);
    meta = this.store.metadataFor("profile");
    GOTAA.GlobalData.set("allianceName", meta.alliance.name);
    if(meta.alliance.name) {
      document.title = meta.alliance.name;
    }
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
          globalPerms.pushObject(this.store.push("permission", {
            id : GOTAA.Permission.Operations[i],
            oprn : GOTAA.Permission.Operations[i],
            permission : 2,
          }));
        }
      }
    }

    GOTAA.GlobalData.set("logoutUrl", meta.logoutUrl);

    if(transition.targetName === 'index.index') {
      this.transitionTo('alliance');
    }
  },
});

GOTAA.AllianceRoute = Ember.Route.extend({
  model : function(params, transtion) {
    if(GOTAA.GlobalData.get("allianceName")) {
      return this.store.findById('alliance', '1');
    }
    else {
      return this.store.createRecord('alliance');
    }
  },

  afterModel : function(model, transition) {
    GOTAA.GlobalData.set("members", this.store.find("member"));
  },
});

GOTAA.DashboardRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return this.store.findById('dashboard', '1');
  },

  afterModel : function(model, transition) {
    GOTAA.GlobalData.set("members", this.store.find("member"));
    GOTAA.GlobalData.set("challenges", this.store.find("challenges-list-data"));
    GOTAA.GlobalData.set("pollVotes", this.store.find("poll-vote"));
  },
});

GOTAA.ProfileRoute = Ember.Route.extend({
  setupController : function(controller, model) {
    controller.set("model", model);
    if(!(GOTAA.GlobalData.get("profile") && GOTAA.GlobalData.get("profile").get("gotaname"))) {
      controller.set("isEditing", true);
    }
  },

  model : function(params, transtion) {
    return GOTAA.GlobalData.get("profile");
  },
});

GOTAA.ProfileCamptargetRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return Ember.Object.create({
      camps : this.store.find('camp'),
      contributions : this.store.find('camp-member-item'),
    });
  },
});

GOTAA.PermissionRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return GOTAA.GlobalData.get("permissions");
  },
});
