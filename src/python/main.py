import os
import urllib
import json
import response
import member
import moduledata
import alliance

from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2

class MainPage(webapp2.RequestHandler):

    def get(self):
        user = member.validate_user(self)
        if user:
            path = os.path.join(os.path.split(__file__)[0], 'public/index.html')
            page = open(path, 'r')
            logging.warn(page)
            self.response.out.write(page.read())


app = webapp2.WSGIApplication([
    ('/dashboard/get', moduledata.GetDashboardData),
    ('/alliance/create', alliance.CreateAlliance),
    ('/alliance/get', alliance.GetAlliance),
    ('/alliance/update', alliance.UpdateAlliance),
    ('/module/create', moduledata.CreateModuleRequest),
    ('/module/update', moduledata.UpdateModuleRequest),
    ('/moduleData/create', moduledata.CreateModuleDataRequest),
    ('/moduleData/update', moduledata.UpdateModuleDataRequest),
    ('/moduleData/delete', moduledata.DeleteModuleDataRequest),
    ('/member/create', member.InviteMember),
    ('/profile/get', member.ProfileGetRequest),
    ('/profile/update', member.UpdateProfile),
    ('/validate', member.ValidateToken),
    ('/register', member.RegisterMember),
    ('/admin', member.AddAdmin),
    ('/', MainPage),
], debug=True)
