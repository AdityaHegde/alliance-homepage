GOTAA.ApplicationAdapter = DS.RESTAdapter.extend({
  getQueryParams : function(type, query, record, inBody) {
    var extraParams = {};
    for(var i = 0; i < type.queryParams.length; i++) {
      extraParams[type.queryParams[i]] = record.get(type.queryParams[i]) || GOTAA.GlobalData.get(type.queryParams[i]);
      //find a better way to handle this (primary key shudnt be sent during create request)
      if(query[type.queryParams[i]] == 'all') delete query[type.queryParams[i]];
    }
    //delete generated field
    delete query.id;
    if(inBody) {
      //only sent for create / update
      if(type.ignoreFieldsOnCreateUpdate) {
        for(var i = 0; i < type.ignoreFieldsOnCreateUpdate.length; i++) {
          delete query[type.ignoreFieldsOnCreateUpdate[i]];
        }
      }
      var bodyParams = {data : query};
      Ember.merge(bodyParams, extraParams);
      return bodyParams;
    }
    else {
      Ember.merge(query, extraParams);
    }
    return query;
  },

  buildFindQuery : function(type, id, query) {
    var keys = type.keys || [], ids = id.split("__");
    for(var i = 0; i < keys.length; i++) {
      query[keys[i]] = (ids.length > i ? ids[i] : "");
    }
    return query;
  },

  buildURL : function(type, id) {
    var ty = (Ember.typeOf(type) == 'string' ? type : type.apiName || type.typeKey), url = '/' + ty;
    return url;
  },

  createRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    GOTAA.backupData(record, type, true);
    return this.ajax(this.buildURL(type)+"/create", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  find : function(store, type, id) {
    return this.ajax(this.buildURL(type, id)+"/get", 'GET', { data : this.buildFindQuery(type, id, {}) });
  },

  findAll : function(store, type) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET');
  },

  findQuery : function(store, type, query) {
    return this.ajax(this.buildURL(type)+"/getAll", 'GET', { data : query });
  },

  updateRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    GOTAA.backupData(record, type);
    return this.ajax(this.buildURL(type)+"/update", 'POST', { data : this.getQueryParams(type, data, record, true) });
  },

  deleteRecord : function(store, type, record) {
    var data = this.serialize(record, { includeId: true });
    return this.ajax(this.buildURL(type)+"/delete", 'GET', { data : this.getQueryParams(type, {}, record) });
  },
});

GOTAA.ApplicationSerializer = DS.RESTSerializer.extend({
  /*keyForRelationship : function(key, relationship) {
    this._super(key, relationship);
  },*/

  serializeRelations : function(type, payload, data) {
    type.eachRelationship(function(name, relationship) {
      var plural = Ember.String.pluralize(relationship.type.typeKey);
      this.payload[plural] = this.payload[plural] || [];
      if(this.data[relationship.key]) {
        if(relationship.kind === "hasMany") {
          for(var i = 0; i < this.data[relationship.key].length; i++) {
            this.serializer.serializeRelations(relationship.type, payload, this.data[relationship.key][i]);
            this.data[relationship.key][i] = this.serializer.normalize(relationship.type, this.data[relationship.key][i], relationship.type.typeKey);
            this.payload[plural].push(this.data[relationship.key][i]);
            if(relationship.options.polymorphic) {
              //TODO : make the type customizable
              this.serializer.store.push(GOTAA.ModelMap[relationship.type.typeKey][this.data[relationship.key][i].type], this.data[relationship.key][i]);
              this.data[relationship.key][i] = {
                id : this.data[relationship.key][i].id,
                type : GOTAA.ModelMap[relationship.type.typeKey][this.data[relationship.key][i].type],
              };
            }
            else {
              var type = (GOTAA.ModelMap[relationship.type.typeKey] && GOTAA.ModelMap[relationship.type.typeKey][data.type]) || relationship.type.typeKey;
              this.serializer.store.push(type, this.data[relationship.key][i]);
              this.data[relationship.key][i] = this.data[relationship.key][i].id;
            }
          }
        }
      }
    }, {payload : payload, data : data, serializer : this});
  },

  extractSingle : function(store, type, payload, id, requestType) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");
    if(Ember.typeOf(payload.result.data) == 'array') payload.result.data = payload.result.data[0];

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[type.typeKey] = payload.result.data || {};
    GOTAA.retrieveBackup(payload[type.typeKey], type, requestType !== 'createRecord');
    this.serializeRelations(type, payload, payload[type.typeKey]);
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractArray : function(store, type, payload, id, requestType) {
    var plural = Ember.String.pluralize(type.typeKey);
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    if(!payload || !payload.result) throw new Ember.Error("No data returned");

    var metadata = Ember.copy(payload.result);
    delete metadata.data;
    store.metaForType(type, metadata);

    payload[plural] = payload.result.data || [];
    for(var i = 0; i < payload[plural].length; i++) {
      GOTAA.retrieveBackup(payload[plural][i], type, requestType !== 'createRecord');
      this.serializeRelations(type, payload, payload[plural][i]);
    }
    delete payload.result;

    return this._super(store, type, payload, id, requestType);
  },

  extractDeleteRecord : function(store, type, payload) {
    if(payload.result.status == 1) throw new Ember.Error(payload.result.message);
    return null;
  },

  extractCreateRecord : function(store, type, payload) {
    return this.extractSingle(store, type, payload, null, "createRecord");
  },

  extractFindHasMany : function(store, type, payload) {
    return this._super(store, type, payload);
  },

  extract : function(store, type, payload, id, requestType) {
    return this._super(store, type, payload, id, requestType);
  },

  normalize : function(type, hash, prop) {
    //generate id property for ember data
    hash.id = GOTAA.getId(hash, type);
    this.normalizeAttributes(type, hash);
    this.normalizeRelationships(type, hash);

    this.normalizeUsingDeclaredMapping(type, hash);

    if (this.normalizeHash && this.normalizeHash[prop]) {
      this.normalizeHash[prop](hash);
    }

    return hash;
  },

  normalizeHash : {
    alliance : function(json) {
      json.id = "0";
      return json;
    },

    member : function(json) {
      json.allaince = "0";
      return json;
    },

    dashboard : function(json) {
      json.id = "0";
      return json;
    },

    module : function(json) {
      json.dashboard_id = "0";
      json.dashboard_type = json.type;
      return json;
    },
  },

  serialize : function(record, options) {
    var json = this._super(record, options);

    if (this.serializeHash && this.serializeHash[record.__proto__.constructor.typeKey]) {
      this.serializeHash[record.__proto__.constructor.typeKey](record, json);
    }

    return json;
  },

  serializeHash : {
    dashboard : function(record, json) {
      return json;
    },
  },

  serializeHasMany : function(record, json, relationship) {
    var key = relationship.key;

    var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    json[key] = record.get(key);
    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      json[key] = json[key].mapBy('id');
    }
    else if (relationshipType === 'manyToOne') {
      json[key] = json[key].map(function(r) {
        return this.serialize(r, {});
      }, this);
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    //do nothing!
  },

  typeForRoot : function(root) {
    if(/data$/.test(root)) {
      return root;
    }
    return Ember.String.singularize(root);
  }
});

GOTAA.getId = function(record, type) {
  var id = record.id;
  if(!id) {
    var keys = type.keys || [], ids = [];
    for(var i = 0; i < keys.length; i++) {
      ids.push((record.get && record.get(keys[i])) || record[keys[i]]);
    }
    return ids.join("__");
  }
  else {
    return id;
  }
};

GOTAA.backupDataMap = {};
GOTAA.backupData = function(record, type, create) {
  //TODO : make 'new' into a custom new tag extracted from 'type'
  var data = record.toJSON(), id = (!create && GOTAA.getId(record, type)) || (create && "new");
  GOTAA.backupDataMap[type.typeKey] = GOTAA.backupDataMap[type.typeKey] || {};
  GOTAA.backupDataMap[type.typeKey][id] = data;
  for(var i = 0; i < type.keys.length; i++) {
    if(Ember.isEmpty(data[type.keys[i]])) delete data[type.keys[i]];
  }
  type.eachRelationship(function(name, relationship) {
    var a = record.get(relationship.key);
    if(a) {
      if(relationship.kind == 'hasMany') {
        this.data[relationship.key] = [];
        a.forEach(function(item) {
          this.data[relationship.key].push(GOTAA.backupData(item, relationship.type));
        }, this);
      }
    }
  }, {data : data, record : record});
  if(GOTAA.customBackup[type.typeKey]) {
    GOTAA.customBackup[type.typeKey](record, type, data);
  }
  return data;
};

GOTAA.retrieveBackup = function(hash, type, hasId) {
  var id = (hasId && GOTAA.getId(hash, type)) || "new";
  if(GOTAA.backupDataMap[type.typeKey] && GOTAA.backupDataMap[type.typeKey][id]) {
    var data = GOTAA.backupDataMap[type.typeKey][id];
    delete GOTAA.backupDataMap[type.typeKey][id];
    Ember.merge(hash, data);
    type.eachRelationship(function(name, relationship) {
      var da = this.data[relationship.key], ha = this.hash[relationship.key];
      if(da) {
        for(var i = 0; i < da.length; i++) {
          var ele = ha.findBy(relationship.type.keys[0], da[i][relationship.type.keys[0]]);
          da[i].id = GOTAA.getId(da[i], relationship.type);
          if(ele) Ember.merge(ele, da[i]);
          else ha.push(da[i]);
        }
      }
    }, {data : data, hash : hash});
  }
  if(GOTAA.customRetrieve[type.typeKey]) {
    GOTAA.customRetrieve[type.typeKey](hash, type, data);
  }
  return hash;
};

GOTAA.customBackup = {
  config : function(record, type, data) {
    data.slotObjects = record.get("slotObjects");
  },
};

GOTAA.customRetrieve = {
  config : function(hash, type, data) {
    hash.slots = hash.slotObjects || hash.slots;
    delete hash.slotObjects;
  },
};

GOTAA.saveRecord = function(record, type) {
  return new Ember.RSVP.Promise(function(resolve, reject) {
    if(record.get("validationFailed")) {
      reject("Validation Failed. Check all fields.");
    }
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
      new Ember.RSVP.Promise(function(resolve, reject) {
        record.save().then(function(data) {
          resolve(data);
        }, function(message) {
          record.rollback();
          reject(message.message || message.statusText || message);
        });
      }).then(function(data) {
        resolve(data);
      }, function(message) {
        reject(message.message || message.statusText || message);
      });
    }
    else {
      resolve(record);
    }
  });
};

GOTAA.forceReload = function(store, type, id) {
  if(store.recordIsLoaded(type, id)) {
    var record = store.recordForId(type, id);
    return record.reload();
  }
  else {
    return store.find(type, id);
  }
};
