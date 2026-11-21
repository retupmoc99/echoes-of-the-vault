/** Public surface of the engine. The UI should import from here only. */
export * from './types';
export * from './rng';
export { createCombat, step, defaultCombatModifiers } from './combat/combat';
export { attackDamage } from './combat/damage';
export { needsTarget, resolveAmount } from './combat/effects';
export { previewIntent, type IntentPreview, type IntentKind } from './combat/intents';
export { maxStrain } from './combat/relics';
export { PLAYER_ID, livingEnemies } from './combat/context';
export { createRun, stepRun, reachableNodes, shrineHeal } from './run/run';
export { corruptionTier, combatModifiersFor } from './run/corruption';
export { optionAvailable } from './run/events';
export { describeCard, describeEffects, describeRelic, type Preview } from './text/describe';
export * from './save/save';
export { exportSave, importSave, type ImportResult } from './save/transfer';
export { createEcho, traitOf, hoursLeft, drainPerHour, loopDepth } from './idle/echoes';
export { advanceIdle, researchCost, researchComplete, reportIsEmpty, mergeReports, emptyReport } from './idle/idle';
export { closeLoop, prepareNextLoop, startLoop, nextRunPreview, runOptionsFor } from './idle/loop';
export { outpostStep, scoutInfo, type OutpostAction, type ScoutInfo } from './idle/outpost';
