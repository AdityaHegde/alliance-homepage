Views = Ember.Namespace.create();

Views.ModuleView = Ember.View.extend({
  classNames : ['panel', 'panel-default'],
  moduleObj : null,
  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{view.moduleObj.title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if GOTAA.CurrentProfile.canEditData}}' +
        '<div class="btn-toolbar">' +
          '<button class="btn btn-default btn-sm" {{action "addData" view.moduleObj}}>Add Data</button>' +
          '<button class="btn btn-default btn-sm" {{action "editModule" view.moduleObj}}>Edit Module</button>' +
        '</div>' +
      '{{/if}}' +
      '{{yield}}' +
    '</div>'),
});

Views.ModuleSideView = Views.ModuleView.extend({
  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if GOTAA.CurrentProfile.canEditData}}' +
        '<div class="btn-toolbar">' +
          '<button class="btn btn-default btn-sm" {{action "addData" view.moduleObj}}>Add Data</button>' +
          '<button class="btn btn-default btn-sm" {{action "editModule" view.moduleObj}}>Edit Module</button>' +
        '</div>' +
      '{{/if}}' +
      '<div class="list-group">' +
        '{{#each view.moduleObj.data}}' +
          '<a class="list-group-item module-data">' +
            '{{#if GOTAA.CurrentProfile.canEditData}}' +
              '<div class="edit-toolbar">' +
                '<span class="btn btn-link btn-edit" {{action "editData" this view.moduleObj}}><span class="glyphicon glyphicon-pencil"></span></span>' +
                '<span class="btn btn-link btn-delete" {{action "deleteData" this view.moduleObj}}><span class="glyphicon glyphicon-trash"></span></span>' +
              '</div>' +
            '{{/if}}' +
            '<h4 class="list-group-item-heading">{{title}}</h4>' +
            '{{yield}}' +
          '</a>' +
        '{{/each}}' +
      '</div>' +
    '</div>'),
});

Views.SimpleListView = Views.ModuleSideView.extend({
  template : Ember.Handlebars.compile('' +
    '<p class="list-group-item-text">{{desc}}</p>'),
});

Views.ListInListView = Views.ModuleSideView.extend({
  template : Ember.Handlebars.compile('' +
    '<p class="list-group-item-text">' +
      '{{#each datalist}}' +
        '<div><div class="col-md-6 col-md-inner col-md-label">{{label}}</div><div class="col-md-6 col-md-inner">{{data}}</div></div>' +
      '{{/each}}' +
      '<div class="clearfix"></div>' +
    '</p>'),
});

Views.ChallengesView = Views.ModuleSideView.extend({
  template : Ember.Handlebars.compile('' +
    '<p class="list-group-item-text">{{#if status}}Starts at {{startsAt}}{{else}}Started!{{/if}}</p>'),
});

Views.MembersView = Views.ModuleSideView.extend({
  template : Ember.Handlebars.compile('' +
    '<p class="list-group-item-text">{{name}}</p>'),
});

Views.FeedView = Views.ModuleView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#view Collapsible.CollapsibleGroup groupId="feed-group" data=view.moduleObj.data}}' +
      '{{#each view.data}}' +
        '{{#view Collapsible.Collapsible title=title groupId="feed-group" collapseId=feedId}}' +
          '{{desc}}' +
        '{{/view}}' +
      '{{/each}}' +
    '{{/view}}'),
});
