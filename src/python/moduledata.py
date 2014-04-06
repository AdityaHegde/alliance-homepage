from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2
import member
import response
import json
import re

#TODO : Use user_id instead of email

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
    idNum = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()
    type = ndb.StringProperty()
    col = ndb.IntegerProperty()

def get_module(id):
    module = 0
    modules = Model.query(Module.idNum == id)
    for m in modules:
        module = m
    return module

def save_module(data, id):
    if id:
        module = get_module(id)
        module.populate(**data)
    else:
        module = Module()
        module.populate(**data)
        module.idNum = get_free_id()
    module.put()
    logging.warn(module)
    return module


class SimpleModuleData(ndb.Model):
    idNum = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()

class ListItemModuleData(ndb.Model):
    label = ndb.StringProperty()
    data = ndb.StringProperty()

class ListModuleData(ndb.Model):
    idNum = ndb.IntegerProperty()
    title = ndb.StringProperty()
    dataList = ndb.StructuredProperty(ListItemModuleData, repeated=True)

class ChallengeModuleData(ndb.Model):
    idNum = ndb.IntegerProperty()
    title = ndb.StringProperty()
    startsAt = ndb.StringProperty()
    status = ndb.IntegerProperty()

class FeedData(ndb.Model):
    idNum = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()


moduleTypeToClassMap = {
    "simpleList" : SimpleModuleData,
    "listInList" : ListItemModuleData,
    "members" : member.Member,
    "challenge" : ChallengeModuleData,
    "feed" : FeedData,
}

def get_module_data(moduleKey, moduleClass, id):
    #return moduleClass.query(moduleClass.idNum == id, ancestor=moduleKey).get()
    return moduleClass.query(moduleClass.idNum == id).get()

def save_module_data(moduleKey, moduleClass, data, id):
    if id:
        moduleData = get_module_data(moduleKey, moduleClass, id)
        #attribute not present error is thrown if idNum is retained.
        data.pop("idNum", None);
        moduleData.populate(**data)
    else:
        moduleData = moduleClass(parent=moduleKey)
        moduleData.populate(**data)
        moduleData.idNum = get_free_id()
    moduleData.put()
    logging.warn(moduleData)
    return moduleData


def validate_user_and_leader(self, callback):
    user = users.get_current_user()
    if user:
        if member.is_leader(user.email()):
            callback(self)
        else:
            self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))
    else:
        self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))


def create_module_handler(self):
    moduleData = json.loads(self.request.POST['data'])
    logging.warning(moduleData)
    moduleObj = save_module(moduleData, 0)
    self.response.out.write(json.dumps(response.success("success", {"id" : moduleObj.idNum})))

class CreateModuleRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        validate_user_and_leader(self, create_module_handler)


def create_module_data_handler(self):
    moduleId = int(self.request.POST['id'])
    moduleType = self.request.POST['type']
    moduleData = json.loads(self.request.POST['data'])
    moduleKey = ndb.Key('Module', moduleId)
    moduleDataObj = save_module_data(moduleKey, moduleTypeToClassMap[moduleType], moduleData, 0)
    self.response.out.write(json.dumps(response.success("success", {"id" : moduleDataObj.idNum})))


class CreateModuleDataRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        validate_user_and_leader(self, create_module_data_handler)


def save_module_handler(self):
    moduleId = self.request.POST['id']
    moduleData = json.loads(self.request.POST['data'])
    moduleObj = save_module(moduleData, moduleId)
    self.response.out.write(json.dumps(response.success("success", {"id" : moduleObj['idNum']})))

class SaveModuleRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        validate_user_and_leader(self, save_module_handler)


def save_module_data_handler(self):
    moduleId = self.request.POST['id']
    moduleType = self.request.POST['type']
    moduleData = json.loads(self.request.POST['data'])
    moduleDataId = moduleData['idNum']
    moduleKey = ndb.Key('Module', moduleId)
    moduleDataObj = save_module_data(moduleKey, moduleTypeToClassMap[moduleType], moduleData, moduleDataId)
    self.response.out.write(json.dumps(response.success("success", {"id" : moduleDataId})))


class SaveModuleDataRequest(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        validate_user_and_leader(self, save_module_data_handler)


class GetFullData(webapp2.RequestHandler):

    def post(self):
        user = users.get_current_user()
        self.response.headers['Content-Type'] = 'application/json' 
        if user:
            memberObj = member.get_member_by_email(user.email())
            if memberObj:
                data = convert_query_to_dict(Module.query().order(Module.col).fetch())
                for d in data:
                    moduleKey = ndb.Key('Module', d['idNum'])
                    d['data'] = convert_query_to_dict(moduleTypeToClassMap[d['type']].query().fetch()) 
                self.response.out.write(json.dumps(response.success("success", data)))
            else:
                self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))
        else:
            self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))


def delete_module_data_handler(self):
    moduleDataId = int(self.request.get("id"))
    moduleType = self.request.get("type")
    moduleClass = moduleTypeToClassMap[moduleType]
    moduleDataObj = moduleClass.query(moduleClass.idNum == moduleDataId).get()
    moduleDataObj.key.delete()
    self.response.out.write(json.dumps(response.success("success", {})))


class DeleteModuleDataRequest(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        validate_user_and_leader(self, delete_module_data_handler)
