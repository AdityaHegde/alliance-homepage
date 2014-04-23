from google.appengine.ext import ndb

import logging
import webapp2

import random
import response
import re
import json
import math
import moduledata

def convert_query_to_dict(query, exclude=[]):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()

class ImageObject(moduledata.Module):
    imageData = ndb.TextProperty()


class (webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = '' 
        if self.member:
            self.response.out.write(json.dumps(response.success("success", "Camps Created")))


class ClearCampTargets(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_leader
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            delete_from_query(CampTargetMemberItem.query().fetch())
            campTars = moduledata.CampTarget.query().fetch()
            for campTar in campTars:
                for campTarItm in campTars.campItems:
                    campTarItm.completed = 0
                campTar.put()
            self.response.out.write(json.dumps(response.success("success", {})))


class CreateCampTargetMemberItem(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['email'] = self.member.email
            params['data']['qty'] = int(params['data']['qty'])
            campTarMemItm = CampTargetMemberItem.create_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "email" : campTarMemItm.email, "item" : campTarMemItm.item })))


class GetAllCampTargetMemberItems(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            campTarMemItms = convert_query_to_dict(CampTargetMemberItem.query(CampTargetMemberItem.email == self.member.email).fetch(), ["contributedTo"])
            self.response.out.write(json.dumps(response.success("success", campTarMemItms)))


class UpdateCampTargetMemberItem(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['email'] = self.member.email
            params['data']['qty'] = int(params['data']['qty'])
            campTarMemItm = CampTargetMemberItem.update_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "email" : campTarMemItm.email, "item" : campTarMemItm.item })))

