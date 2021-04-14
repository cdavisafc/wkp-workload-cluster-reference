import * as eksCluster from './lib/eks-cluster';
import * as std from "@jkcfg/std";

export default std.read("clusters/default/wk-cluster.yaml").then(c => eksCluster.getEksctlConfig(c))
