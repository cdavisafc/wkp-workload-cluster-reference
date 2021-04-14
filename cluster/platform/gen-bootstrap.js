import * as param from '@jkcfg/std/param';
import { generate } from '../../cluster-components/@wkp-cluster-components';

const gitopsParams = param.Object('gitopsParams');
const gitopsSecrets = param.Object('gitopsSecrets');

const config = {
	components: [{
		"name": "wkp-flux-bootstrap",
		"params": {
			"git": gitopsParams.git,
			"gitDeployKey": gitopsSecrets.sealedGitDeployKey["wkp-flux"],
			"imagePullSecret": gitopsSecrets.sealedImagePullSecrets.dockerio["wkp-flux"],
			"images": gitopsParams.images,
		},
	}]
};

export default generate(config);
