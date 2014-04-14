var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

GOTAA.ModuleData = DS.Model.extend({
  title : attr(),
  desc : attr(),
  module : belongsTo("module"),
});
GOTAA.ModuleData.keys = ['id'];
GOTAA.ModuleData.apiName = 'moduleData';
GOTAA.ModuleData.queryParams = ['id', 'modId', 'modType'];
GOTAA.Module = DS.Model.extend({
  moduleData : hasMany("module-data", {async : true}),
  title : attr(),
  type : attr(),
  col : attr('number', {defaultValue : 0}),
  viewObj : Views.SimpleListView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Module.keys = ['id'];
GOTAA.Module.apiName = 'module';
GOTAA.Module.queryParams = ['id'];
GOTAA.Module.ignoreFieldsOnCreateUpdate = ['moduleData'];

/*GOTAA.ListInListElement = DS.Model.extend({
  label : attr(),
  data : attr(),
});
GOTAA.ListInListData = DS.Model.extend({
  dataList : Utils.hasMany(GOTAA.ListInListElement, {async: true}),
});
GOTAA.ListInList = DS.Model.extend({
  moduleData : hasMany(GOTAA.ListInListData),
  viewObj : Views.ListInListView,
});*/

GOTAA.FeedData = GOTAA.ModuleData.extend({
  feedId : attr(),
  module : belongsTo("feed"),
});
GOTAA.FeedData.keys = ['id'];
GOTAA.FeedData.apiName = 'moduleData';
GOTAA.FeedData.queryParams = ['id', 'modId', 'modType'];
GOTAA.Feed = GOTAA.Module.extend({
  moduleData : hasMany("feed-data", {async : true}),
  viewObj : Views.FeedView,
});
GOTAA.Feed.keys = ['id'];
GOTAA.Feed.apiName = 'module';
GOTAA.Feed.queryParams = ['id'];
GOTAA.Feed.ignoreFieldsOnCreateUpdate = ['moduleData'];

GOTAA.ChallengeData = GOTAA.ModuleData.extend({
  started : 0,
  startsAt : attr(),
  module : belongsTo("challenge"),
});
GOTAA.ChallengeData.keys = ['id'];
GOTAA.ChallengeData.apiName = 'moduleData';
GOTAA.ChallengeData.queryParams = ['id', 'modId', 'modType'];
GOTAA.Challenge = GOTAA.Module.extend({
  moduleData : hasMany("challenge-data", {async : true}),
  viewObj : Views.ChallengesView,
});
GOTAA.Challenge.keys = ['id'];
GOTAA.Challenge.apiName = 'module';
GOTAA.Challenge.queryParams = ['id'];
GOTAA.Challenge.ignoreFieldsOnCreateUpdate = ['moduleData'];

GOTAA.ModuleObjectMap = {
  module : "module",
  //listInList : GOTAA.ListInList,
  challenge : "challenge",
  feed : "feed",
};
GOTAA.ModuleDataObjectMap = {
  module : "module-data",
  //listInList : GOTAA.ListInListData,
  challenge : "challenge-data",
  feed : "feed-data",
};

GOTAA.ModuleColumn = Ember.Object.extend({
  init : function() {
    this._super();
    this.set("modules", []);
  },
  modules : [],
  col : 0,
});

GOTAA.ModelMap = {
  module : GOTAA.ModuleObjectMap,
  "module-data" : GOTAA.ModuleDataObjectMap,
};

GOTAA.Dashboard = DS.Model.extend({
  modules : hasMany("module", {polymorphic : true}),
  modulesArray : Ember.computed('modules.@each', function() {
    var modules = this.get("modules"), modulesArray = [], col = 0,
        curModuleCol = GOTAA.ModuleColumn.create(),
        curModuleColModules = curModuleCol.get("modules");
    for(var i = 0; i < modules.content.length; i++) {
      if(col !== modules.content[i].get("col")) {
        col = modules.content[i].get("col");
        modulesArray.pushObject(curModuleCol);
        curModuleCol = GOTAA.ModuleColumn.create({col : col});
        curModuleColModules = curModuleCol.get("modules");
      }
      curModuleColModules.pushObject(modules.content[i]);
    }
    modulesArray.pushObject(curModuleCol);
    return modulesArray;
  }),
  leftBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray.findBy('col', 0);
  }.property('modulesArray.@each'),
  centerBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray.findBy('col', 1);
  }.property('modulesArray.@each'),
  rightBar : function() {
    var modulesArray = this.get("modulesArray");
    return modulesArray && modulesArray.findBy('col', 2);
  }.property('modulesArray.@each'),
});
GOTAA.Dashboard.keys = ['id'];
GOTAA.Dashboard.apiName = 'dashboard';
GOTAA.Dashboard.queryParams = ['id'];

GOTAA.PermissionMap = {
  2 : "Leader",
  1 : "Officer",
  0 : "Member",
};
GOTAA.Profile = DS.Model.extend({
  email : attr(),
  gotaname : attr(),
  permission : attr(),
  permissionFull : function() {
    var permission = this.get("permission");
    return GOTAA.PermissionMap[permission];
  }.property("permission"),
  isLeader : function() {
    return this.get("permission") === 2;
  }.property("permission"),
});
GOTAA.Profile.keys = ['email'];
GOTAA.Profile.apiName = 'profile';
GOTAA.Profile.queryParams = ['email'];

GOTAA.CurrentProfile = null;

GOTAA.Member = DS.Model.extend({
  gotaname : attr(),
  email : attr(),
  name : function() {
    return this.get("gotaname") || this.get("email");
  }.property('gotaname', 'email'),
  status : attr(),
  permission : attr(),
  permissionFull : function() {
    var permission = this.get("permission");
    return GOTAA.PermissionMap[permission];
  }.property("permission"),
  isLeader : function() {
    var permission = this.get("permission");
    return permission == 2;
  }.property("permission"),
  alliance : belongsTo("alliance"),
});
GOTAA.Member.keys = ['email'];
GOTAA.Member.apiName = 'member';
GOTAA.Member.queryParams = ['email'];

GOTAA.Permission = DS.Model.extend({
  oprn : attr(),
  permission : attr(),
  permissionFull : function() {
    var permission = this.get("permission");
    return GOTAA.PermissionMap[permission];
  }.property("permission"),
});
GOTAA.Permission.keys = ['oprn'];
GOTAA.Permission.apiName = 'permission';
GOTAA.Permission.queryParams = ['oprn'];
GOTAA.Permission.Operations = [
  'Alliance',
  'Member',
  'Module',
  'ModuleData',
];

GOTAA.ModulePermission = DS.Model.extend({
  email : attr(),
  moduleId : attr(),
});
GOTAA.ModulePermission.keys = ['email', 'moduleId'];
GOTAA.ModulePermission.apiName = 'modulepermission';
GOTAA.ModulePermission.queryParams = ['email', 'moduleId'];

GOTAA.Alliance = DS.Model.extend({
  name : attr(),
  motto : attr(),

  members : hasMany('member'),
});
GOTAA.Alliance.keys = ['id'];
GOTAA.Alliance.apiName = 'alliance';
GOTAA.Alliance.queryParams = ['id'];
GOTAA.Alliance.ignoreFieldsOnCreateUpdate = ['members'];

GOTAA.GlobalDataObject = Ember.Object.extend({
  permissions : [],
  editableModules : [],
  profile : null,

  canEdit : function() {
    var profile = this.get("profile"), permissions = this.get("permissions");
    for(var i = 0; i < permissions.length; i++) {
      this.set("canEdit"+permissions[i].get("oprn"), permissions[i].get("permission") <= profile.get("permission") || profile.get("permission") === 2);
    }
  }.observes("permissions.@each.permission", "profile"),
});
GOTAA.GlobalData = GOTAA.GlobalDataObject.create();
