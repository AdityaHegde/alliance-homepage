GOTAA.BaseObject = Ember.Object.extend({
  userName : "",
  userMail : "",
});

GOTAA.ModuleDataObject = Ember.Object.extend({
  title : "",
  desc : "",
  idNum : null,
});
GOTAA.ModuleObject = Ember.Object.extend({
  init : function() {
    this._super();
    if(!this.get("data")) {
      this.set("data", []);
    }
  },

  data : Utils.hasMany(GOTAA.ModuleDataObject),
  title : "",
  type : "",
  row : 0,
  col : 0,
  idNum : null,
  viewObj : Views.SimpleListView,
});

GOTAA.ListInListElementObject = Ember.Object.extend({
  label : "",
  data : "",
});
GOTAA.ListInListDataObject = GOTAA.ModuleObject.extend({
  dataList : Utils.hasMany(GOTAA.ListInListElementObject),
});
GOTAA.ListInListObject = GOTAA.ModuleObject.extend({
  data : Utils.hasMany(GOTAA.ListInListDataObject),
  viewObj : Views.ListInListView,
});

GOTAA.MemberDataObject = GOTAA.ModuleObject.extend({
  title : Ember.computed.alias('gotaname'),
  gotaname : "",
  name : "",
});
GOTAA.MemberObject = GOTAA.ModuleObject.extend({
  data : Utils.hasMany(GOTAA.MemberDataObject),
  viewObj : Views.MembersView,
});

GOTAA.FeedDataObject = GOTAA.ModuleObject.extend({
  feedId : "",
});
GOTAA.FeedObject = GOTAA.ModuleObject.extend({
  data : Utils.hasMany(GOTAA.FeedDataObject),
  viewObj : Views.FeedView,
});

GOTAA.ChallengeDataObject = GOTAA.ModuleObject.extend({
  status : 0,
  startsAt : "",
});
GOTAA.ChallengeObject = GOTAA.ModuleObject.extend({
  data : Utils.hasMany(GOTAA.ChallengeDataObject),
  viewObj : Views.ChallengesView,
});

GOTAA.ModuleObjectMap = {
  simpleList : GOTAA.ModuleObject,
  listInList : GOTAA.ListInListObject,
  members : GOTAA.MemberObject,
  challenge : GOTAA.ChallengeObject,
  feed : GOTAA.FeedObject,
};
GOTAA.ModuleDataObjectMap = {
  simpleList : GOTAA.ModuleDataObject,
  listInList : GOTAA.ListInListDataObject,
  members : GOTAA.MemberDataObject,
  challenge : GOTAA.ChallengeDataObject,
  feed : GOTAA.FeedDataObject,
};

GOTAA.ModuleColumn = Ember.Object.extend({
  init : function() {
    this._super();
    this.set("modules", []);
  },
  modules : [],
});

GOTAA.HomeObject = Ember.Object.extend({
  modules : Utils.hasMany(null, GOTAA.ModuleObjectMap, "type"),
  modulesArray : function() {
    var modules = this.get("modules"), modulesArray = [], col = 0,
        curModuleCol = GOTAA.ModuleColumn.create(),
        curModuleColModules = curModuleCol.get("modules");
    for(var i = 0; i < modules.length; i++) {
      if(col !== modules[i].get("col")) {
        col++;
        modulesArray.pushObject(curModuleCol);
        curModuleCol = GOTAA.ModuleColumn.create();
        curModuleColModules = curModuleCol.get("modules");
      }
      curModuleColModules.pushObject(modules[i]);
    }
    modulesArray.pushObject(curModuleCol);
    return modulesArray;
  }.property('modules.@each'),
  leftBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray[0];
  }.property('modulesArray.@each'),
  centerBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray[1];
  }.property('modulesArray.@each'),
  rightBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray[2];
  }.property('modulesArray.@each'),
});

GOTAA.PermissionMap = {
  L : "Leader",
  O : "Officer",
  M : "Member",
};
GOTAA.ProfileObject = Ember.Object.extend({
  email : "",
  gotaname : "",
  permission : "",
  permissionFull : function() {
    var permission = this.get("permission");
    return GOTAA.PermissionMap[permission];
  }.property("permission"),
  canEditData : function() {
    return /L/.test(this.get("permission"));
  }.property("permission"),
});
GOTAA.CurrentProfile = null;
