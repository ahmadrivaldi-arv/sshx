export interface SessionInputRoute {
  remoteData: string;
  pendingPrefix: string | undefined;
  openSnippets: boolean;
  remainder: string;
}

const snippetFunctionKeys = new Set(['\x1bOQ', '\x1b[12~', '\x1b[[B']);
const snippetPrefixes = new Set(['\x02', '\x07']);

export const normalizeNativeTerminalInput = (input: string): string =>
  input === '\n' ? '\r' : input;

export const routeSessionInput = (input: string, pendingPrefix?: string): SessionInputRoute => {
  if (snippetFunctionKeys.has(input)) {
    return {
      remoteData: '',
      pendingPrefix: undefined,
      openSnippets: true,
      remainder: ''
    };
  }

  if (pendingPrefix) {
    if (input[0]?.toLowerCase() === 's') {
      return {
        remoteData: '',
        pendingPrefix: undefined,
        openSnippets: true,
        remainder: input.slice(1)
      };
    }
    return {
      remoteData: `${pendingPrefix}${input}`,
      pendingPrefix: undefined,
      openSnippets: false,
      remainder: ''
    };
  }

  let prefixIndex = -1;
  for (let index = 0; index < input.length; index += 1) {
    if (snippetPrefixes.has(input[index] ?? '')) {
      prefixIndex = index;
      break;
    }
  }
  if (prefixIndex < 0) {
    return {
      remoteData: input,
      pendingPrefix: undefined,
      openSnippets: false,
      remainder: ''
    };
  }

  const prefix = input[prefixIndex];
  const beforePrefix = input.slice(0, prefixIndex);
  const afterPrefix = input.slice(prefixIndex + 1);
  if (!afterPrefix) {
    return {
      remoteData: beforePrefix,
      pendingPrefix: prefix,
      openSnippets: false,
      remainder: ''
    };
  }

  const routed = routeSessionInput(afterPrefix, prefix);
  return {
    ...routed,
    remoteData: `${beforePrefix}${routed.remoteData}`
  };
};
