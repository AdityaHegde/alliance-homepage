GOTAA = Ember.Application.create({
  rootElement : "#gota-alliance",
});

var
attr = DS.attr;

GOTAA.Router.map(function() {
  this.resource('index', { path : '' }, function() {
    this.resource('alliance', { path : 'alliance' });
    this.resource('dashboard', { path : 'dashboard' });
    this.resource('profile', { path : 'profile' });
  });
});

Ember.TextField.reopen({
  attributeBindings: ['autofocus']
});

Ember.Handlebars.registerBoundHelper('create-view', function(viewName, options) {
  return Ember.Handlebars.ViewHelper.helper(options.contexts[options.contexts.length - 1], viewName, options);
});
