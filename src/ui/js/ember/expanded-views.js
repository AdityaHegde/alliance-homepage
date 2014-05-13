Views.ModuleExpandedView = Modal.ModalWindow.extend({
  moduleObj : null,
  moduleShortView : null,
  layout : Ember.Handlebars.compile('' +
    '<div class="modal-dialog" {{bind-attr style="view.widthStyle"}}>' +
      '<div class="modal-content">' +
        '<div class="modal-header">' +
          '<h4 class="modal-title" {{bind-attr id="view.titleid"}}>{{view.title}}</h4>' +
          '<div class="edit-toolbar">' +
            '{{#if view.moduleShortView.canEdit}}' +
              '<span class="btn btn-link btn-sm btn-edit-toolbar" {{action "addData" view.moduleObj}}>{{#tool-tip title="Add Data"}}<span class="glyphicon glyphicon-plus"></span>{{/tool-tip}}</span>' +
              '<span class="btn btn-link btn-sm btn-edit-toolbar" {{action "editModule" view.moduleObj}}>{{#tool-tip title="Edit Module"}}<span class="glyphicon glyphicon-pencil"></span>{{/tool-tip}}</span>' +
              '{{#if GOTAA.GlobalData.profile.isLeader}}' +
                '<a class="btn btn-link btn-sm btn-edit-toolbar" data-toggle="modal" data-target="#add-user-window" {{action "editModulePermission" view}}>{{#tool-tip title="Assign Members"}}<span class="glyphicon glyphicon-user"></span>{{/tool-tip}}</a>' +
              '{{/if}}' +
            '{{else}}' +
              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
            '{{/if}}' +
          '</div>' +
        '</div>' +
        '<div class="modal-body">' +
          '<p>{{view.moduleObj.desc}}</p>' +
          '{{yield}}' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button type="button" class="btn btn-default cancel-btn" data-dismiss="modal">Close</button>' +
        '</div>' +
      '</div>' +
    '</div>'),

  template : Ember.Handlebars.compile('' +
    '<div class="list-group">' +
      '{{#each view.moduleObj.moduleData}}' +
        '<a class="list-group-item module-data">' +
          '{{#if view.moduleShortView.canEdit}}' +
            '<div class="edit-toolbar">' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "editData" this view.moduleObj}}>{{#tool-tip title="Edit Data"}}<span class="glyphicon glyphicon-pencil"></span>{{/tool-tip}}</span>' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "deleteData" this view.moduleObj}}>{{#tool-tip title="Delete Data"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>' +
            '</div>' +
          '{{/if}}' +
          '<h4 class="list-group-item-heading">{{title}}</h4>' +
          '<p class="list-group-item-text">{{desc}}</p>' +
        '</a>' +
      '{{else}}' +
        'Empty!' +
      '{{/each}}' +
    '</div>'),

  closeWindow : function() {
    var moduleObj = this.get("moduleObj"), moduleShortView = this.get("moduleShortView");
    moduleObj.reload();
    moduleShortView.set("expanded", false);
    this.destroy();
  },

  didInsertElement : function() {
    var that = this;
    $(this.get("element")).modal('show');
    $(this.get("element")).on("hidden.bs.modal", function(e) {
      that.closeWindow();
    });
  },

});

Views.ChallengesExpandedView = Views.ModuleExpandedView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="list-group">' +
      '{{#each view.moduleObj.moduleData}}' +
        '<a class="list-group-item module-data">' +
          '{{#if view.moduleShortView.canEdit}}' +
            '<div class="edit-toolbar">' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "editData" this view.moduleObj}}>{{#tool-tip title="Edit Data"}}<span class="glyphicon glyphicon-pencil"></span>{{/tool-tip}}</span>' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "deleteData" this view.moduleObj}}>{{#tool-tip title="Delete Data"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>' +
            '</div>' +
          '{{/if}}' +
          '<h4 class="list-group-item-heading">{{title}}</h4>' +
          '<p class="list-group-item-text">{{statusString}}</p>' +
          '{{#if hasWinners}}' +
            '<div class="list-group-item-text">First ({{challengeDataObj.first}}) : {{firstName}} {{#if canAddFirst}}<span class="btn btn-link btn-placement" {{action "addSelfToPos" this view.moduleObj "first"}}>{{#tool-tip title="Add Self"}}<span class="glyphicon glyphicon-plus"></span>{{/tool-tip}}</span>{{/if}}{{#if placedFirst}}<span class="btn btn-link btn-placement" {{action "removeSelfFromPos" this view.moduleObj "first"}}>{{#tool-tip title="Remove Self"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>{{/if}}</div>' +
            '<div class="list-group-item-text">Second ({{challengeDataObj.second}}) : {{secondName}} {{#if canAddSecond}}<span class="btn btn-link btn-placement" {{action "addSelfToPos" this view.moduleObj "second"}}>{{#tool-tip title="Add Self"}}<span class="glyphicon glyphicon-plus"></span>{{/tool-tip}}</span>{{/if}}{{#if placedSecond}}<span class="btn btn-link btn-placement" {{action "removeSelfFromPos" this view.moduleObj "second"}}>{{#tool-tip title="Remove Self"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>{{/if}}</div>' +
            '<div class="list-group-item-text">Third ({{challengeDataObj.third}}) : {{thirdName}} {{#if canAddThird}}<span class="btn btn-link btn-placement" {{action "addSelfToPos" this view.moduleObj "third"}}>{{#tool-tip title="Add Self"}}<span class="glyphicon glyphicon-plus"></span>{{/tool-tip}}</span>{{/if}}{{#if placedThird}}<span class="btn btn-link btn-placement" {{action "removeSelfFromPos" this view.moduleObj "third"}}>{{#tool-tip title="Remove Self"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>{{/if}}</div>' +
          '{{/if}}' +
        '</a>' +
      '{{else}}' +
        'Empty!' +
      '{{/each}}' +
    '</div>'),
});

Views.CampTargetExpandedView = Views.ModuleExpandedView.extend({
  init : function() {
    this._super();
    this.get("controller").store.find('camp-member-item');
  },

  template : Ember.Handlebars.compile('' +
    '{{#with view as moduleView}}' +
      '{{#view Collapsible.CollapsibleGroup groupId="campTarget"}}' +
        '{{#each md in moduleView.moduleObj.moduleData}}' +
          '<div class="panel panel-default">' +
            '<div class="panel-heading">' +
              '<h4 class="panel-title">' +
                '<div>' +
                  '<h4 class="panel-title group-item-heading">' +
                    '<a class="group-item-name" data-toggle="collapse" data-parent="#campTarget" {{bind-attr href="md.hrefId"}}>' +
                      '{{#tool-tip tagName="span" title="Click to open" placement="right" data=md}}{{view.data.title}}{{/tool-tip}}' +
                    '</a>' +
                  '</h4>' +
                '</div>' +
                '<div class="total-progress">' +
                  '{{progress-bar maxVal=md.total val=md.completedMorphed}}' +
                '</div>' +
              '</h4>' +
            '</div>' +
            '<div {{bind-attr id="md.id"}} class="panel-collapse collapse">' +
              '<div class="panel-body">' +
                '{{#each ci in md.campItems}}' +
                  '<div>' +
                    '{{ci.item}}' +
                    '{{#if ci.crafting}}' +
                      '<span>{{view Ember.TextField value=moduleView.campMemItm.qty}}</span>' +
                      '<a class="btn btn-link btn-sm" {{action "submitCraft" ci md moduleView}}>Submit</a>' +
                      '<a class="btn btn-link btn-sm" {{action "cancelCraft" ci md moduleView}}>Cancel</a>' +
                    '{{else}}' +
                      '<a class="btn btn-link btn-sm" {{action "contribute" ci md moduleView}}>Contribute</a>' +
                    '{{/if}}' +
                  '</div>' +
                  '{{progress-bar maxVal=ci.qty val=ci.completed}}' +
                '{{/each}}' +
              '</div>' +
            '</div>' +
          '</div>' +
        '{{/each}}' +
      '{{/view}}' +
    '{{/with}}'),

  campMemItm : null,
  crafting : false,
});

Views.MemberListExtendedView = Views.ModuleExpandedView.extend({
  template : Ember.Handlebars.compile('' +
    '<div class="list-group">' +
      '{{#each view.moduleObj.moduleData}}' +
        '<a class="list-group-item module-data">' +
          '{{#if view.moduleShortView.canEdit}}' +
            '<div class="edit-toolbar">' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "editData" this view.moduleObj}}>{{#tool-tip title="Edit Data"}}<span class="glyphicon glyphicon-pencil"></span>{{/tool-tip}}</span>' +
              '<span class="btn btn-link btn-edit-toolbar" {{action "deleteData" this view.moduleObj}}>{{#tool-tip title="Delete Data"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>' +
            '</div>' +
          '{{/if}}' +
          '<h4 class="list-group-item-heading">{{memberObj.name}}</h4>' +
          '<p class="list-group-item-text">{{desc}}</p>' +
        '</a>' +
      '{{else}}' +
        'Empty!' +
      '{{/each}}' +
    '</div>'),
});

Views.PollExtendedView = Views.ModuleExpandedView.extend({
  template : Ember.Handlebars.compile('' +
    '{{#with view as moduleView}}' +
      '{{#view Collapsible.CollapsibleGroup groupId=moduleView.moduleObj.id id=moduleView.moduleObj.id}}' +
        '{{#each moduleView.moduleObj.moduleData}}' +
          '<div class="feed-item">' +
            '{{#view Collapsible.Collapsible title=title groupId=moduleView.moduleObj.id collapseId=id}}' +
              '{{#each pollOptions}}' +
                '<div>' +
                  '-- {{title}} --' +
                '</div>' +
              '{{/each}}' +
            '{{/view}}' +
            '{{#if moduleView.canEdit}}' +
              '<div class="edit-toolbar">' +
                '<span class="btn btn-link btn-edit-toolbar" {{action "editData" this moduleView.moduleObj}}>{{#tool-tip title="Edit Data"}}<span class="glyphicon glyphicon-pencil"></span>{{/tool-tip}}</span>' +
                '<span class="btn btn-link btn-edit-toolbar" {{action "deleteData" this moduleView.moduleObj}}>{{#tool-tip title="Delete Data"}}<span class="glyphicon glyphicon-trash"></span>{{/tool-tip}}</span>' +
              '</div>' +
            '{{/if}}' +
          '</div>' +
        '{{else}}' +
          'Empty!' +
        '{{/each}}' +
      '{{/view}}' +
    '{{/with}}'),
});
