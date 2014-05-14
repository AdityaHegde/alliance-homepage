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
    this.resource('permission', { path : 'permission' });
    this.resource('help', { path : 'help' });
    this.resource('admin', { path : 'admin' });
  });
});

Ember.TextField.reopen({
  attributeBindings: ['autofocus']
});

Ember.Handlebars.registerBoundHelper('create-view', function(viewName, options) {
  return Ember.Handlebars.ViewHelper.helper(options.contexts[options.contexts.length - 1], viewName, options);
});

Ember.Handlebars.registerBoundHelper('format', function(data) {
  if(data) {
    data = data.replace(/\n/g, "<br/>");
    return new Handlebars.SafeString(data);
  }
  return "";
});
