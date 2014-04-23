var attr = DS.attr, hasMany = DS.hasMany, belongsTo = DS.belongsTo;

GOTAA.ModuleData = DS.Model.extend({
  title : attr(),
  desc : attr(),
  module : belongsTo("module"),
});
GOTAA.ModuleData.keys = ['id'];
GOTAA.ModuleData.apiName = 'moduleData';
GOTAA.ModuleData.queryParams = ['id', 'modId', 'modType'];
GOTAA.ModuleData.findParams = ['modId', 'modType'];
GOTAA.ModuleData.ignoreFieldsOnCreateUpdate = ['module'];
GOTAA.ModuleData.retainId = true;
GOTAA.Module = DS.Model.extend({
  moduleData : hasMany("module-data", {async : true}),
  title : attr(),
  desc : attr(),
  type : attr(),
  col : attr('number', {defaultValue : 0}),
  row : attr('number', {defaultValue : 0}),
  viewObj : Views.SimpleListView,
  expandedView : Views.ModuleExpandedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Module.keys = ['id'];
GOTAA.Module.apiName = 'module';
GOTAA.Module.queryParams = ['id'];
GOTAA.Module.ignoreFieldsOnCreateUpdate = ['moduleData'];
GOTAA.Module.retainId = true;

GOTAA.Image = DS.Model.extend({
  name : attr(),
  data : attr(),
  feedData : belongsTo("feed-data"),
});
GOTAA.FeedData = GOTAA.ModuleData.extend({
  feedId : attr(),
  module : belongsTo("feed"),
  //image : belongsTo("image"),
  //image : attr(),
});
GOTAA.FeedData.keys = ['id'];
GOTAA.FeedData.apiName = 'moduleData';
GOTAA.FeedData.queryParams = ['id', 'modId', 'modType'];
GOTAA.FeedData.findParams = ['modId', 'modType'];
GOTAA.FeedData.ignoreFieldsOnCreateUpdate = ['module'];
GOTAA.FeedData.retainId = true;
GOTAA.Feed = GOTAA.Module.extend({
  moduleData : hasMany("feed-data", {async : true}),
  viewObj : Views.FeedView,
  expandedView : Views.ModuleExpandedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Feed.keys = ['id'];
GOTAA.Feed.apiName = 'module';
GOTAA.Feed.queryParams = ['id'];
GOTAA.Feed.ignoreFieldsOnCreateUpdate = ['moduleData'];
GOTAA.Feed.retainId = true;

GOTAA.DayMap = {
  "0" : "Sun",
  "1" : "Mon",
  "2" : "Tue",
  "3" : "Wed",
  "4" : "Thu",
  "5" : "Fri",
  "6" : "Sat",
};
GOTAA.ChallengeData = GOTAA.ModuleData.extend({
  challengeStatus : attr(),
  startsAt : attr(),
  module : belongsTo("challenge"),
  startsAtString : Ember.computed("startsAt", function(key, value) {
    if(arguments.length > 1) {
      this.set("startsAt", new Date(value).valueOf());
      return value;
    }
    else {
      var startsAt = this.get("startsAt"), d = new Date(startsAt);
      return (d == "Invalid Date" ? "" : d.toLocaleTimeString() + " " + d.toLocaleDateString());
    }
  }),
  statusString : Ember.computed("challengeStatus", "startsAtString", function() {
    var challengeStatus = this.get("challengeStatus");
    if(challengeStatus > 1) {
      return {
        2 : "Started - Waiting to fill",
        3 : "Started - Swing Away!",
        4 : "Ended",
      }[challengeStatus];
    }
    else {
      return "Starts at "+this.get("startsAtString");
    }
  }),
  first : attr(),
  second : attr(),
  third : attr(),
  hasWinners : function() {
    return this.get("challengeStatus") === 4;
  }.property("challengeStatus"),
});
GOTAA.ChallengeData.keys = ['id'];
GOTAA.ChallengeData.apiName = 'moduleData';
GOTAA.ChallengeData.queryParams = ['id', 'modId', 'modType'];
GOTAA.ChallengeData.findParams = ['modId', 'modType'];
GOTAA.ChallengeData.ignoreFieldsOnCreateUpdate = ['module'];
GOTAA.ChallengeData.retainId = true;
GOTAA.Challenge = GOTAA.Module.extend({
  moduleData : hasMany("challenge-data", {async : true}),
  viewObj : Views.ChallengesView,
  expandedView : Views.ChallengesExpandedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Challenge.keys = ['id'];
GOTAA.Challenge.apiName = 'module';
GOTAA.Challenge.queryParams = ['id'];
GOTAA.Challenge.ignoreFieldsOnCreateUpdate = ['moduleData'];
GOTAA.Challenge.retainId = true;

GOTAA.CampData = GOTAA.ModuleData.extend({
  type : attr('string', {defaultValue : "Battle"}),
  fromlevel : attr('number', {defaultValue : 1}),
  tolevel : attr('number', {defaultValue : 1}),
  total : attr(),
  completed : attr(),
  title : function() {
    return this.get("type") + " (" + this.get("fromlevel") + " - " + this.get("tolevel") + ")";
  }.property('type', 'fromlevel', 'tolevel'),
  hrefId : function() {
    return "#"+this.get("id");
  }.property('type', 'fromlevel', 'tolevel'),
  order : attr('number', {defaultValue : 0}),
  campItems : hasMany('camp-item', {async : true}),
  module : belongsTo("camp"),
});
GOTAA.CampData.keys = ['id'];
GOTAA.CampData.apiName = 'moduleData';
GOTAA.CampData.queryParams = ['id', 'modId', 'modType'];
GOTAA.CampData.findParams = ['modId', 'modType'];
GOTAA.CampData.ignoreFieldsOnCreateUpdate = ['campItems', 'module'];
GOTAA.Camp = GOTAA.Module.extend({
  moduleData : hasMany("camp-data", {async : true}),
  viewObj : Views.CampTargetView,
  expandedView : Views.CampTargetExpandedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Camp.keys = ['id'];
GOTAA.Camp.apiName = 'module';
GOTAA.Camp.queryParams = ['id'];
GOTAA.Camp.ignoreFieldsOnCreateUpdate = ['moduleData'];

GOTAA.CampItem = DS.Model.extend({
  item : attr(),
  qty : attr(),
  completed : attr(),

  contribute : function(key, value) {
    if(arguments.length > 1) {
      return value;
    }
  }.property(),
  crafting : function(key, value) {
    if(arguments.length > 1) {
      return value;
    }
  }.property(),

  camp : belongsTo('camp'),
});
GOTAA.CampItem.keys = ['item', 'camp'];
GOTAA.CampItem.apiName = 'campitem';
GOTAA.CampItem.queryParams = ['item'];
GOTAA.CampItem.ignoreFieldsOnCreateUpdate = ['camp'];

GOTAA.CampMemberItem = DS.Model.extend({
  email : attr(),
  item : attr(),
  qty : attr(),
});
GOTAA.CampMemberItem.keys = ['email', 'item'];
GOTAA.CampMemberItem.apiName = 'campmemberitem';
GOTAA.CampMemberItem.queryParams = ['email', 'item', 'type', 'fromlevel', 'tolevel'];
//GOTAA.CampMemberItem.ignoreFieldsOnCreateUpdate = ['camp'];

GOTAA.MemberListData = GOTAA.ModuleData.extend({
  email : attr(),
  memberObj : Ember.computed("email", "GOTAA.GlobalData.members.@each.email", function() {
    return GOTAA.GlobalData.get("members").findBy("email", this.get("email"));
  }),
  module : belongsTo("member-list"),
  isUser : Ember.computed("email", "GOTAA.GlobalData.profile.email", function() {
    var user = GOTAA.GlobalData.get("profile").get("email"),
        email = this.get("email");
    return user === email;
  }),
});
GOTAA.MemberListData.keys = ['id'];
GOTAA.MemberListData.apiName = 'moduleData';
GOTAA.MemberListData.queryParams = ['id', 'modId', 'modType'];
GOTAA.MemberListData.findParams = ['modId', 'modType'];
GOTAA.MemberListData.ignoreFieldsOnCreateUpdate = ['module'];
GOTAA.MemberListData.retainId = true;
GOTAA.MemberList = GOTAA.Module.extend({
  moduleData : hasMany("member-list-data", {async : true}),
  viewObj : Views.MemberListView,
  expandedView : Views.MemberListExtendedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.MemberList.keys = ['id'];
GOTAA.MemberList.apiName = 'module';
GOTAA.MemberList.queryParams = ['id'];
GOTAA.MemberList.ignoreFieldsOnCreateUpdate = ['moduleData'];
GOTAA.MemberList.retainId = true;

GOTAA.ModuleObjectMap = {
  module : "module",
  challenge : "challenge",
  feed : "feed",
  camp : "camp",
  "member-list" : "member-list",
};
GOTAA.ModuleDataObjectMap = {
  module : "module-data",
  challenge : "challenge-data",
  feed : "feed-data",
  camp : "camp-data",
  "member-list" : "member-list-data",
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

  members : [],
});
GOTAA.Dashboard.keys = ['id'];
GOTAA.Dashboard.apiName = 'dashboard';
GOTAA.Dashboard.queryParams = ['id'];

GOTAA.PermissionMap = {
  3 : "Admin",
  2 : "Leader",
  1 : "Officer",
  0 : "Member",
};
GOTAA.Profile = DS.Model.extend({
  email : attr(),
  gotaname : attr(),
  name : function() {
    return this.get("gotaname") || this.get("email");
  }.property('gotaname', 'email'),
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
    return permission >= 2;
  }.property("permission"),
  alliance : belongsTo("alliance"),
});
GOTAA.Member.keys = ['email'];
GOTAA.Member.apiName = 'member';
GOTAA.Member.queryParams = ['email'];
GOTAA.Member.ignoreFieldsOnCreateUpdate = ['alliance'];

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
});
GOTAA.Alliance.keys = ['id'];
GOTAA.Alliance.apiName = 'alliance';
GOTAA.Alliance.queryParams = ['id'];
GOTAA.Alliance.ignoreFieldsOnCreateUpdate = ['members'];

GOTAA.GlobalDataObject = Ember.Object.extend({
  permissions : [],
  editableModules : [],
  profile : null,
  members : [],

  canEdit : function() {
    var profile = this.get("profile"), permissions = this.get("permissions");
    for(var i = 0; i < permissions.length; i++) {
      this.set("canEdit"+permissions[i].get("oprn"), permissions[i].get("permission") <= profile.get("permission") || profile.get("permission") === 2);
    }
  }.observes("permissions.@each.permission", "profile"),
});
GOTAA.GlobalData = GOTAA.GlobalDataObject.create();
