GOTAA = Ember.Application.create({
  rootElement : "#gota-alliance",
  ready : function() {
    $(".ember-application").removeClass("ember-application");
  },
});

var
attr = DS.attr;

GOTAA.Router.map(function() {
  this.resource('index', { path : '' }, function() {
    this.resource('home', { path : 'home' });
    this.resource('profile', { path : 'profile' });
  });
});

Ember.TextField.reopen({
  attributeBindings: ['autofocus']
});

Ember.Handlebars.registerBoundHelper('create-view', function(viewName, options) {
  return Ember.Handlebars.ViewHelper.helper(options.contexts[options.contexts.length - 1], viewName, options);
});
