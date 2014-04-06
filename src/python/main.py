import os
import urllib
import json
import response
import member
import moduledata

from google.appengine.api import users
from google.appengine.ext import ndb

import logging
import webapp2

class MainPage(webapp2.RequestHandler):

    def get(self):
        user = users.get_current_user()
        if user:
            path = os.path.join(os.path.split(__file__)[0], 'public/index.html')
            page = open(path, 'r')
            logging.warn(page)
            self.response.out.write(page.read())
        else:
            self.redirect(users.create_login_url(self.request.uri))


class PageDataRequest(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json' 
        user = users.get_current_user()
        if user:
            memberObj = member.get_member_by_email(user.email())
            if memberObj:
                self.response.out.write(json.dumps(response.success("success", {
                  "userName" : user.nickname(),
                  "userMail" : user.email(),
                  "profile" : memberObj.to_dict(),
                })))
            else:
                self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))
        else:
            self.response.out.write(json.dumps(response.failure("401", "Unauthorised user")))


app = webapp2.WSGIApplication([
    ('/create_module', moduledata.CreateModuleRequest),
    ('/create_module_data', moduledata.CreateModuleDataRequest),
    ('/data', moduledata.GetFullData),
    ('/save_module', moduledata.SaveModuleRequest),
    ('/save_module_data', moduledata.SaveModuleDataRequest),
    ('/delete_module_data', moduledata.DeleteModuleDataRequest),
    ('/page_data', PageDataRequest),
    ('/validate', member.ValidateToken),
    ('/register', member.RegisterMember),
    ('/admin', member.AddAdmin),
    ('/invite_member', member.InviteMember),
    ('/update_profile', member.UpdateProfile),
    ('/', MainPage),
], debug=True)
