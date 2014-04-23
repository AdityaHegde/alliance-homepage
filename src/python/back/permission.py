from google.appengine.api import users
from google.appengine.ext import ndb

import random
import response
import re
import logging
import webapp2
import json
import member

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class Permission(ndb.Model):
    oprn = ndb.StringProperty()
    permission = ndb.IntegerProperty()

class ModulePermission(ndb.Model):
    email = ndb.StringProperty()
    moduleId = ndb.StringProperty()


def check_permission(member, oprn):
    perm = Permission.query(Permission.oprn == oprn).get()
    if (perm and member.permission >= perm.permission) or (member.permission == 2):
        return 1
    return 0


def can_edit(member, oprn):
    if check_permission(member, oprn):
        if oprn == ModuleData:
            return ModulePermission.query(ModulePermission.email == member.email and ModulePermission.moduleId == module.id).get()
        return 1
    else:
        return 0

class CreatePermission(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Permission")

        if memberObj:
            params = json.loads(self.request.body)
            permission = Permission()
            permission.populate(**params['data'])
            permission.put()
            self.response.out.write(json.dumps(response.success("success", {"id" : permission.oprn})))

class UpdatePermission(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Permission")

        if memberObj:
            params = json.loads(self.request.body)
            permissionData = params['data']
            permission = Permission.query(Permission.oprn == permissionData['oprn']).get()
            permission.populate(**permissionData)
            permission.put()
            self.response.out.write(json.dumps(response.success("success", {"id" : permission.oprn})))


availableOperations = [
  'Alliance',
  'Member',
  'Module',
  'ModuleData',
  'CampTarget',
]

def createPermissions():
    for ap in availableOperations:
        perm = Permission.query(Permission.oprn == ap).get()
        if not perm:
            perm = Permission(oprn=ap, permission=2)
            perm.put()

class CreateModulePermission(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj and memberObj.permission == 2:
            params = json.loads(self.request.body)
            if ModulePermission.query(ModulePermission.moduleId == params["moduleId"], ModulePermission.email == params["email"]).get():
                self.response.out.write(json.dumps(response.failure("500", "Member already has permission")))
            else:
                modPermData = params['data']
                modPerm = ModulePermission(**modPermData)
                modPerm.put()
                self.response.out.write(json.dumps(response.success("success", { "id" : "%(modId)s_%(email)s" % { "modId" : modPerm.moduleId, "email" : modPerm.email } })))

class DeleteModulePermission(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj and memberObj.permission == 2:
            modPerm = ModulePermission.query(ModulePermission.moduleId == self.request.get("moduleId"), ModulePermission.email == self.request.get("email")).get()
            if modPerm:
                modPerm.key.delete()
                self.response.out.write(json.dumps(response.success("success", {})))
            else:
                self.response.out.write(json.dumps(response.failure("500", "Member already has permission")))

