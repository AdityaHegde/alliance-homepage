from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.api import mail

import random
import response
import re
import logging
import webapp2
import json
import alliance
import permission
import camps

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class Member(ndb.Model):
    email = ndb.StringProperty()
    gotaname = ndb.StringProperty()
    status = ndb.IntegerProperty()
    permission = ndb.IntegerProperty()

class Module(ndb.Model):
    name = ndb.StringProperty()
    title = ndb.StringProperty()
    type = ndb.StringProperty()
    col = ndb.IntegerProperty()

class InviteToken(ndb.Model):
    token = ndb.StringProperty()
    email = ndb.StringProperty()


def get_member_by_email(email):
    member = Member.query(Member.email == email).get()
    if member and member.status == 1:
        return member
    return None

def validate_email(email):
    member = get_member_by_email(email)
    if member and member.status == 1:
        return 1
    else:
        return 0

def is_leader(email):
    member = get_member_by_email(email)
    if member:
        p = re.match(r"(L)", member.permission)
        if p.group(0):
            return 1
    return 0

def is_officer(email):
    member = get_member_by_email(email)
    if member:
        p = re.match(r"(O)", member.permission)
        if p.group(0):
            return 1
    return 0

def get_new_token(email):
    #12 digit hex
    x = random.randint(0, 281474976710656)
    token = InviteToken(token="%x" % x, email=email)
    token.put()
    return token

def get_token(token):
    return InviteToken.query(InviteToken.token == token).get()

def validate_token(token):
    tokenObj = get_token(token)
    if tokenObj:
        return 1
    else:
        return 0


def validate_user(self):
    user = users.get_current_user()
    if user:
        return user
    else:
        self.redirect(users.create_login_url(self.request.uri))
    return None


def validate_user_is_member(self):
    user = validate_user(self)
    if user:
        member = get_member_by_email(user.email())
        if member:
            return member
        else:
            self.response.out.write(json.dumps(response.failure("401", "Not a Member")))
    return None


def validate_user_is_member_and_can_edit(self, oprn):
    user = validate_user(self)
    if user:
        member = get_member_by_email(user.email())
        if member:
            if permission.check_permission(member, oprn):
                return member
            else:
                self.response.out.write(json.dumps(response.failure("401", "No Permission")))
        else:
            self.response.out.write(json.dumps(response.failure("401", "Not a Member")))
    return None
    

class ValidateToken(webapp2.RequestHandler):

    def get(self):
        token = self.request.get('t')
        if token:
            logging.warn(token)
            if validate_token(token) == 1:
                self.redirect("/register?t=%(token)s" % {"token" : token})
            else:
                self.response.write('Invalid Request Token!')
        else:
            self.response.write('Invalid Request!')


class RegisterMember(webapp2.RequestHandler):

    def get(self):
        user = validate_user(self)
        if user:
            token = get_token(self.request.get('t'))
            logging.warn(token)
            logging.warn(user.email())
            if token and user.email() == token.email:
                member = Member.query(Member.email == user.email()).get()
                member.status = 1
                member.put()
                token.key.delete()
                self.redirect("/")
            else:
                self.response.write('Invalid Request! Wrong Email!')


class AddAdmin(webapp2.RequestHandler):
    def get(self):
        user = validate_user(self)
        if user:
            member = Member.query(Member.permission == 2).get()
            if not member:
                member = Member()
                member.permission = 2
                member.email = user.email()
                member.status = 1
                member.put()
                permission.createPermissions()
                camps.create_camps_data()
                self.redirect("/")
            elif member.email == user.email():
                self.redirect("/")
            else:
                self.response.write('Invalid Request! Leader already present!')


class UpdateProfile(webapp2.RequestHandler):
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        member = validate_user_is_member(self)

        if member:
            params = json.loads(self.request.body)
            memberData = params['data']
            memberData.pop("permission", None)
            memberData.pop("email", None)
            memberData.pop("status", None)
            member.populate(**memberData)
            member.put()
            self.response.write(json.dumps(response.success("success", {})))


class InviteMember(webapp2.RequestHandler):
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        member = validate_user_is_member_and_can_edit(self, "Member")

        if member:
            params = json.loads(self.request.body)
            memberData = params['data']
            if get_member_by_email(memberData['email']):
                self.response.out.write(json.dumps(response.failure("500", "Email already in use")))
            elif not mail.is_email_valid(memberData['email']):
                self.response.out.write(json.dumps(response.failure("500", "Invalid email address")))
            else:
                newMember = Member()
                newMember.populate(**memberData)
                newMember.put()
                token = get_new_token(newMember.email)
                url = "%(host)s/validate?t=%(token)s" % {"host" : self.request.host_url, "token" : token.token}
                sender_address = member.email
                subject = "Confirm your membership"
                body = """
Thank you for creating an account! Please confirm your email address by
clicking on the link below:

%s
""" % url

                mail.send_mail(sender_address, newMember.email, subject, body)
                self.response.write(json.dumps(response.success("success", {"email" : newMember.email})))


class ProfileGetRequest(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        member = validate_user_is_member(self)
        if member:
            extraData = {}
            allianceObj = alliance.Alliance.query().get()
            if allianceObj:
                extraData["alliance"] = { "name" : allianceObj.name, "motto" : allianceObj.motto }
            else:
                extraData["alliance"] = {}
            permissions = permission.Permission.query().fetch()
            if member.permission == 2:
                editableModules = permission.ModulePermission.query().fetch()
            else:
                editableModules = permission.ModulePermission.query(permission.ModulePermission.email == member.email).fetch()
            extraData["permissions"] = convert_query_to_dict(permissions)
            extraData["editableModules"] = convert_query_to_dict(editableModules)
            self.response.out.write(json.dumps(response.success("success", member.to_dict(), extraData)))

class GetAllMembers(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        member = validate_user_is_member(self)

        if member and member.permission == 2:
            members = Member.query().fetch()
            self.response.out.write(json.dumps(response.success("success", convert_query_to_dict(members))))


