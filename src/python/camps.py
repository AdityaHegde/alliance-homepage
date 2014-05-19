from google.appengine.ext import ndb

import logging
import webapp2

import modelbase
import random
import response
import re
import json
import member
import campsdata
import math
import moduledata

def convert_query_to_dict(query, exclude=[]):
    return [e.to_dict(exclude=exclude) for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()

class CampItem(ndb.Model):
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()

class CampLevel(modelbase.ModelBase):
    type = ndb.StringProperty()
    level = ndb.IntegerProperty()
    silver = ndb.IntegerProperty()
    time = ndb.StringProperty()
    spoils = ndb.IntegerProperty()
    items = ndb.StructuredProperty(CampItem, repeated=True)
    excludeShort = ["items"]

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "{0}__{1}".format(data['type'], data['level']))


class CampTargetContribution(ndb.Model):
    campTarKey = ndb.KeyProperty()
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()


class CampTargetMemberItem(modelbase.ModelBase):
    user_id = ndb.IntegerProperty()
    email = ndb.StringProperty()
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()
    contributedTo = ndb.StructuredProperty(CampTargetContribution, repeated=True)
    lastTransactions = ndb.StructuredProperty(CampTargetContribution, repeated=True)

    @classmethod
    def get_key_from_data(model, data):
        return ndb.Key(model, "{0}__{1}".format(data['user_id'], data['item']))


    def addContributed(modelObj, campTarContri):
        modelObj.lastTransactions.append(campTarContri)
        contributedTo = modelObj.contributedTo
        found = 0
        for contri in contributedTo:
            if contri.campTarKey == campTarContri['campTarKey'] and contri.item == campTarContri['item']:
                found = 1
                contri.qty += campTarContri['qty']
                if contri.qty == 0:
                    contributedTo.remove(contri)
        if found == 0:
            contributedTo.append(campTarContri)


    @classmethod
    def campItemsAdded(model, modelObj, qty):
        campTars = moduledata.CampTarget.query(moduledata.CampTarget.campItems.item == modelObj.item).order(moduledata.CampTarget.order).fetch()
        for campTar in campTars:
            campItems = filter(lambda item: item.item == modelObj.item, campTar.campItems)
            for campItm in campItems:
                diff = (campItm.qty - campItm.completed) - qty
                contributed = 0
                if diff > 0:
                    campItm.completed += qty
                    contributed = qty
                    qty = 0
                else:
                    qty -= (campItm.qty - campItm.completed)
                    campItm.completed = campItm.qty
                    contributed = campItm.qty - campItm.completed

                modelObj.addContributed({
                  "campTarKey" : campTar.key,
                  "item" : campItm.item,
                  "qty" : contributed,
                })

                if qty == 0:
                    break

            campTar.put()

            if qty == 0:
                break


    @classmethod
    def campItemsRemoved(model, modelObj, qty):
        for contribution in modelObj.contributedTo:
            campTar = contribution.campTarKey.get()
            campItems = filter(lambda item: item.item == modelObj.item, campTar.campItems)
            for campItm in campItems:
                diff = campItm.completed - qty
                logging.warn("{0} : diff".format(diff))
                contributed = 0
                if diff > 0:
                    logging.warn("{0} : {1} : gt0".format(qty, campItm.completed))
                    campItm.completed -= qty
                    contributed = -qty
                    qty = 0
                else:
                    logging.warn("{0} : {1} : lt0".format(qty, campItm.completed))
                    qty -= campItm.completed
                    contributed = -campItm.completed
                    campItm.completed = 0

                modelObj.addContributed({
                  "campTarKey" : contribution.campTarKey,
                  "item" : campItm.item,
                  "qty" : contributed,
                })

                if qty == 0:
                    break

            campTar.put()

            if qty == 0:
                break


    @classmethod
    def create_model(model, data):
        key = model.get_key_from_data(data)
        modelObj = model(key=key)
        modelObj.populate(**data)
        modelObj.lastTransactions = []
        model.campItemsAdded(modelObj, modelObj.qty)
        modelObj.put()
        return modelObj


    @classmethod
    def update_model(model, data):
        modelObj = model.query_model(data)

        data['qty'] = int(data['qty'])
        qty = data['qty'] - modelObj.qty
        modelObj.lastTransactions = []
        if qty > 0:
            logging.warn("Added")
            model.campItemsAdded(modelObj, qty)
        elif qty < 0:
            logging.warn("Removed")
            model.campItemsRemoved(modelObj, -qty)

        modelObj.populate(**data)
        modelObj.put()
        return modelObj


def create_camps_data():
    for camp in campsdata.campsData:
        campObj = CampLevel.query_model(camp)
        if not campObj:
            campObj = CampLevel.create_model(camp)
        else:
            campObj = CampLevel.update_model(camp)


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


def convert_last_transaction(lastTransactions):
    arrayDict = []
    for lt in lastTransactions:
        dt = lt.to_dict(exclude=["campTarKey"])
        dt['camp'] = lt.campTarKey.get().id
        arrayDict.append(dt)

    return arrayDict


class CreateCampTargetMemberItem(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['user_id'] = self.member.user_id
            params['data']['qty'] = int(params['data']['qty'])
            campTarMemItm = CampTargetMemberItem.create_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "user_id" : campTarMemItm.user_id, "item" : campTarMemItm.item, "lastTransactions" : convert_last_transaction(campTarMemItm.lastTransactions) })))


class GetAllCampTargetMemberItems(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            campTarMemItms = convert_query_to_dict(CampTargetMemberItem.query(CampTargetMemberItem.user_id == self.member.user_id).fetch(), ["contributedTo", "lastTransactions"])
            self.response.out.write(json.dumps(response.success("success", campTarMemItms)))


class UpdateCampTargetMemberItem(webapp2.RequestHandler):

    @member.validate_user
    @member.validate_user_is_member
    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        if self.member:
            params = json.loads(self.request.body)
            params['data']['user_id'] = self.member.user_id
            params['data']['qty'] = int(params['data']['qty'])
            campTarMemItm = CampTargetMemberItem.update_model(params['data'])
            self.response.out.write(json.dumps(response.success("success", { "user_id" : campTarMemItm.user_id, "item" : campTarMemItm.item, "lastTransactions" : convert_last_transaction(campTarMemItm.lastTransactions) })))

