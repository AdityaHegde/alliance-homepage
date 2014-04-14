from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2
import member
import response
import json
import re

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class UsedId(ndb.Model):
    idNum = ndb.IntegerProperty()

def get_free_id():
    breakWhile = 0
    idNum = UsedId.query().order(-UsedId.idNum).get()
    if not idNum:
        idNum = 1
    elif idNum == 1048576:
        idNum = 1
    else:
        idNum = idNum.idNum
        idNum += 1
        breakWhile = 1
    while breakWhile == 0:
        if UsedId.query(UsedId.idNum == idNum).count() > 0:
            idNum += 1
        else:
            breakWhile = 1

    obj = UsedId(idNum = idNum)
    obj.put()
    return idNum


class Module(ndb.Model):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()
    type = ndb.StringProperty()
    col = ndb.IntegerProperty()

def get_module(id):
    return Module.query(Module.id == id).get()

def save_module(data, id):
    if id:
        module = get_module(id)
        module.populate(**data)
    else:
        module = Module()
        module.populate(**data)
        module.id = get_free_id()
    module.put()
    logging.warn(module)
    return module


class SimpleModuleData(ndb.Model):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()

class ListItemModuleData(ndb.Model):
    label = ndb.StringProperty()
    data = ndb.StringProperty()

class ListModuleData(ndb.Model):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    dataList = ndb.StructuredProperty(ListItemModuleData, repeated=True)

class ChallengeModuleData(ndb.Model):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    startsAt = ndb.StringProperty()
    started = ndb.IntegerProperty()

class FeedData(ndb.Model):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()


moduleTypeToClassMap = {
    "module" : SimpleModuleData,
    #"listInList" : ListItemModuleData,
    #"members" : member.Member,
    "challenge" : ChallengeModuleData,
    "feed" : FeedData,
}

def get_module_data(moduleKey, moduleClass, id):
    #return moduleClass.query(moduleClass.id == id, ancestor=moduleKey).get()
    return moduleClass.query(moduleClass.id == id).get()


class CreateModuleRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Module")

        if memberObj:
            params = json.loads(self.request.body)
            moduleData = params['data']
            moduleObj = Module()
            moduleObj.populate(**moduleData)
            moduleObj.id = get_free_id()
            moduleObj.put()
            logging.warn(moduleObj)

            self.response.out.write(json.dumps(response.success("success", {"id" : moduleObj.id})))


class UpdateModuleRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Module")

        if memberObj:
            params = json.loads(self.request.body)
            moduleData = params['data']
            moduleId = int(params['id'])
            moduleData.pop("id", None)

            moduleObj = get_module(moduleId)
            moduleObj.populate(**moduleData)
            moduleObj.put()
            logging.warn(moduleObj)

            self.response.out.write(json.dumps(response.success("success", {"id" : moduleId})))


class CreateModuleDataRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "ModuleData")

        if memberObj:
            params = json.loads(self.request.body)
            moduleData = params['data']
            moduleId = int(params['modId'])
            moduleType = params['modType']
            moduleKey = ndb.Key('Module', moduleId)

            moduleDataClass = moduleTypeToClassMap[moduleType]
            moduleDataObj = moduleDataClass(parent=moduleKey)
            moduleDataObj.populate(**moduleData)
            moduleDataObj.id = get_free_id()
            moduleDataObj.put()
            logging.warn(moduleData)

            self.response.out.write(json.dumps(response.success("success", {"id" : moduleDataObj.id})))


class UpdateModuleDataRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "ModuleData")

        if memberObj:
            params = json.loads(self.request.body)
            moduleData = params['data']
            moduleId = int(params['modId'])
            moduleType = params['modType']

            moduleKey = ndb.Key('Module', moduleId)
            moduleDataId = int(params['id'])
            moduleData.pop("id", None);

            moduleDataClass = moduleTypeToClassMap[moduleType]
            moduleDataObj = get_module_data(moduleKey, moduleDataClass, moduleDataId)
            moduleDataObj.populate(**moduleData)
            moduleDataObj.put()
            logging.warn(moduleData)

            self.response.out.write(json.dumps(response.success("success", {"id" : moduleDataId})))


class GetDashboardData(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)
        if memberObj:
            data = convert_query_to_dict(Module.query().order(Module.col).fetch())
            for d in data:
                moduleKey = ndb.Key('Module', d['id'])
                d['moduleData'] = convert_query_to_dict(moduleTypeToClassMap[d['type']].query(ancestor=moduleKey).fetch()) 
            self.response.out.write(json.dumps(response.success("success", {"modules" : data})))


class DeleteModuleDataRequest(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "ModuleData")

        if memberObj:
            moduleDataId = int(self.request.get("id"))
            moduleType = self.request.get("modType")
            moduleClass = moduleTypeToClassMap[moduleType]
            moduleDataObj = moduleClass.query(moduleClass.id == moduleDataId).get()
            moduleDataObj.key.delete()
            self.response.out.write(json.dumps(response.success("success", {})))

