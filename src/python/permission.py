from google.appengine.api import users
from google.appengine.ext import ndb

import modelbase
import random
import response
import re
import logging
import webapp2
import json

LEADER_PERMISSION = 2
ADMIN_PERMISSION = 3

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class Permission(modelbase.ModelBase):
    oprn = ndb.StringProperty()
    permission = ndb.IntegerProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, data['oprn'])


class ModulePermission(modelbase.ModelBase):
    email = ndb.StringProperty()
    user_id = ndb.IntegerProperty()
    moduleId = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "%(e)s__%(i)s" % { "e" : data['user_id'], "i" : data['moduleId'] })

    @classmethod
    def can_edit_module(model, member, moduleId):
        modPerm = model.query_model({ "user_id" : member.user_id, "moduleId" : moduleId })
        if modPerm or member.permission >= LEADER_PERMISSION:
            return 1
        return 0


def can_edit_GET(oprn):
    def can_edit_check(func):
        def get_post_perm(self):
            perm = Permission.query_model({ "oprn" : oprn })
            if oprn == "Module" or oprn == "ModuleData":
                modId = self.request.get("modId")
                self.canEdit = ModulePermission.can_edit_module(self.member, modId) or (perm and self.member.permission >= perm.permission) or (self.member.permission >= LEADER_PERMISSION)
                if self.canEdit or (oprn == "ModuleData" and self.request.get("modType") == "member-list"):
                    func(self)
            elif (perm and self.member.permission >= perm.permission) or (self.member.permission >= LEADER_PERMISSION):
                func(self)
            else:
                self.response.out.write(json.dumps(response.failure("401", "No permission to edit %s related data" % oprn)))
        return get_post_perm
    return can_edit_check


def can_edit(oprn):
    def can_edit_check(func):
        def get_post_perm(self):
            perm = Permission.query_model({ "oprn" : oprn })
            if oprn == "Module" or oprn == "ModuleData":
                params = json.loads(self.request.body)
                if "modId" in params:
                    modId = params['modId']
                else:
                    modId = 0
                self.canEdit = ModulePermission.can_edit_module(self.member, modId) or (perm and self.member.permission >= perm.permission) or (self.member.permission >= LEADER_PERMISSION)
                #handle challenges properly
                if self.canEdit or (oprn == "ModuleData" and ((params['modType'] == "member-list" and params['data']['user_id'] == self.member.user_id) or (params['modType'] == "challenge"))):
                    func(self)
                else:
                    self.response.out.write(json.dumps(response.failure("401", "No permission to edit %s related data" % oprn)))
            elif (perm and self.member.permission >= perm.permission) or (self.member.permission >= LEADER_PERMISSION):
                func(self)
            else:
                self.response.out.write(json.dumps(response.failure("401", "No permission to edit %s related data" % oprn)))
        return get_post_perm
    return can_edit_check


availableOperations = [
  'Alliance',
  'Member',
  'Module',
  'ModuleData',
]

def createPermissions():
    for ap in availableOperations:
        perm = Permission.query_model({ "oprn" : ap })
        if not perm:
            Permission.create_model({ "oprn" : ap, "permission" : LEADER_PERMISSION })

