import os
import urllib
import json
import response
import member
import moduledata
import alliance
import camps
import challengeslist
import permission

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
            logging.warn(page)
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
                editableModules = permission.ModulePermission.query(permission.ModulePermission.email == self.member.email).fetch()
            extraData["permissions"] = permissions
            extraData["editableModules"] = member.convert_query_to_dict(editableModules)
            extraData["pollsVoted"] = member.convert_query_to_dict(moduledata.PollVote.query(moduledata.PollVote.email == self.member.email).fetch())
            self.response.out.write(json.dumps(response.success("success", self.member.to_dict(), extraData)))


class AddAdmin(webapp2.RequestHandler):

    @member.validate_user
    def get(self):
        if self.user:
            memberObj = member.Member.query(member.Member.permission == permission.LEADER_PERMISSION).get()
            if not memberObj:
                memberObj = member.Member.create_model({ "email" : self.user.email(), "permission" : permission.LEADER_PERMISSION, "status" : 1 })
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
    @member.validate_user_is_member
    def get(self):
        if self.member:
            if self.member.permission == 3:
                camps.create_camps_data()
                challengeslist.create_challenges_data()
                self.response.write('Create Data!')
            else:
                self.response.write('Unauthorised Access')


app = webapp2.WSGIApplication([
    ('/dashboard/get', moduledata.GetModuleAllShort),
    ('/alliance/create', alliance.CreateAlliance),
    ('/alliance/get', alliance.GetAlliance),
    ('/alliance/update', alliance.UpdateAlliance),
    ('/module/create', moduledata.CreateModuleRequest),
    ('/module/update', moduledata.UpdateModuleRequest),
    ('/module/getFull', moduledata.GetModuleFull),
    ('/module/get', moduledata.GetModuleShort),
    ('/module/moveHorizontal', moduledata.MoveModuleHorizontal),
    ('/module/moveVertical', moduledata.MoveModuleVertical),
    ('/moduleData/create', moduledata.CreateModuleDataRequest),
    ('/moduleData/update', moduledata.UpdateModuleDataRequest),
    ('/moduleData/delete', moduledata.DeleteModuleDataRequest),
    ('/moduleData/get', moduledata.GetModuleDataRequest),
    ('/member/create', member.InviteMember),
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
    ('/', MainPage),
], debug=True)
