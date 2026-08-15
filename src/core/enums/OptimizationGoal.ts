/**
 * OptimizationGoal.ts — core/enums/
 *
 * Campaign optimization goals for the DSP platform. Each campaign targets
 * one optimization goal that determines the bidding strategy.
 */
export const OptimizationGoal = {
  MaximizeReach: 'maximize_reach',
  MaximizeClicks: 'maximize_clicks',
  MaximizeConversions: 'maximize_conversions',
  MinimizeCpa: 'minimize_cpa',
  MaximizeRoi: 'maximize_roi',
  MaximizeRoas: 'maximize_roas',
} as const;

export type OptimizationGoal = (typeof OptimizationGoal)[keyof typeof OptimizationGoal];