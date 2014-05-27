import os
import urllib
import json
import response
import member
import modelbase
import moduledata
import alliance
import camps
import challengeslist
import permission
import channelid

from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2

class MainPage(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        user = member.validate_user(self)
        if user:
            path = os.path.join(os.path.split(__file__)[0], 'public/index.html')
            page = open(path, 'r')
            self.response.out.write(page.read())


class ProfileGetRequest(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            extraData = {}
            allianceObj = alliance.Alliance.query_model({})
            if allianceObj:
                extraData["alliance"] = { "name" : allianceObj.name, "motto" : allianceObj.motto }
            else:
                extraData["alliance"] = {}
            permissions = permission.Permission.get_all_full()
            if self.member.permission >= permission.LEADER_PERMISSION:
                editableModules = permission.ModulePermission.query().fetch()
            else:
                editableModules = permission.ModulePermission.query(permission.ModulePermission.user_id == self.member.user_id).fetch()
            extraData["permissions"] = permissions
            extraData["editableModules"] = member.convert_query_to_dict(editableModules)
            extraData["pollsVoted"] = member.convert_query_to_dict(moduledata.PollVote.query(moduledata.PollVote.email == self.member.email).fetch())
            extraData["logoutUrl"] = users.create_logout_url("/")
            self.response.out.write(json.dumps(response.success("success", self.member.to_dict(), extraData)))


class AddAdmin(webapp2.RequestHandler):

    @member.validate_user
    def get(self):
        if self.user:
            memberObj = member.Member.query(member.Member.permission == permission.ADMIN_PERMISSION).get()
            if not memberObj:
                memberObj = member.Member.create_model({ "email" : self.user.email(), "permission" : permission.ADMIN_PERMISSION, "status" : 1 })
                permission.createPermissions()
                camps.create_camps_data()
                challengeslist.create_challenges_data()
                self.redirect("/")
            elif memberObj.email == self.user.email():
                self.redirect("/")
            else:
                self.response.write('Invalid Request! Leader already present!')

class CreateData(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_admin
    def get(self):
        if self.member:
            camps.create_camps_data()
            challengeslist.create_challenges_data()
            self.response.write('Create Data!')


#handle camps.CampTargetMemberItem with key property
DataMap = {
  #"alliance" : alliance.Alliance,
  #"usedId" : modelbase.UsedId,
  #"member" : member.Member,
  "module" : moduledata.Module,
  "pollvote" : moduledata.PollVote,
  #"permission" : permission.Permission,
  "modelPermission" : permission.ModulePermission,
}

class BackupGet(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_admin
    def get(self):
        if self.member:
            data = {}
            #for k in DataMap.keys():
            #    data[k] = DataMap[k].get_all_full()
            self.response.out.write(json.dumps(response.success("success", data)))

class BackupPut(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_admin
    def post(self):
        if self.member:
            data = json.loads(self.request.body)
            #for k in data.keys():
            #    model = DataMap[k]
            #    member.delete_from_query(model.query().fetch())
            #    for obj in data[k]:
            #        model.create_model(obj)
            #self.response.out.write(json.dumps(response.success("success", {})))


@ndb.transactional(retries=1, xg=True)
def moveModuleData(modules, moduleDataMap, handler):
    for mod in modules:
        moduleKey = ndb.Key(moduledata.Module, mod.id)
        mod.moduleData = []
        modDatClass = moduledata.moduleTypeToClassMap[mod.type]
        for modDat in moduleDataMap[mod.id]:
            modDatDict = modDat.to_dict()
            modDatDict['module_id'] = mod.id
            modDat.key.delete()
            newModDat = modDatClass.create_model(modDatDict)
            mod.moduleData.append(newModDat.key)
        if len(mod.moduleData) > 0:
            mod.put()
            handler.response.out.write("Data moved for {0}".format(mod.title))
            break


class MoveData(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_admin
    def get(self):
        if self.member:
            modules = []
            moduleDataMap = {}
            for mod in moduledata.Module.query().fetch():
                moduleKey = ndb.Key(moduledata.Module, mod.id)
                modDatClass = moduledata.moduleTypeToClassMap[mod.type]
                modules.append(mod)
                moduleDataMap[mod.id] = []
                for modDat in modDatClass.query(ancestor=moduleKey).order(modDatClass.id).fetch():
                    moduleDataMap[mod.id].append(modDat)

            moveModuleData(modules, moduleDataMap, self)

        self.response.out.write("Data moved successfully")


app = webapp2.WSGIApplication([
    ('/dashboard/get', moduledata.GetModuleAllShort),
    ('/alliance/create', alliance.CreateAlliance),
    ('/alliance/get', alliance.GetAlliance),
    ('/alliance/update', alliance.UpdateAlliance),
    ('/module/create', moduledata.CreateModuleRequest),
    ('/module/getFull', moduledata.GetModuleFull),
    ('/module/get', moduledata.GetModuleShort),
    ('/module/getFullNext', moduledata.GetModuleFullNext),
    ('/module/getNext', moduledata.GetModuleShortNext),
    ('/module/update', moduledata.UpdateModuleRequest),
    ('/module/delete', moduledata.DeleteModuleRequest),
    ('/module/moveHorizontal', moduledata.MoveModuleHorizontal),
    ('/module/moveVertical', moduledata.MoveModuleVertical),
    ('/moduleData/create', moduledata.CreateModuleDataRequest),
    ('/moduleData/update', moduledata.UpdateModuleDataRequest),
    ('/moduleData/delete', moduledata.DeleteModuleDataRequest),
    ('/moduleData/get', moduledata.GetModuleDataRequest),
    ('/member/create', member.CreateMember),
    ('/member/update', member.UpdateMember),
    ('/member/getAll', member.GetAllMembers),
    ('/member/delete', member.DeleteMember),
    ('/profile/get', ProfileGetRequest),
    ('/profile/update', member.UpdateProfile),
    ('/permission/create', member.CreatePermission),
    ('/permission/update', member.UpdatePermission),
    ('/validate', member.ValidateToken),
    ('/register', member.RegisterMember),
    ('/modulepermission/create', member.CreateModulePermission),
    ('/modulepermission/delete', member.DeleteModulePermission),
    ('/camp/clear', camps.ClearCampTargets),
    ('/campmemberitem/create', camps.CreateCampTargetMemberItem),
    ('/campmemberitem/getAll', camps.GetAllCampTargetMemberItems),
    ('/campmemberitem/update', camps.UpdateCampTargetMemberItem),
    ('/pollvote/create', moduledata.CreatePollVote),
    ('/pollvote/getAll', moduledata.GetAllPollVote),
    ('/pollvote/update', moduledata.UpdatePollVote),
    ('/pollvote/delete', moduledata.DeletePollVote),
    ('/challengeslistdata/getAll', challengeslist.GetAllChallengeData),
    ('/admin', AddAdmin),
    ('/createData', CreateData),
    ('/backup/get', BackupGet),
    ('/backup/put', BackupPut),
    ('/movedata', MoveData),
    ('/channel/get', channelid.GetChannel),
    ('/channel/create', channelid.CreateChannel),
    ('/_ah/channel/receive', channelid.RecieveMessage),
    ('/', MainPage),
], debug=True)
