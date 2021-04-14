import * as param from '@jkcfg/std/param';

const track = param.String('track');
const eksConfig = param.Object('eksConfig');
const wksConfig = param.Object('wksConfig');
const clusterName = param.String('clusterName');
const gitProvider = param.String('gitProvider');
const gitopsParams = param.Object('gitopsParams');
const gitopsSecrets = param.Object('gitopsSecrets');
const enabledFeatures = param.Object('enabledFeatures');
const fleetManagementDB = param.Object('fleetManagementDB');

const clusterInfo = {
    "name":  clusterName,
    "provider": track === 'eks'
      ? 'AWS (hosted EKS)'
      : ((wksConfig.flavor != null && wksConfig.flavor.name === 'eks-d')
          ? (track === 'wks-components' ? 'external (local EKS-D)' : 'CAPEI (local EKS-D)')
          : (track === 'wks-components' ? 'external' : 'CAPEI')),
    "regions": track === 'eks' ? eksConfig.clusterRegion : '',
    track
}

const dbConfig = {
    "postgresDB": fleetManagementDB.databaseType == "postgres",
    "sqliteDB": fleetManagementDB.databaseType == "sqlite",
    "sqliteWithHostPathVolume":
        fleetManagementDB.databaseType == 'sqlite' &&
        fleetManagementDB.sqliteConfig.hostPathVolume == true &&
        enabledFeatures.fleetManagement,
    ...fleetManagementDB,
}

const wkpFluxBootstrapComponent = {
    "name": "wkp-flux-bootstrap",
    "params": {
        "git": gitopsParams.git,
        "gitDeployKey": gitopsSecrets.sealedGitDeployKey["wkp-flux"],
        "imagePullSecret": gitopsSecrets.sealedImagePullSecrets.dockerio["wkp-flux"],
        "images": gitopsParams.images,
    }
};

const wkpGitopsRepoBroker = {
	"name": "wkp-gitops-repo-broker",
	"params": {
		"git": gitopsParams.git,
		"gitDeployKey": gitopsSecrets.sealedGitDeployKey["wkp-gitops-repo-broker"],
		"imagePullSecret": gitopsSecrets.sealedImagePullSecrets.dockerio["wkp-gitops-repo-broker"],
		"images": gitopsParams.images,
		"featureGates": enabledFeatures,
		"agentTemplate": {
			// nats or tls
			"natsScheme": "nats",
			"natsURL": "nats-client.wkp-gitops-repo-broker:4222",
		},
		dbConfig,
	},
}

const wkpFluxHelmOperatorComponent = {
    "name": "wkp-flux-helm-operator",
};

const wkpTillerComponent = {
    "name": "wkp-tiller",
};

const wkpExternalComponent = {
    "name": "wkp-external-dns",
};

const wkpPrometheusComponent = {
    "name": "wkp-prometheus",
    "params": {
        "endpoints": {
            "alertmanager": "/alertmanager/",
            "prometheus": "/prometheus/"
        }
    }
};

const wkpUIComponent = {
	"name": "wkp-ui",
	"params": {
		"endpoints": {
			"ui": "/"
		},
		"chart": {
			"values": {
				"config": {
					"clusterInfo": clusterInfo,
					"featureGates": enabledFeatures,
				}
			}
		},
		"git": {
			...gitopsParams.git,
			provider: gitProvider,
		},
		"gitDeployKey": gitopsSecrets.sealedGitDeployKey["wkp-ui"],
		"imagePullSecret": gitopsSecrets.sealedImagePullSecrets.dockerio["wkp-ui"],
		"ALBIngress": {
			"enabled": eksConfig.uiALBIngress === true
		}
	}
};

const wkpGrafanaComponent = {
    "name": "wkp-grafana",
    "params": {
        "dashboards-path": "cluster/platform/grafana-dashboards",
        "datasources": {
            "prometheus": {
                "url": "http://prometheus-operator-kube-p-prometheus.wkp-prometheus.svc:9090"
            }
        },
        "endpoints": {
            "grafana": "/grafana/"
        }
    }
};

const wkpScopeComponent = {
    "name": "wkp-scope",
    "params": {
        "endpoints": {
            "scope": "/scope/"
        }
    }
};

const wkpALBIngressController = {
    "name": "wkp-alb-ingress-controller",
    "params": {
        "clusterName": clusterInfo.name,
    }
};

const wkpWorkspacesController = {
  name: 'wkp-workspaces',
  disabled: !enabledFeatures.teamWorkspaces,
  params: {
    imagePullSecret:
      gitopsSecrets.sealedImagePullSecrets.dockerio['wkp-workspaces'],
    images: gitopsParams.images,
    endpoints: enabledFeatures.teamWorkspaces && { workspaces: '/workspaces/' },
  },
};

const wkpManifestLoader = {
  name: 'wkp-manifest-loader',
  params: {
    paths: [
      { path: './cluster/platform/workspaces', recursive: true },
      { path: './cluster/manifests', recursive: true },
      {
        path: './setup',
        // enable for ssh or footloose
        disabled: !(track == 'wks-ssh' || track == 'wks-footloose'),
      },
    ],
  },
};

const wkpMccp = {
  name: 'wkp-mccp',
  disabled: !enabledFeatures.fleetManagement,
  params: {
    dbConfig,
    // Over-ride the event-write connection
    // natsScheme: 'nats',
    // natsURL: 'nats-client.wkp-gitops-repo-broker:4222',
  },
};

const components = [
	wkpFluxBootstrapComponent,
	wkpFluxHelmOperatorComponent,
	wkpTillerComponent,
	wkpExternalComponent,
	wkpPrometheusComponent,
	wkpUIComponent,
	wkpGrafanaComponent,
	wkpScopeComponent,
	wkpGitopsRepoBroker,
	wkpWorkspacesController,
	wkpManifestLoader,
	wkpMccp,
];

const eksComponents = [
    wkpALBIngressController
];

if (track === 'eks') {
    components.push(...eksComponents);
}

export default components;

