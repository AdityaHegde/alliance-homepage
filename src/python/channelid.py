from google.appengine.api import channel
from google.appengine.api import users
from google.appengine.ext import ndb

import modelbase
import logging
import webapp2
import member
import permission
import response
import json
import re
import camps
import datetime

def convert_query_to_dict(query, exclude=[]):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class ChannelId(modelbase.ModelBase):
    user_id = ndb.IntegerProperty()
    extra_param = ndb.IntegerProperty()
    token = ndb.StringProperty()

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "{0}__{1}".format(int(data['user_id']), int(data['extra_param'])))

    @classmethod
    def create_model(model, data):
        data['token'] = channel.create_channel("{0}__{1}".format(int(data['user_id']), int(data['extra_param'])), duration_minutes=24*60 - 1)
        return super(model, model).create_model(data)


class GetChannel(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            channelObj = ChannelId.query_model({ "user_id" : self.member.user_id, "extra_param" : self.request.get("extra_param") })
            if not channelObj:
                try:
                    channelObj = ChannelId.create_model({ "user_id" : self.member.user_id, "extra_param" : int(self.request.get("extra_param")) })
                    self.response.out.write(json.dumps(response.success("success", { "token" : channelObj.token })))
                except apiproxy_errors.OverQuotaError, message:
                    self.response.out.write(json.dumps(response.failure("500", message)))
            else:
                self.response.out.write(json.dumps(response.success("success", { "token" : channelObj.token })))


class CreateChannel(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['user_id'] = self.member.user_id
            params['data']['extra_param'] = int(params['data']['extra_param'])
            channelObj = ChannelId.query_model(params['data'])
            if channelObj:
                channelObj.key.delete()
            try:
                channelObj = ChannelId.create_model(params['data'])
                self.response.out.write(json.dumps(response.success("success", { "token" : channelObj.token })))
            except apiproxy_errors.OverQuotaError, message:
                self.response.out.write(json.dumps(response.failure("500", message)))


class RecieveMessage(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            msg = self.request.get("msg")
            for channelObj in ChannelId.query().fetch():
                channel.send_message(channelObj.token, json.dumps({ "message" : msg, "author" : self.member.gotaname }))
            self.response.out.write(json.dumps(response.success("success", {})))
    
