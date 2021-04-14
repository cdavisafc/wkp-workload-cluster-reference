import * as std from "@jkcfg/std";

const toArray = o => {
  if (o.kind != "List") {
    return [o];
  }
  return o.items;
}

const wrapAsFile = o => { return {path: "", value: o} }

// input: EKSCluster, output: ClusterConfig
const eksClusterToClusterConfig = o => {
  const { region, version, managedNodeGroupFile, ...specFiltered } = o.spec;

  let conf = {
	apiVersion: 'eksctl.io/v1alpha5',
	kind: 'ClusterConfig',
	metadata: {
	  name: o.metadata.name,
	  region: region,
      version: String(version),
	},
	status: o.status,
	...specFiltered,
  };

  return (managedNodeGroupFile != undefined && managedNodeGroupFile != "")
	? std.read(managedNodeGroupFile).then(mnGroups => ({...conf, ...mnGroups}))
	: new Promise(resolve => { resolve(conf) })
}

const getEksctlConfig = manifest => {
  return eksClusterToClusterConfig(manifest).then(config => toArray(config).map(wrapAsFile))
}

const addIAMServiceAccount = (cluster, namespace, serviceAccount, policyARNs) => {
	if (cluster.spec.iam == undefined) {
		cluster.spec.iam = {};
  }

  // We need an OIDC provider for this feature.
  const iam = cluster.spec.iam;
  iam.withOIDC = true;

  if (iam.serviceAccounts == undefined) {
    iam.serviceAccounts = [];
  }

  iam.serviceAccounts.push({
    metadata: {
      name: serviceAccount,
      namespace,
    },
    attachPolicyARNs: policyARNs,
  });
};

export {
  addIAMServiceAccount,
  getEksctlConfig,
}

