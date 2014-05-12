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
  canMarkEnded : Ember.computed("challengeStatus", function() {
    var challengeStatus = this.get("challengeStatus");
    return challengeStatus === 3;
  }),
  first : attr(),
  second : attr(),
  third : attr(),
  hasWinners : function() {
    return this.get("challengeStatus") === 4;
  }.property("challengeStatus"),
  challengeDataObj : Ember.computed("title", "GOTAA.GlobalData.challenges.@each", function() {
    var title = this.get("title"), challenges = GOTAA.GlobalData.get("challenges");
    return challenges.findBy("name", title);
  }),
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

GOTAA.ChallengesListData = DS.Model.extend({
  name : attr(),
  first : attr(),
  second : attr(),
  third : attr(),
});
GOTAA.ChallengesListData.keys = ['name'];
GOTAA.ChallengesListData.apiName = 'challengeslistdata';
GOTAA.ChallengesListData.queryParams = ['name'];
GOTAA.ChallengesListData.findParams = ['name'];


GOTAA.CampData = GOTAA.ModuleData.extend({
  type : attr('string', {defaultValue : "Battle"}),
  fromlevel : attr('number', {defaultValue : 1}),
  tolevel : attr('number', {defaultValue : 1}),
  total : attr(),
  completed : attr(),
  completedMorphed : function() {
    var campItems = this.get("campItems"), completed = this.get("completed"),
        completedItems = this.get("campItems").reduce(function(s, itm) {return s + Number(itm.get("completed"))}, 0);
    return campItems.get("length") > 0 ? completedItems : completed;
  }.property('completed', 'campItems.@each.completed'),
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

GOTAA.LastTransaction = DS.Model.extend({
  camp : attr(),
  item : attr(),
  qty : attr(),
  //campMemberItem : belongsTo("camp-member-item"),
});
GOTAA.LastTransaction.keys = ['camp', 'item'];
GOTAA.CampMemberItem = DS.Model.extend({
  email : attr(),
  item : attr(),
  qty : attr(),
  lastTransactions : hasMany("last-transaction", {async : true}),
  lastTransactionsArrayDidChange : function() {
    var lastTransactions = this.get("lastTransactions");
    lastTransactions.forEach(function(item) {
      var campItem = item.store.getById("camp-item", item.get("item")+"__"+item.get("camp"));
      campItem.set("completed", Number(campItem.get("completed")) + Number(item.get("qty")));
    });
  }.observes("lastTransactions.@each"),
});
GOTAA.CampMemberItem.keys = ['email', 'item'];
GOTAA.CampMemberItem.apiName = 'campmemberitem';
GOTAA.CampMemberItem.queryParams = ['email', 'item', 'type', 'fromlevel', 'tolevel'];
GOTAA.CampMemberItem.ignoreFieldsOnCreateUpdate = ['lastTransactions'];


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


GOTAA.PollVote = DS.Model.extend({
  email : attr(),
  optId : attr(),
  pollId : attr(),
});
GOTAA.PollVote.keys = ['email', 'optId'];
GOTAA.PollVote.apiName = 'pollvote';
GOTAA.PollVote.queryParams = ['email', 'optId'];
GOTAA.PollVote.findParams = ['email', 'optId'];
GOTAA.PollVote.ignoreFieldsOnCreateUpdate = [''];

GOTAA.PollOption = DS.Model.extend({
  title : attr(),
  optId : attr(),
  pollData : belongsTo("poll-data"),
  isVoted : Ember.computed("optId", "GOTAA.GlobalData.profile.email", "GOTAA.GlobalData.pollVotes.@each.optId", "GOTAA.GlobalData.pollVotes.@each.email", function(key, value) {
    var optId = this.get("optId")+"", pollData = this.get("pollData"),
        email = GOTAA.GlobalData && GOTAA.GlobalData.get("profile") && GOTAA.GlobalData.get("profile").get("email"),
        pollVotes = GOTAA.GlobalData.get("pollVotes"), vote = pollVotes.filterBy("optId", optId).filterBy("email", email)[0];
    if(arguments.length === 1) {
      if(optId && email && vote) {
        return true;
      }
      return false;
    }
    else {
      if(value && !vote) {
        otherVote = pollVotes.filterBy("pollId", pollData.get("id")).filterBy("email", email)[0];
        GOTAA.saveRecord(this.store.createRecord("poll-vote", {
          email : email,
          optId : optId,
          pollId : pollData.get("id"),
        }));
        if(!pollData.get("multiVote")) {
          otherVote.deleteRecord();
          GOTAA.saveRecord(otherVote);
        }
      }
      else if(vote) {
        vote.deleteRecord();
        GOTAA.saveRecord(vote);
      }
      return value;
    }
  }),
  votes : Ember.computed("optId", "GOTAA.GlobalData.pollVotes.@each.optId", function() {
    var optId = this.get("optId");
    if(optId) {
      GOTAA.GlobalData.get("pollVotes").filterBy("optId", optId);
    }
    return [];
  }),
});
GOTAA.PollOption.keys = ['optId'];
GOTAA.PollOption.apiName = 'polloption';
GOTAA.PollOption.queryParams = ['optId'];
GOTAA.PollOption.findParams = ['optId'];
GOTAA.PollOption.ignoreFieldsOnCreateUpdate = [''];

GOTAA.PollData = GOTAA.ModuleData.extend({
  pollOptions : hasMany("poll-option", {async : true}),
  multiVote : attr(),
  editable : attr(),
  module : belongsTo("poll"),
  addEntryHook : function(prop) {
    return this.store.createRecord("poll-option");
  },
});
GOTAA.PollData.keys = ['id'];
GOTAA.PollData.apiName = 'moduleData';
GOTAA.PollData.queryParams = ['id', 'modId', 'modType'];
GOTAA.PollData.findParams = ['modId', 'modType'];
GOTAA.PollData.ignoreFieldsOnCreateUpdate = ['module'];
GOTAA.PollData.retainId = true;

GOTAA.Poll = GOTAA.Module.extend({
  moduleData : hasMany("poll-data", {async : true}),
  viewObj : Views.PollView,
  expandedView : Views.PollExtendedView,
  dashboard : belongsTo("dashboard"),
});
GOTAA.Poll.keys = ['id'];
GOTAA.Poll.apiName = 'module';
GOTAA.Poll.queryParams = ['id'];
GOTAA.Poll.ignoreFieldsOnCreateUpdate = ['moduleData'];
GOTAA.Poll.retainId = true;


GOTAA.ModuleObjectMap = {
  module : "module",
  challenge : "challenge",
  feed : "feed",
  camp : "camp",
  "member-list" : "member-list",
  poll : "poll",
};
GOTAA.ModuleDataObjectMap = {
  module : "module-data",
  challenge : "challenge-data",
  feed : "feed-data",
  camp : "camp-data",
  "member-list" : "member-list-data",
  poll : "poll-data",
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
GOTAA.Talent = DS.Model.extend({
  profile : belongsTo('profile'),
  talent : attr(),
});
GOTAA.Talent.keys = ['talent'];
GOTAA.Profile = DS.Model.extend({
  email : attr(),
  gotaname : attr(),
  profileImg : attr(),
  name : function() {
    return this.get("gotaname") || this.get("email");
  }.property('gotaname', 'email'),
  permission : attr(),
  permissionFull : function() {
    var permission = this.get("permission");
    return GOTAA.PermissionMap[permission];
  }.property("permission"),
  isLeader : function() {
    return this.get("permission") >= 2;
  }.property("permission"),
  bday_month : attr(),
  bday_month_str : Ember.computed("bday_month", function() {
    var bday_month = Number(this.get("bday_month"));
    return (bday_month && GOTAA.ColumnDataMap.profile[1].options.findBy("val", bday_month).label);
  }),
  bday_date : attr(),
  //'s' added to handle ember-data's pluralize
  linage : attr(),
  fealty : attr(),
  talents : hasMany('talent'),
  timezone : attr(),
  gotafrlink : attr(),
  addEntryHook : function(prop) {
    return this.store.createRecord("talent");
  },
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
  bday_month : attr(),
  bday_month_str : Ember.computed("bday_month", function() {
    var bday_month = Number(this.get("bday_month"));
    return (bday_month && GOTAA.ColumnDataMap.profile[1].options.findBy("val", bday_month).label);
  }),
  bday_date : attr(),
  //'s' added to handle ember-data's pluralize
  fealty : attr(),
  timezone : attr(),
  gotafrlink : attr(),
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
  pollVotes : [],
  profile : null,
  members : [],
  challenges : [],

  canEdit : function() {
    var profile = this.get("profile"), permissions = this.get("permissions");
    for(var i = 0; i < permissions.length; i++) {
      this.set("canEdit"+permissions[i].get("oprn"), permissions[i].get("permission") <= profile.get("permission") || profile.get("permission") === 2);
    }
  }.observes("permissions.@each.permission", "profile"),
});
GOTAA.GlobalData = GOTAA.GlobalDataObject.create();
