from google.appengine.ext import ndb

import logging
import webapp2

import modelbase
import random
import response
import re
import json
import member
import challengesdata
import math
import moduledata

def convert_query_to_dict(query, exclude=[]):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()

class ChallengeData(modelbase.ModelBase):
    name = ndb.StringProperty()
    first = ndb.StringProperty()
    second = ndb.StringProperty()
    third = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, data['name'])


def create_challenges_data():
    for challenge in challengesdata.challengesData:
        challengeObj = ChallengeData.query_model(challenge)
        if not challengeObj:
            challengeObj = ChallengeData.create_model(challenge)
        else:
            challengeObj = ChallengeData.update_model(challenge)


class GetAllChallengeData(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            challenges = convert_query_to_dict(ChallengeData.query().fetch())
            self.response.out.write(json.dumps(response.success("success", challenges)))
