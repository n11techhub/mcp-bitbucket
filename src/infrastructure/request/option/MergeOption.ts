export interface MergeOption {
    message?: string;
    strategy?: 'merge-commit' | 'squash' | 'fast-forward';
}