package user_policy

##
## User Policies
## ---------------------------------------
##
## You can enable various `check`s here to ensure the system stays configured in a certain way.
## Read more in the user guide:
##
##   `wk user-guide`
##


##
## Utils
## ---------------------------------------
##

# Split a yaml file delimited with `---` into multiple kubernetes objects
yaml_items(s) = result {
  vals := split(s, "---\n")
  result := [item | val := vals[_]
                    val != ""
                    item := yaml.unmarshal(val)]
}


##
## Critical Deployment Replica Count
## ---------------------------------------
##
## Ensure that any Deployment with a label pair:
##   - "acme/production-level": "critical"
## has at least 2 replicas.
##

check[result] {
  items := yaml_items(input.content)
  item := items[_]
  item.kind == "Deployment"
  item.metadata.labels["acme/production-level"] == "critical"
  item.spec.replicas < 2
  result := {"deny": sprintf(`Critical production deployment: %q may not have fewer than 2 replicas`, [item.metadata.name])}
}


##
## Restrict service ports to a range
## ---------------------------------------
##
## Restrict all service ports to a given range. Here its [2000..2999].
##
## To limit this check to a specific service you can add additional clauses:
##   item.metadata.name == "MyService"
##

# check[result] {
#   items := yaml_items(input.content)
#   item := items[_]
#   item.kind == "Service"
#   ports = item.spec.ports
#   p := ports[_]
#   min_port := 2000
#   max_port := 2999
#   any({ p.port < min_port, p.port > max_port })
#   result := {"deny": sprintf(`Service '%v' can't use that port. (%v <= port <= %v)`, [item.metadata.name, min_port, max_port])}
# }
