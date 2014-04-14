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


class Alliance(ndb.Model):
    name = ndb.StringProperty()
    motto = ndb.StringProperty()


class CreateAlliance(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Alliance")

        if memberObj:
            params = json.loads(self.request.body)
            allianceData = params['data']
            alliance = Alliance()
            alliance.populate(**allianceData)
            alliance.put()
            self.response.out.write(json.dumps(response.success("success", {})))

class GetAlliance(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)
        if memberObj:
            members = convert_query_to_dict(member.Member.query().fetch())
            allianceObj = Alliance.query().get()
            allianceData = allianceObj.to_dict()
            allianceData['members'] = members
            self.response.out.write(json.dumps(response.success("success", allianceData)))


class UpdateAlliance(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "Alliance")

        if memberObj:
            params = json.loads(self.request.body)
            allianceData = params['data']
            alliance = Alliance.query().get()
            alliance.populate(**allianceData)
            alliance.put()
            self.response.out.write(json.dumps(response.success("success", {})))
