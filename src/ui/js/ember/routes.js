GOTAA.IndexRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return this.store.findById('profile', '0');
  },

  afterModel : function(model, transition) {
    GOTAA.CurrentProfile = model;
    meta = this.store.metadataFor("profile");
    GOTAA.GlobalData.set("allianceName", meta.alliance.name)
    GOTAA.GlobalData.set("allianceMotto", meta.alliance.motto)
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
    return GOTAA.CurrentProfile;
  },
});
