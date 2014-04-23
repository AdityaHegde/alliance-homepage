from google.appengine.ext import ndb

import logging
import webapp2

import random
import response
import re
import json
import member
import campsdata
import math

def convert_query_to_dict(query):
    return [e.to_dict() for e in query]

def delete_from_query(query):
    for e in query:
        e.key.delete()

class CampItem(ndb.Model):
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()

class CampLevel(ndb.Model):
    type = ndb.StringProperty()
    level = ndb.IntegerProperty()
    silver = ndb.IntegerProperty()
    time = ndb.StringProperty()
    items = ndb.StructuredProperty(CampItem, repeated=True)
    spoils = ndb.IntegerProperty()

class CampTargetItem(ndb.Model):
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()
    completed = ndb.IntegerProperty()

class CampTarget(ndb.Model):
    type = ndb.StringProperty()
    fromlevel = ndb.IntegerProperty()
    tolevel = ndb.IntegerProperty()
    order = ndb.IntegerProperty()
    campItems = ndb.StructuredProperty(CampTargetItem, repeated=True)

class CampTargetMemberItem(ndb.Model):
    email = ndb.StringProperty()
    item = ndb.StringProperty()
    qty = ndb.IntegerProperty()


def create_camps_data():
    for camp in campsdata.campsData:
        campObj = CampLevel(**camp)
        campObj.put()

class CreateCamps(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "CampTarget")

        if memberObj:
            create_camps_data()
            self.response.out.write(json.dumps(response.success("success", "Camps Created")))


class GetCampTarget(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            type = self.request.get("type")
            fromlevel = int(self.request.get("fromlevel"))
            tolevel = int(self.request.get("tolevel"))
            campTar = CampTarget.query(CampTarget.type == type, CampTarget.fromlevel == fromlevel, CampTarget.tolevel == tolevel).get()
            self.response.out.write(json.dumps(response.success("success", campTar.to_dict())))


class GetAllCampTargets(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            campTars = convert_query_to_dict(CampTarget.query().order(CampTarget.order).fetch())
            self.response.out.write(json.dumps(response.success("success", campTars)))


def createCampTargetItems(campTar):
    campLvls = CampLevel.query(CampLevel.type == campTar.type, CampLevel.level >= campTar.fromlevel, CampLevel.level <= campTar.tolevel)
    campTarItms = []
    campTarItmMap = {}
    for campLvl in campLvls:
        for campItm in campLvl.items:
            if campTarItmMap.has_key(campItm.item):
                campTarItmMap[campItm.item].qty += campItm.qty
            else:
                campTarItm = CampTargetItem()
                campTarItm.item = campItm.item
                campTarItm.qty = campItm.qty
                campTarItm.completed = 0
                campTarItmMap[campItm.item] = campTarItm
                campTarItms.append(campTarItm)
            #campTarItm.put()
    return campTarItms

class CreateCampTarget(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "CampTarget")

        if memberObj:
            params = json.loads(self.request.body)
            order = CampTarget.query().order(-CampTarget.order).get()
            if not order:
                order = 0
            else:
                order = order.order + 1
            campTar = CampTarget(**params['data'])
            campTar.campItems = createCampTargetItems(campTar)
            campTar.order = order
            campTar.put()
            self.response.out.write(json.dumps(response.success("success", campTar.to_dict())))


def deleteCampTargetItems(campTar):
    campTarItems = campTar.campItems
    for campTarItm in campTarItems:
        campTarMemItms = CampTargetMemberItem.query(CampTargetMemberItem.item == campTarItm.item).fetch()
        for campTarMemItm in campTarMemItms:
            if campTarItm.qty > 0:
                if campTarMemItm.qty > campTarItm.qty:
                    campTarMemItm.qty -= campTarItm.qty
                    campTarItm.qty = 0
                else:
                    campTarItm.qty -= campTarMemItm.qty
                    campTarMemItm.key.delete()

    campTar.campItems = filter(lambda itm: itm.qty > 0, campTar.campItems)


class UpdateCampTarget(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "CampTarget")

        if memberObj:
            params = json.loads(self.request.body)
            campTar = CampTarget.query(CampTarget.type == params['type'], CampTarget.fromlevel == params['fromlevel'], CampTarget.tolevel == params['tolevel']).get()
            campTar.order = params['data']['order']
            campTar.put()
            self.response.out.write(json.dumps(response.success("success", { "type" : campTar.type, "fromlevel" : campTar.fromlevel, "tolevel" : campTar.tolevel })))


class DeleteCampTarget(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "CampTarget")

        if memberObj:
            params = json.loads(self.request.body)
            campTar = CampTarget.query(CampTarget.type == params['type'], CampTarget.fromlevel == params['fromlevel'], CampTarget.tolevel == params['tolevel']).get()
            deleteCampTargetItems(campTar)
            campTar.key.delete()
            self.response.out.write(json.dumps(response.success("success", {})))


class ClearCampTargets(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member_and_can_edit(self, "CampTarget")

        if memberObj:
            delete_from_query(CampTargetMemberItem.query().fetch())
            campTars = CampTarget.query().fetch()
            for campTar in campTars:
                for campTarItm in campTars.campItems:
                    campTarItm.completed = 0
                campTar.put()
            self.response.out.write(json.dumps(response.success("success", {})))


def update_camp_target_items(campTarMemItm, qty):
    campTars = CampTarget.query(CampTarget.campItems.item == campTarMemItm.item).fetch()
    absQty = int(math.fabs(qty))
    sign = int(qty/absQty)
    updatedCampTars = []
    for campTar in campTars:
        updatedItems = []
        updated = 0
        campItems = filter(lambda item: item.item == campTarMemItm.item, campTar.campItems)
        for campItm in campItems:
            #if +ve, campQty = campItm.qty, if -ve campQty = 0
            campQty = int( (1 + sign) * campItm.qty / 2 )
            #if +ve, campQtyCompletedDiff = campItm.qty - campItm.completed, if -ve campQtyCompletedDiff = campItm.completed
            campQtyCompletedDiff = campQty - sign * campItm.completed
            diff = campQtyCompletedDiff - absQty
            if diff > 0:
                campItm.completed += qty
                qty = 0
            else:
                qty -= sign * campQtyCompletedDiff
                campItm.completed = campQty

            updated = 1
            updatedItems.append(campItm.to_dict(exclude=["qty"]))

            if qty == 0:
                break

        if updated:
            campTar.put()
            updatedCampTars.append({ "camp" : campTar.to_dict(exclude=["campItems", "order"]), "items" : updatedItems })

        if qty == 0:
            break

    return updatedCampTars

class CreateCampTargetMemberItem(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            params = json.loads(self.request.body)
            campTarMemItm = CampTargetMemberItem()
            campTarMemItm.email = memberObj.email
            campTarMemItm.item = params['data']['item']
            campTarMemItm.qty = int(params['data']['qty'])
            campTarMemItm.put()
            updated = update_camp_target_items(campTarMemItm, campTarMemItm.qty)
            self.response.out.write(json.dumps(response.success("success", { "email" : campTarMemItm.email, "item" : campTarMemItm.item }, { "updated" : updated })))


class GetAllCampTargetMemberItems(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            campTarMemItms = convert_query_to_dict(CampTargetMemberItem.query(CampTargetMemberItem.email == memberObj.email).fetch())
            self.response.out.write(json.dumps(response.success("success", campTarMemItms)))


class UpdateCampTargetMemberItem(webapp2.RequestHandler):

    def post(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            params = json.loads(self.request.body)
            campTarMemItm = CampTargetMemberItem.query(CampTargetMemberItem.email == memberObj.email, CampTargetMemberItem.item == params['data']['item']).get()
            qtyDiff = int(params['data']['qty']) - campTarMemItm.qty
            campTarMemItm.qty = int(params['data']['qty'])
            campTarMemItm.put()
            updated = update_camp_target_items(campTarMemItm, qtyDiff)
            self.response.out.write(json.dumps(response.success("success", { "email" : campTarMemItm.email, "item" : campTarMemItm.item }, { "updated" : updated })))


class DeleteCampTargetMemberItem(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        memberObj = member.validate_user_is_member(self)

        if memberObj:
            params = json.loads(self.request.body)
            campTarMemItm = CampTargetMemberItem.query(CampTargetMemberItem.email == memberObj.email, CampTargetMemberItem.item == params['data']['item']).get()
            campTarMemItm.qty = int(params['data']['qty'])
            campTarMemItm.put()
            self.response.out.write(json.dumps(response.success("success", { "email" : campTarMemItm.email, "item" : campTarMemItm.item })))


