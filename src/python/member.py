from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import mail

import modelbase
import random
import response
import re
import logging
import webapp2
import json
import permission

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class Member(modelbase.ModelBase):
    user_id = ndb.IntegerProperty()
    email = ndb.StringProperty()
    profileImg = ndb.BlobProperty()
    gotaname = ndb.StringProperty()
    status = ndb.IntegerProperty()
    permission = ndb.IntegerProperty()
    bday_month = ndb.IntegerProperty()
    bday_date = ndb.IntegerProperty()
    linage = ndb.TextProperty()
    fealty = ndb.StringProperty()
    talents = ndb.StringProperty(repeated=True)
    timezone = ndb.StringProperty()
    gotafrlink = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, data['user_id'])

    @classmethod
    def create_model(model, data):
        if not data.has_key('user_id') or not data['user_id']:
            logging.warn("Id created")
            data['user_id'] = modelbase.UsedId.create_model({}).idNum
        return super(model, model).create_model(data)

    @classmethod
    def delete_model(model, data):
        modelObj = super(model, model).delete_model(data)
        if modelObj.user_id:
            modelbase.UsedId.delete_model({ "idNum" : modelObj.user_id })
        return modelObj


class InviteToken(modelbase.ModelBase):
    token = ndb.StringProperty()
    email = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, data['token'])

    @classmethod
    def create_model(model, data):
        #12 digit hex
        x = random.randint(0, 281474976710656)
        tokenNum = "%x" % x
        key = model.get_key_from_data({ "token" : tokenNum })
        token = model(token=tokenNum, email=data['email'], key=key)
        token.put()
        return token

providers = [
  ['Google'   , 'https://www.google.com/accounts/o8/id'],
  ['Yahoo'    , 'yahoo.com'],
  ['MySpace'  , 'myspace.com'],
  ['AOL'      , 'aol.com'],
]


def validate_user(func):
    def get_post_user(self):
        user = users.get_current_user()
        if user:
            self.user = user
            func(self)
        else:
            self.response.out.write('Hello! Sign in at: ')
            for provider in providers:
                self.response.out.write('[<a href="%s">%s</a>]' % (users.create_login_url(federated_identity=provider[1], dest_url=self.request.url), provider[0]))
    return get_post_user


def validate_user_is_member(func):
    def get_post_member(self):
        member = Member.query(Member.email == self.user.email()).get()
        if member and member.status == 1:
            self.member = member
            func(self)
        else:
            self.response.out.write(json.dumps(response.failure("401", "%s is Not a Member. Refresh the page if you have just registered." % self.user.email())))
    return get_post_member


def validate_user_is_leader(fun):
    def get_post(self):
        member = Member.query(Member.email == self.user.email()).get()
        if member and member.permission >= permission.LEADER_PERMISSION:
            self.member = member
            fun(self)
        else:
            self.response.out.write(json.dumps(response.failure("401", "Have to be a leader to perform this operation")))
    return get_post


def validate_user_is_admin(fun):
    def get_post(self):
        member = Member.query(Member.email == self.user.email()).get()
        if member and member.permission == permission.ADMIN_PERMISSION:
            self.member = member
            fun(self)
        else:
            self.response.out.write(json.dumps(response.failure("401", "Have to be an admin to perform this operation")))
    return get_post


class ValidateToken(webapp2.RequestHandler):

    def get(self):
        token = self.request.get('t')
        if token:
            logging.warn(token)
            if InviteToken.query_model({ "token" : token }):
                self.redirect("/register?t=%(token)s" % {"token" : token})
            else:
                self.response.write('Invalid Request Token!')
        else:
            self.response.write('Invalid Request!')


class RegisterMember(webapp2.RequestHandler):

    @validate_user
    def get(self):
        if self.user:
            token = InviteToken.query_model({ "token" : self.request.get('t') })
            logging.warn(token)
            logging.warn(self.user.email())
            if token and self.user.email() == token.email:
                member = Member.query(Member.email == self.user.email()).get()
                member.status = 1
                member.put()
                token.key.delete()
                self.redirect("/#/profile")
            else:
                self.response.write('Invalid Request! Wrong Email or Token!')


class UpdateProfile(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            memberData = params['data']
            memberData.pop("permission", None)
            memberData.pop("email", None)
            memberData.pop("status", None)
            self.member.populate(**memberData)
            self.member.put()
            self.response.write(json.dumps(response.success("success", { "user_id" : self.member.user_id })))


def invite_member_by_email(self, memberData):
    if Member.query(Member.email == memberData['email']).get():
        self.response.out.write(json.dumps(response.failure("500", "Email already in use")))
    elif not mail.is_email_valid(memberData['email']):
        self.response.out.write(json.dumps(response.failure("500", "Invalid email address")))
    else:
        if memberData.has_key("user_id"):
            newMember = Member.update_model(memberData)
        else:
            newMember = Member.create_model(memberData)
        token = InviteToken.create_model({ "email" : newMember.email })
        url = "%(host)s/validate?t=%(token)s" % {"host" : self.request.host_url, "token" : token.token}
        sender_address = self.member.email
        subject = "Confirm your membership"
        body = """
Thank you for creating an account! Please confirm your email address by
clicking on the link below:

%s
""" % url

        mail.send_mail(sender_address, newMember.email, subject, body)
        self.response.write(json.dumps(response.success("success", {"user_id" : newMember.user_id})))
        return newMember


class CreateMember(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_member
    @permission.can_edit("Member")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            memberData = params['data']
            if memberData.has_key("email"):
                invite_member_by_email(self, memberData)
            else:
                newMember = Member.create_model(memberData)
                self.response.write(json.dumps(response.success("success", {"user_id" : newMember.user_id})))


class UpdateMember(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_member
    @permission.can_edit("Member")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            memberData = params['data']
            memberObj = Member.query_model(memberData)
            logging.warn("Checking")
            if memberObj.status != None and memberObj.status == 1:
                logging.warn("Confirmed")
                self.response.out.write(json.dumps(response.failure("500", "Member has already confirmed email. Cant edit email again")))
            else:
                logging.warn("Updated")
                if memberData.has_key('email'):
                    if memberObj.email != None and memberObj.email != memberData['email']:
                        InviteToken.query(InviteToken.email == memberObj.email).get().key.delete()
                    invite_member_by_email(self, memberData)
                else:
                    self.response.write(json.dumps(response.success("success", {"user_id" : newMember.user_id})))
                Member.update_model(memberData)
            logging.warn("Checking Done")


class DeleteMember(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_member
    @permission.can_edit_GET("Member")
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            user_id = self.request.get("user_id")
            if user_id != self.member.user_id:
                Member.delete_model({ "user_id" : user_id })
                invited = InviteToken.query(InviteToken.email == email).get()
                if invited:
                    invited.key.delete()
                self.response.out.write(json.dumps(response.success("success", {})))
            else:
                self.response.out.write(json.dumps(response.failure("500", "Cant delete self!")))


class GetAllMembers(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            members = Member.query().fetch()
            self.response.out.write(json.dumps(response.success("success", convert_query_to_dict(members))))


#put it here to workaround circular dependancies
class CreatePermission(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_leader
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            permissionObj = permission.Permission.create_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", {"id" : permissionObj.oprn})))


class UpdatePermission(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_leader
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            permissionObj = permission.Permission.update_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", {"id" : permissionObj.oprn})))


class CreateModulePermission(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_leader
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            if permission.ModulePermission.query_model(params):
                self.response.out.write(json.dumps(response.failure("500", "Member already has permission")))
            else:
                modPerm = permission.ModulePermission.create_model(params['data'])
                modPerm.put()
                self.response.out.write(json.dumps(response.success("success", { "id" : "%(modId)s_%(user_id)s" % { "modId" : modPerm.moduleId, "user_id" : modPerm.user_id } })))

class DeleteModulePermission(webapp2.RequestHandler):

    @validate_user
    @validate_user_is_leader
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            permission.ModulePermission.delete_model({ "moduleId" : self.request.get("moduleId"), "user_id" : self.request.get("user_id") })
            self.response.out.write(json.dumps(response.success("success", {})))

