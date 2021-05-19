# Salesforce.org IAM Demo Site

This is a basic Salesforce.org demo app for EDU and NGO customers designed to be hosted on Heroku and used by Solution Engineers (SE), Architects, and Cloud Specialists to demonstrate various aspects of Salesforce Identity, primarily focused on External Identity aspects of Salesforce Customer Access and Identity Management (CIAM).

The foundation of this work for the Embedded Login code of the app is credited to Frank Caron's basic Node.js reference implementation [here](https://github.com/frankcaron/salesforce-embedded-login-example). The PHP reference implementation, from which Frank's implementation is based, can be found [here](https://github.com/salesforceidentity/embedded-login-example). 
 * Related Reference and Information Links: 
    * Salesforce External Identity
      * [Salesforce External Identity Implementation Guide](https://developer.salesforce.com/docs/atlas.en-us.externalidentityImplGuide.meta/externalidentityImplGuide/external_identity_intro.htm) 
      * [External Identity License Details](https://developer.salesforce.com/docs/atlas.en-us.identityImplGuide.meta/identityImplGuide/users_license_types_external_identity.htm)
      * [About Salesforce Customer 360 Identity](https://developer.salesforce.com/docs/atlas.en-us.externalidentityImplGuide.meta/externalidentityImplGuide/external_identity_intro.htm)
      * [Salesforce Customer Single Source of Truth](https://www.salesforce.com/products/platform/features/single-source-of-truth/)
    * Salesforce Frontdoor.jsp
      * [Salesforce Frontdoor.jsp KB Article](https://help.salesforce.com/articleView?id=000332032&type=1&mode=1)
      * [Using Frontdoor.jsp to Bridge an Existing Session Into Salesforce](https://help.salesforce.com/articleView?id=sf.security_frontdoorjsp.htm&type=5)
    * Trailhead
      * [Manage Identity and Access](https://trailhead.salesforce.com/en/content/learn/trails/identity)
      * [Build Integrations Using Connected Apps](https://trailhead.salesforce.com/en/content/learn/trails/build-integrations-using-connected-apps)
    * Salesforce Identity - Supported Identity Authentication Flows
      * [OAuth 2.0 SAML Bearer Assertion Flow for Previously Authorized Apps](https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_SAML_bearer_flow.htm&type=5)
      * [SAML Assertion Flow for Accessing the Web Services API](https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_web_sso_flow.htm&type=5)
      * [JWT Bearer](https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_SAML_bearer_flow.htm&type=5)
      * [Single Sign On Implementation Guide](https://developer.salesforce.com/docs/atlas.en-us.sso.meta/sso/sso_about.htm)
    * Salesforce Identity [Examples on Github](https://github.com/salesforceidentity)  

The ultimate goal of this code is to support a Heroku app that can be used to dynamically support a variety of Salesforce dmo orgs with minimal setup on the part of Salesforce.org sales teams. 


# Prereqs

This app depends on several configuration and pre-setup steps to precede demo time, __most of which are accomplished by the Pre-Demo Setup option provided in this app's UI__ and are written to cookies and local browser storage to keep the app as reusable and stateless as possible for supporting multiple demo orgs and support simultaneous demonstrations by multiple sales teams:

* A Heroku account (if you want to replicate the app with the Heroku button below)
* A Salesforce demo org with:
  * A Connected App config for OAuth & SAML support for a Service Provider app (this app)
  * A Connected App config for Certificate-based (JWT Bearer) authentation for API access (this app)
  * An Experience Cloud Site/Community set up for Embedded Login and frontdoor.jsp access
  * A Single Sign On configuration record, enabled for the Community Site's Login & Registration settings (allowing this app to act as an IdP)
  * A simple Visualforce page to act as the root (/) homepage of the org (provides frontdoor.jsp retURL redirection back to this app)
  * A CORS entry for this app
  * Appropriate Identity Certificates

# Salesforce Connected App Set Up
Follow the instructions [here](https://developer.salesforce.com/docs/atlas.en-us.externalidentityImplGuide.meta/externalidentityImplGuide/external_identity_login_step_2.htm) for setting up a connected app. Make sure that you also select the 'Access and manage your data (api)' OAuth scope since we will be querying user data from the org. When configuring your connected app, use the URL `https://<yourherokuapp>.herokuapp.com/server_callback` for the call back. 

~~Maybe use custom attributes to show User profile sync with SP via OAuth or SAML~~

# Important Pre-Demo Items

* Using the (in this app) Pre-Demo Setup
  * Initial Authentication
  * What it does:
    * Metadata deployments
    * Demo User Creation 
* Make sure your user profile has all the required permissions for all pertinent objects if they are not already accounted for the Pre-Demo Setup menu of this app.
* Make sure you have tested the entire demo from start to finish multiple times.
* Experience Cloud Site config:
  * You will want to brand and otherwise configure record layouts for at least:
    * User
    * Account
    * Contact

# Heroku Button

[![One-Click Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

# To Do

* [ ] TBD

# Thanks

Big thanks to everyone's git repo examples on how to get started with this app as well as all the related Node/NPM modules to provided shortcuts to implement SAML, JWT, and OAuth flows.
