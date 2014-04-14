Views = Ember.Namespace.create();

Views.ModuleView = Ember.View.extend({
  classNames : ['panel', 'panel-default'],
  moduleObj : null,
  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{view.moduleObj.title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if view.canEdit}}' +
        '<div class="btn-toolbar">' +
          '<button class="btn btn-default btn-sm" {{action "addData" view.moduleObj}}>Add Data</button>' +
          '<button class="btn btn-default btn-sm" {{action "editModule" view.moduleObj}}>Edit Module</button>' +
        '</div>' +
      '{{/if}}' +
      '{{yield}}' +
    '</div>'),

  modulePermissions : function() {
    return GOTAA.GlobalData && GOTAA.GlobalData.get("editableModules").filterBy("moduleId", this.get("moduleObj").get("id"));
  }.property("GOTAA.GlobalData.editableModules.@each"),

  canEdit : function() {
    if(GOTAA.GlobalData) {
      var modulePermissions = this.get("modulePermissions"),
          permission = modulePermissions.findBy("email", GOTAA.GlobalData.get("profile").get("email"));
      return GOTAA.GlobalData.canEditModuleData || !Ember.isEmpty(permission);
    }
    return false;
  }.property("modulePermissions", "GOTAA.GlobalData.profile.email"),
});

Views.ModuleSideView = Views.ModuleView.extend({
  layout : Ember.Handlebars.compile('' +
    '<div class="panel-heading"><h3 class="panel-title">{{title}}</h3></div>' +
    '<div class="panel-body">' +
      '{{#if view.canEdit}}' +
        '<div class="btn-toolbar">' +
          '<button class="btn btn-default btn-sm" {{action "addData" view.moduleObj}}>Add Data</button>' +
          '<button class="btn btn-default btn-sm" {{action "editModule" view.moduleObj}}>Edit Module</button>' +
          '{{#if GOTAA.GlobalData.profile.isLeader}}' +
            '<button class="btn btn-default btn-sm" data-toggle="modal" data-target="#add-user-window" {{action "editModulePermission" view}}>Assign Members</button>' +
          '{{/if}}' +
        '</div>' +
      '{{/if}}' +
      '<div class="list-group">' +
        '{{#each view.moduleObj.moduleData}}' +
          '<a class="list-group-item module-data">' +
            '{{#if view.canEdit}}' +
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
    '<p class="list-group-item-text">{{#if status}}Started!{{else}}Starts at {{startsAt}}{{/if}}</p>'),
});

Views.MembersView = Views.ModuleSideView.extend({
  template : Ember.Handlebars.compile('' +
    '<p class="list-group-item-text">{{name}}</p>'),
});

Views.FeedView = Views.ModuleView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#view Collapsible.CollapsibleGroup groupId="feed-group" data=view.moduleObj.moduleData}}' +
      '{{#each view.data}}' +
        '{{#view Collapsible.Collapsible title=title groupId="feed-group" collapseId=id}}' +
          '{{desc}}' +
        '{{/view}}' +
      '{{/each}}' +
    '{{/view}}'),
});
