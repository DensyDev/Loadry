type BranchLabel = {
  id: string;
  labelKey: string;
};

export function branchLabelFallback(branch: BranchLabel) {
  return branch.labelKey === `branches.${branch.id}` ? branch.id : branch.labelKey;
}
