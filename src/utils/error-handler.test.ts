import { describe, expect, it } from 'vitest';
import { AppError } from './app-error.js';
import { formatCliError } from './error-handler.js';

describe('formatCliError', () => {
  it('includes an actionable hint for known errors', () => {
    expect(
      formatCliError(new AppError('CONNECTION_NOT_FOUND', 'Connection was not found'))
    ).toEqual({
      heading: 'Error [CONNECTION_NOT_FOUND]: Connection was not found',
      hint: 'Run "sshx list" to find the connection id.'
    });
  });

  it('keeps unknown errors concise', () => {
    expect(formatCliError(new Error('boom'))).toEqual({
      heading: 'Error [UNKNOWN]: boom'
    });
  });
});
