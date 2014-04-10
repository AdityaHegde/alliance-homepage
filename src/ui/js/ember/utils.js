Utils = Ember.Namespace.create();

Utils.hasMany = function(modelClass) {
  modelClass = modelClass || Ember.Object;
  var ret = function(key, newval) {
    if(Ember.typeOf(modelClass) == 'string') {
      var split = modelClass.split("."), e = window;
      for(var i = 0; i < split.length; i++) {
        e = e[split[i]];
      }
      if(!e) return [];
      modelClass = e;
    }
    if(arguments.length > 1) {
      if(newval.length) {
        for(var i = 0; i < newval.length; i++) {
          if(!(newval[i] instanceof modelClass)) newval.splice(i, 1, modelClass.create(newval[i]));
        }
      }
      return newval;
    }
  }.property();
  return ret;
};

Utils.arrayOf = function(modelClass, arrayObj) {
  for(var i = 0; i < arrayObj.length; i++) {
    arrayObj[i] = modelClass.create(arrayObj[i]);
  }
  return Ember.A(arrayObj);
};

Utils.getId = function(record, type) {
  var keys = type.keys || [], ids = [];
  for(var i = 0; i < keys.length; i++) {
    ids.push((record.get && record.get(keys[i])) || record[keys[i]]);
  }
  return ids.join("__");
};

Utils.backupDataMap = {};
Utils.backupData = function(record, type) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = Ember.copy(record.get("data")), id = Utils.getId(record, type) || "new";
  Ember.merge(data, record._attributes);
  Ember.merge(data, record._inFlightAttributes);
  Utils.backupDataMap[type.typeKey] = Utils.backupDataMap[type.typeKey] || {};
  Utils.backupDataMap[type.typeKey][id] = data;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(Utils.backupData(item, relationship.type));
        }, this);
      }
    }
  }, {data : data, record : record});
  if(Utils.customBackup[type.typeKey]) {
    Utils.customBackup[type.typeKey](record, type, data);
  }
  return data;
};

Utils.retrieveBackup = function(hash, type, hasId) {
  var id = (hasId && Utils.getId(hash, type)) || "new";
  if(Utils.backupDataMap[type.typeKey] && Utils.backupDataMap[type.typeKey][id]) {
    var data = Utils.backupDataMap[type.typeKey][id];
    delete Utils.backupDataMap[type.typeKey][id];
    Ember.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      var da = this.data[relationship.key], ha = this.hash[relationship.key];
      for(var i = 0; i < da.length; i++) {
        var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
        da[i].id = Utils.getId(da[i], relationship.type);
        if(ele) Ember.merge(ele, da[i]);
        else ha.push(da[i]);
      }
    }, {data : data, hash : hash});
  }
  if(Utils.customRetrieve[type.typeKey]) {
    Utils.customRetrieve[type.typeKey](hash, type, data);
  }
  return hash;
};

Utils.customBackup = {
  config : function(record, type, data) {
    data.slotObjects = record.get("slotObjects");
  },
};

Utils.customRetrieve = {
  config : function(hash, type, data) {
    hash.slots = hash.slotObjects || hash.slots;
    delete hash.slotObjects;
  },
};

Utils.saveRecord = function(record, type) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    if(!record.get("isDeleted")) {
      record.eachAttribute(function(attr) {
        var val = this.get(attr);
        if(Ember.typeOf(val) === "string") {
          val = val.replace(/^\s*/, "");
          val = val.replace(/\s*$/, "");
          this.set(attr, val);
        }
      }, record);
    }
    if(record.get("isDirty")) {
      record.save().then(function(data) {
        resolve(data);
      }, function(message) {
        record.rollback();
        reject(message.message || message.statusText || message);
      });
    }
    else {
      resolve(record);
    }
  });
};

Utils.forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    return record.reload();
  }
  else {
    return store.find(type, id);
  }
};
