from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2
import member
import response
import json
import re

def convert_query_to_dict(query, exclude = []):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()


class ModelBase(ndb.Model):
    excludeShort = []

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, data['id'])

    @classmethod
    def query_model(model, data):
        key = model.get_key_from_data(data)
        return key.get()

    @classmethod
    def create_model(model, data):
        key = model.get_key_from_data(data)
        modelObj = model(key=key)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj

    @classmethod
    def get_all_short(model):
        return convert_query_to_dict(model.query().fetch(), model.excludeShort)

    @classmethod
    def get_all_full(model):
        return convert_query_to_dict(model.query().fetch())

    @classmethod
    def get_short(model, data):
        modelObj = model.query_model(data)
        if modelObj:
            return modelObj.to_dict(exclude=model.excludeShort)
        else:
            return None

    @classmethod
    def get_full(model, data):
        modelObj = model.query_model(data)
        if modelObj:
            return modelObj.to_dict()
        else:
            return None

    @classmethod
    def update_model(model, data):
        modelObj = model.query_model(data)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj

    @classmethod
    def delete_model(model, data):
        modelObj = model.query_model(data)
        modelObj.key.delete()
        return modelObj


class ModelChild(ndb.Model):
    excludeShort = []

    @classmethod
    def get_key_from_data(model, data, parentData):
        return ndb.Key(parentData['parentModel'], parentData['id'])

    @classmethod
    def query_model(model, data, parentData):
        parentKey = model.get_key_from_data(data, parentData)
        return model.query(model.id == data['id'], ancestor=parentKey).get()

    @classmethod
    def create_model(model, data, parentData):
        parentKey = model.get_key_from_data(data, parentData)
        modelObj = model(parent=parentKey)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj

    @classmethod
    def get_all_short(model, data, parentData):
        parentKey = model.get_key_from_data(data, parentData)
        return convert_query_to_dict(model.query(ancestor=parentKey).fetch(), model.excludeShort)

    @classmethod
    def get_all_full(model, data, parentData):
        parentKey = model.get_key_from_data(data, parentData)
        return convert_query_to_dict(model.query(ancestor=parentKey).fetch())

    @classmethod
    def get_short(model, data, parentData):
        modelObj = model.query_model(data, parentData)
        if modelObj:
            return modelObj.to_dict(exclude=model.excludeShort)
        else:
            return None

    @classmethod
    def get_full(model, data, parentData):
        modelObj = model.query_model(data, parentData)
        if modelObj:
            return modelObj.to_dict()
        else:
            return None

    @classmethod
    def update_model(model, data, parentData):
        modelObj = model.query_model(data, parentData)
        modelObj.populate(**data)
        modelObj.put()
        return modelObj

    @classmethod
    def delete_model(model, data, parentData):
        modelObj = model.query_model(data, parentData)
        modelObj.key.delete()
        return modelObj
