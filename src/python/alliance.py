from google.appengine.api import users
from google.appengine.ext import ndb

import modelbase
import random
import response
import re
import logging
import webapp2
import json
import member
import permission

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class Alliance(modelbase.ModelBase):
    name = ndb.StringProperty()
    motto = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "One")


class CreateAlliance(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("Alliance")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            alliance = Alliance.create_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "name" : alliance.name })))


class GetAlliance(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            allianceData = Alliance.get_full({})
            allianceData['members'] = member.Member.get_all_full()
            self.response.out.write(json.dumps(response.success("success", allianceData)))


class UpdateAlliance(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    @permission.can_edit("Alliance")
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            alliance = Alliance.update_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "name" : alliance.name })))

