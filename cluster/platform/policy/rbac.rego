package rbac

##
## User roles
## ----------
## 
## Give a user one or more roles
##

user_roles = {
  "John Smith": ["cluster-admin"],
  "Alice": ["foo-app-owner"]
}

##
## Permissions
## ----------
## 
## What each role can access
##

permissions = {
  "cluster-admin": [{"context": "yaml", "match": {"kind": ["*"]}}],
  "foo-app-owner": [{"context": "yaml", "match": {"namespace": ["foo"]}}]
}

##
## Rejections
## ----------
## 
## What each role can't access
##

rejections = {
      "non-critical": [{"context": "yaml", "match": {"label": [{"acme/production-level": "critical"}]}}]
}
