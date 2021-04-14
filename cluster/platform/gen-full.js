import * as param from '@jkcfg/std/param';
import { generate } from '../../cluster-components/@wkp-cluster-components';
import comp from './components';

const flatten = array => [].concat(...array);

const config = { components: comp };

export default Promise.all([
    generate(config),
]).then(flatten);
