export type GitCommandType =
    | 'COMMIT'
    | 'CHECKOUT'
    | 'CREATE_BRANCH'
    | 'MERGE'
    | 'RESET'
    | 'LOG'
    | 'BRANCH'
    | 'CLEAR'
    | 'UNKNOWN'
    | 'ERROR';

export interface ParseResult {
    type: GitCommandType;
    payload?: any;
    error?: string;
}

export const parseCommand = (input: string): ParseResult => {
    const trimmed = input.trim();

    if (trimmed === 'clear') return { type: 'CLEAR' };

    if (!trimmed.startsWith('git ')) {
        return { type: 'UNKNOWN', error: `zsh: command not found: ${trimmed}` };
    }

    const args = trimmed.replace('git ', '');

    // git commit -m "message" or 'message'
    const commitMatch = args.match(/^commit -m ["'](.+)["']$/);
    if (commitMatch) {
        return { type: 'COMMIT', payload: { message: commitMatch[1] } };
    }

    // git branch
    if (args === 'branch') {
        return { type: 'BRANCH' };
    }

    // git checkout -b branch-name
    const checkoutNewMatch = args.match(/^checkout -b\s+(.+)$/);
    if (checkoutNewMatch) {
        return { type: 'CREATE_BRANCH', payload: { name: checkoutNewMatch[1].trim() } };
    }

    // git checkout branch-name/hash
    const checkoutMatch = args.match(/^checkout\s+(.+)$/);
    if (checkoutMatch) {
        return { type: 'CHECKOUT', payload: { target: checkoutMatch[1].trim() } };
    }

    // git merge source-branch
    const mergeMatch = args.match(/^merge\s+(.+)$/);
    if (mergeMatch) {
        return { type: 'MERGE', payload: { source: mergeMatch[1].trim() } };
    }
    // Error handling for empty merge
    if (args.startsWith('merge')) {
        return { type: 'ERROR', error: "Merge what? The void? Please specify a branch." };
    }

    // git reset --hard/--soft target
    const resetMatch = args.match(/^reset\s+(--hard|--soft)\s+(.+)$/);
    if (resetMatch) {
        return {
            type: 'RESET',
            payload: {
                mode: resetMatch[1], // --hard or --soft
                target: resetMatch[2].trim()
            }
        };
    }

    // git log
    if (args === 'log') {
        return { type: 'LOG' };
    }

    return { type: 'UNKNOWN', error: `git: '${args.split(' ')[0]}' is not a git command. See 'git --help'.` };
};
