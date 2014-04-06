GOTAA.IndexRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax({url : "/page_data"}).done(function(retdata) {
        if(retdata.status === "0") {
          GOTAA.CurrentProfile = GOTAA.ProfileObject.create(retdata.data.profile);
          resolve(GOTAA.BaseObject.create(retdata.data));
        }
        else {
          reject(retdata.message);
        }
      }).fail(function(message) {
        //reject(message);
        resolve(GOTAA.BaseObject.create({userName : "anonymous"}));
      });
    });
  },

  afterModel : function(model, transition) {
    if(transition.targetName === 'index.index') {
      this.transitionTo('home');
    }
  },
});

GOTAA.HomeRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax({url : "/data", method : "POST"}).done(function(retdata) {
        if(retdata.status === "0") {
          resolve(GOTAA.HomeObject.create({modules : retdata.data}));
        }
        else {
          reject(retdata.message);
        }
      }).fail(function(message) {
        reject(message);
      });
    });
  },
});

GOTAA.ProfileRoute = Ember.Route.extend({
  model : function(params, transtion) {
    return GOTAA.CurrentProfile;
  },
});
