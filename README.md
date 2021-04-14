# WKP

Cluster Repository

### Access the UI

To access the UI for this cluster, select the context of this cluster in your
`KUBECONFIG` and run:

```bash
wk ui
```

### Deploying with GitOps

To create a new deployment, add your Kubernetes manifests in the `cluster/manifests` directory.

Flux, running in the `wkp-flux` namespace, will traverse the directory structure and create the deployments.

For more information, see the `Running user workloads` page of the UI.

### Creating a Team Workspace

To create a new workspace view the `Workspaces` page of the UI,

or alternatively using `wk` from the command line, see:

```bash
wk workspaces create --help
```

### Access the User Guide

To find out more about WKP features, see our documentation by opening the user guide:

```bash
wk user-guide
```
