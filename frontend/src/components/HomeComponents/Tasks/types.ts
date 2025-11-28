export type CompletionSummary = Record<
  string,
  { total: number; completed: number }
>;

export type LabelMaps = {
  options: string[];
  valueToDisplay: Record<string, string>;
  displayToValue: Record<string, string>;
};
