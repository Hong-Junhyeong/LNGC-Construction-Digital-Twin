import {masterTasks,masterDependencies,masterRequirements,masterAllocations} from '@/data/master-schedule';
import {simulateScenario} from './simulate';
// P13: What-If and CPM operate on relative master-calendar days, never playback steps.
export const simulationInput={tasks:masterTasks,dependencies:masterDependencies,requirements:masterRequirements,allocations:masterAllocations};
export const baselineCalculation=simulateScenario(simulationInput,null);
