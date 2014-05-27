from google.appengine.api import users
from google.appengine.ext import ndb

import modelbase
import logging
import webapp2
import member
import permission
import response
import json
import re
import camps
import datetime

def convert_query_to_dict(query, exclude=[]):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class MemberModulePermission(ndb.Model):
    user_id = ndb.IntegerProperty()

class Module(modelbase.ModelBase):
    id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()
    type = ndb.StringProperty()
    col = ndb.IntegerProperty()
    row = ndb.IntegerProperty()
    canViewMembers = ndb.StructuredProperty(MemberModulePermission, repeated=True)
    hasRestrictedView = ndb.ComputedProperty(lambda self: len(self.canViewMembers) > 0)
    canEditMembers = ndb.StructuredProperty(MemberModulePermission, repeated=True)
    moduleData = ndb.KeyProperty(repeated=True)

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, int(data['id']))

    @classmethod
    def get_last_row(model, col):
        modelObj = model.query(model.col == col).order(-model.row).get()
        logging.warn(modelObj)
        if modelObj:
            return modelObj.row + 1
        else:
            return 0

    @classmethod
    def create_model(model, data):
        idNum = modelbase.UsedId.create_model({})
        key = model.get_key_from_data({ "id" : idNum.idNum })
        data.pop("id", None)
        modelObj = model(key=key)
        modelObj.populate(**data)
        modelObj.id = idNum.idNum
        modelObj.row = model.get_last_row(modelObj.col)
        modelObj.put()
        return modelObj

    @classmethod
    def update_model(model, data):
        modelObj = model.query_model(data)
        data.pop("id", None)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj

    @classmethod
    def get_all_short(model, handler):
        #retData = convert_query_to_dict(model.query().order(model.col, model.row).fetch(), ["canViewMembers"])
        retData = convert_query_to_dict(model.query(ndb.OR(model.hasRestrictedView == False, model.canViewMembers.user_id == handler.member.user_id)).order(model.col, model.row).fetch())
        for dat in retData:
            handler.cursor = 0
            dat['moduleData'] = moduleTypeToClassMap[dat['type']].get_all_short(dat['moduleData'], handler)
            handler.cursorMap[dat['id']] = handler.cursor
        return retData 

    @classmethod
    def get_all_full(model, handler):
        retData = convert_query_to_dict(model.query(ndb.OR(model.hasRestrictedView == False, model.canViewMembers.user_id == handler.member.user_id)).order(model.col, model.row).fetch())
        for dat in retData:
            handler.cursor = 0
            dat['moduleData'] = moduleTypeToClassMap[dat['type']].get_all_short(dat['moduleData'], handler)
            handler.cursorMap[dat['id']] = handler.cursor
        return retData 

    @classmethod
    def get_short(model, data, handler):
        modelObj = model.query_model(data)
        retData = modelObj.to_dict()
        retData['moduleData'] = moduleTypeToClassMap[retData['type']].get_all_short(retData['moduleData'], handler)
        return retData 

    @classmethod
    def get_full(model, data, handler):
        modelObj = model.query_model(data)
        retData = modelObj.to_dict()
        retData['moduleData'] = moduleTypeToClassMap[retData['type']].get_all_full(retData['moduleData'], handler)
        return retData 

    @classmethod
    def delete_model(model, data):
        modelObj = super(model, model).delete_model(data)
        data['parentModel'] = Module
        moduleData = moduleTypeToClassMap[modelObj.type].get_all_full({}, data)
        for dat in moduleData:
            moduleTypeToClassMap[modelObj.type].delete_model(dat, data)
        modelbase.UsedId.delete_model({ "idNum" : modelObj.id })
        return modelObj

    @classmethod
    def moduleData_created(model, data, moduleObj):
        modelObj = model.query_model(data)
        modelObj.moduleData.insert(0, moduleObj.key)
        modelObj.put()

    @classmethod
    def moduleData_deleted(model, data, moduleObj):
        modelObj = model.query_model(data)
        modelObj.moduleData.remove(moduleObj.key)
        modelObj.put()


class ModuleData(modelbase.ModelBase):
    id = ndb.IntegerProperty()
    module_id = ndb.IntegerProperty()
    title = ndb.StringProperty()
    desc = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, int(data['id']))

    @classmethod
    def modify_data(model, data):
        return data

    @classmethod
    def create_model(model, data):
        idNum = modelbase.UsedId.create_model({})
        key = model.get_key_from_data({ "id" : idNum.idNum })
        data.pop("id", None)
        modelObj = model(key=key)
        modelObj.populate(**data)
        modelObj.id = idNum.idNum
        modelObj.put()
        return modelObj

    @classmethod
    def update_model(model, data):
        modelObj = model.query_model(data)
        data.pop("id", None)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj


    @classmethod
    def delete_model(model, data):
        modelObj = super(model, model).delete_model(data)
        modelbase.UsedId.delete_model({ "idNum" : modelObj.id })
        return modelObj

    @classmethod
    def get_cursor_config(model, keys):
        return {
          "length" : 2,
        }

    @classmethod
    def get_all_short(model, keys, handler):
        cursorConfig = model.get_cursor_config(keys)
        lastIndex = handler.cursor + cursorConfig['length']
        firstIndex = handler.cursor
        handler.cursor = lastIndex
        if lastIndex >= len(keys):
            handler.cursor = -1
        return convert_query_to_dict(ndb.get_multi(keys[slice(firstIndex, lastIndex)]), model.excludeShort)

    @classmethod
    def get_all_full(model, keys, handler):
        cursorConfig = model.get_cursor_config(keys)
        lastIndex = max(handler.cursor + cursorConfig['length'], len(keys))
        firstIndex = handler.cursor
        handler.cursor = lastIndex
        if lastIndex >= len(keys):
            handler.cursor = -1
        return convert_query_to_dict(ndb.get_multi(keys[slice(firstIndex, lastIndex)]))


class ChallengeModuleData(ModuleData):
    startsAt = ndb.IntegerProperty()
    challengeStatus = ndb.IntegerProperty()
    first = ndb.StringProperty()
    second = ndb.StringProperty()
    third = ndb.StringProperty()
    firstId = ndb.IntegerProperty()
    secondId = ndb.IntegerProperty()
    thirdId = ndb.IntegerProperty()
    excludeShort = ["first", "second", "third"]

    @classmethod
    def modify_data(model, data):
        return data

    @classmethod
    def get_all_short(model, data, handler):
        #parentKey = model.get_key_from_data(data)
        #return convert_query_to_dict(model.query(model.challengeStatus <= 3, ancestor=parentKey).order(-model.challengeStatus, -model.startsAt).fetch(), model.excludeShort)
        return []

    @classmethod
    def get_all_full(model, data, handler):
        #parentKey = model.get_key_from_data(data)
        #activeChallenges = model.get_all_short(data)
        #oldChallenges = convert_query_to_dict(model.query(model.challengeStatus == 4, ancestor=parentKey).order(-model.challengeStatus, -model.startsAt).fetch(25))
        #return activeChallenges + oldChallenges
        return []


class FeedData(ModuleData):
    sticky = ndb.IntegerProperty()
    image = ndb.BlobProperty()
    desc = ndb.TextProperty()

    @classmethod
    def modify_data(model, data):
        #data['image'] = str(data['image'])
        return data


class CampTargetItem(ndb.Model):
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()
    completed = ndb.IntegerProperty()

class CampTarget(ModuleData):
    type = ndb.StringProperty()
    fromlevel = ndb.IntegerProperty()
    tolevel = ndb.IntegerProperty()
    order = ndb.IntegerProperty()
    campItems = ndb.StructuredProperty(CampTargetItem, repeated=True)
    total = ndb.ComputedProperty(lambda self: self.calculateTotal())
    completed = ndb.ComputedProperty(lambda self: self.calculateCompleted())
    excludeShort = ["campItems"]

    def calculateTotal(self):
        t = 0
        for ci in self.campItems:
            t += ci.qty
        return t

    def calculateCompleted(self):
        c = 0
        for ci in self.campItems:
            c += ci.completed
        return c

    @classmethod
    def create_model(model, data, parentData):
        idNum = modelbase.UsedId.create_model({})
        parentKey = model.get_key_from_data(data, parentData)
        data.pop("id", None)
        modelObj = model(parent=parentKey)
        modelObj.populate(**data)
        modelObj.id = idNum.idNum

        campLvls = camps.CampLevel.query(camps.CampLevel.type == modelObj.type, camps.CampLevel.level >= modelObj.fromlevel, camps.CampLevel.level <= modelObj.tolevel).fetch()
        campTarItms = []
        campTarItmMap = {}
        for campLvl in campLvls:
            for campItm in campLvl.items:
                if campTarItmMap.has_key(campItm.item):
                    campTarItmMap[campItm.item].qty += campItm.qty
                else:
                    campTarItm = CampTargetItem()
                    campTarItm.item = campItm.item
                    campTarItm.qty = campItm.qty
                    campTarItm.completed = 0
                    campTarItmMap[campItm.item] = campTarItm
                    campTarItms.append(campTarItm)

        order = model.query().order(-model.order).get()
        if not order:
            order = 0
        else:
            order = order.order + 1

        modelObj.order = order
        modelObj.campItems = campTarItms
        modelObj.put()
        return modelObj

    @classmethod
    def delete_model(model, data, parentData):
        modelObj = model.query_model(data, parentData)

        campTarItems = modelObj.campItems
        for campTarItm in campTarItems:
            campTarMemItms = camps.CampTargetMemberItem.query(camps.CampTargetMemberItem.item == campTarItm.item).fetch()
            for campTarMemItm in campTarMemItms:
                if campTarItm.qty > 0:
                    if campTarMemItm.qty > campTarItm.qty:
                        campTarMemItm.qty -= campTarItm.qty
                        campTarItm.qty = 0
                    else:
                        campTarItm.qty -= campTarMemItm.qty
                        campTarMemItm.key.delete()

        modelObj.key.delete()
        return modelObj


class MemberListData(ModuleData):
    user_id = ndb.IntegerProperty()
    email = ndb.StringProperty()


class PollOption(ndb.Model):
    title = ndb.StringProperty()
    optId = ndb.IntegerProperty()

class PollData(ModuleData):
    pollOptions = ndb.StructuredProperty(PollOption, repeated=True)
    multiVote = ndb.BooleanProperty()
    editable = ndb.BooleanProperty()

    @classmethod
    def modifyPollOptions(model, newPollOptions, oldPollOptions=[]):
        idsPresent = {}
        for po in newPollOptions:
            if not po.has_key('optId'):
                po['optId'] = modelbase.UsedId.create_model({}).idNum
            else:
                idsPresent[po['optId']] = 1

        for opo in oldPollOptions:
            if not idsPresent.has_key(opo['optId']):
                modelbase.UsedId.delete_model({ "idNum" : opo['optId'] })
                delete_from_query(PollVote.query(PollVote.optId == opo['optId']).fetch())


    @classmethod
    def create_model(model, data, parentData):
        logging.warn(data)
        model.modifyPollOptions(data['pollOptions'])
        return super(PollData, model).create_model(data, parentData)

    @classmethod
    def update_model(model, data, parentData):
        modelObj = model.query_model(data, parentData)
        model.modifyPollOptions(data['pollOptions'], modelObj.pollOptions)
        return super(PollData, model).update_model(data, parentData)


class PollVote(modelbase.ModelBase):
    user_id = ndb.IntegerProperty()
    email = ndb.StringProperty()
    optId = ndb.IntegerProperty()
    pollId = ndb.IntegerProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "{0}__{1}".format(data['user_id'], data['optId']))


moduleTypeToClassMap = {
    "module" : ModuleData,
    "member-list" : MemberListData,
    "challenge" : ChallengeModuleData,
    "feed" : FeedData,
    "camp" : CampTarget,
    "poll" : PollData,
}


class CreateModuleRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("Module")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            moduleObj = Module.create_model(params['data'])
            logging.warn(moduleObj)
            self.response.out.write(json.dumps(response.success("success", {"id" : moduleObj.id})))


class UpdateModuleRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("Module")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            moduleObj = Module.update_model(params['data'])
            logging.warn(moduleObj)
            self.response.out.write(json.dumps(response.success("success", {"id" : moduleObj.id})))
            

class DeleteModuleRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit_GET("Module")
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            moduleObj = Module.delete_model({
              "id" : self.request.get("id"),
            })
            self.response.out.write(json.dumps(response.success("success", {})))


class GetModuleAllShort(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = 0
            self.cursorMap = {}
            data = Module.get_all_short(self)
            self.response.out.write(json.dumps(response.success("success", {"modules" : data}, { "cursors" : self.cursorMap })))


class GetModuleAll(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_admin
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = 0
            self.cursorMap = {}
            data = Module.get_all_full(self)
            self.response.out.write(json.dumps(response.success("success", {"modules" : data}, { "cursors" : self.cursorMap })))


class GetModuleShort(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = 0
            data = Module.get_short({ "id" : self.request.get("id") }, self)
            self.response.out.write(json.dumps(response.success("success", data, {"cursor" : self.cursor})))


class GetModuleFull(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = 0
            data = Module.get_full({ "id" : self.request.get("id") }, self)
            self.response.out.write(json.dumps(response.success("success", data, {"cursor" : self.cursor})))


class GetModuleShortNext(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = int(self.request.get("cur"))
            data = Module.get_short({ "id" : self.request.get("id") }, self)
            self.response.out.write(json.dumps(response.success("success", data, {"cursor" : self.cursor})))


class GetModuleFullNext(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            self.cursor = int(self.request.get("cur"))
            data = Module.get_full({ "id" : self.request.get("id") }, self)
            self.response.out.write(json.dumps(response.success("success", data, {"cursor" : self.cursor})))


class MoveModuleHorizontal(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit_GET("Module")
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        if self.member:
            moduleObj = Module.query_model({ "id" : self.request.get("id") })

            moduleObjs = Module.query(Module.col == moduleObj.col, Module.row > moduleObj.row).fetch()

            dir = self.request.get("dir")
            if dir == "left":
                moduleObj.col = (moduleObj.col - 1) % 3
            else:
                moduleObj.col = (moduleObj.col + 1) % 3
            moduleObj.row = Module.get_last_row(moduleObj.col)
            moduleObj.put()

            for modObj in moduleObjs:
                modObj.row -= 1;
                modObj.put()

            self.response.out.write(json.dumps(response.success("success", {})))


class MoveModuleVertical(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit_GET("Module")
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        if self.member:
            moduleObj = Module.query_model({ "id" : self.request.get("id") })

            dir = self.request.get("dir")
            move = 0
            oldRow = moduleObj.row
            if dir == "up" and moduleObj.row != 0:
                moduleObj.row -= 1
                move = 1
            else:
                moduleObjs = Module.query(Module.col == moduleObj.col).order(-Module.row).get()
                lastRow = -1
                if moduleObjs:
                    lastRow = moduleObjs.row
                if lastRow != -1 and lastRow != moduleObj.row:
                    moduleObj.row += 1
                    move = 1

            logging.warn("{0} : {1}".format(moduleObj.row, moduleObj.col))

            if move:
                swapObj = Module.query(Module.col == moduleObj.col, Module.row == moduleObj.row).get()
                swapObj.row = oldRow
                swapObj.put()
                moduleObj.put()

            self.response.out.write(json.dumps(response.success("success", {})))
    

class CreateModuleDataRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("ModuleData")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['module_id'] = int(params['modId'])
            moduleDataObj = moduleTypeToClassMap[params['modType']].create_model(params['data'])
            Module.moduleData_created({ "id" : params['modId'] }, moduleDataObj)
            logging.warn(moduleDataObj)
            self.response.out.write(json.dumps(response.success("success", moduleDataObj.to_dict())))


class GetModuleDataRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            modData = moduleTypeToClassMap[self.request.get("modType")].get_full({ "id" : self.request.get("id") }, { "id" : self.request.get("modId"), "parentModel" : Module })
            self.response.out.write(json.dumps(response.success("success", modData)))


class UpdateModuleDataRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("ModuleData")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            logging.warn(self.member)
            params = json.loads(self.request.body)
            moduleDataObj = moduleTypeToClassMap[params['modType']].update_model(params['data'])
            logging.warn(moduleDataObj)
            self.response.out.write(json.dumps(response.success("success", moduleDataObj.to_dict())))


class DeleteModuleDataRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit_GET("ModuleData")
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            moduleDataObj = moduleTypeToClassMap[self.request.get("modType")].query_model({ "id" : self.request.get("id") })
            if self.canEdit or moduleDataObj.email == self.member.email:
                moduleTypeToClassMap[self.request.get("modType")].delete_model({ "id" : self.request.get("id") })
                Module.moduleData_deleted({ "id" : self.request.get("modId") }, moduleDataObj)
                self.response.out.write(json.dumps(response.success("success", {})))
            else:
                self.response.out.write(json.dumps(response.failure("401", "No permission to edit Module Data related data")))


class CreatePollVote(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json'
        if self.member:
            params = json.loads(self.request.body)
            voteObj = PollVote.create_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", voteObj.to_dict())))


class GetAllPollVote(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            data = PollVote.get_all_short()
            self.response.out.write(json.dumps(response.success("success", data)))


class UpdatePollVote(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json'
        if self.member:
            params = json.loads(self.request.body)
            voteObj = PollVote.update_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", voteObj.to_dict())))


class DeletePollVote(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        if self.member:
            voteObj = PollVote.delete_model({
              "user_id" : self.request.get("user_id"),
              "optId" : int(self.request.get("optId")),
            })
            self.response.out.write(json.dumps(response.success("success", {})))

