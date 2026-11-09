import {mergeConfig} from 'vite';
import config from '../vite.config';
export default mergeConfig(config,{server:{watch:{usePolling:true,ignored:['**/docs/**','**/scratch/w61-baseline/**','**/scratch/w6-baseline/**']}}});
