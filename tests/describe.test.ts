import { describe, expect, it } from 'vitest';
import { describeCron } from '../src/index.js';

describe('describeCron', () => {
  const cases: ReadonlyArray<readonly [expression: string, description: string]> = [
    ['* * * * *', 'Every minute.'],
    ['*/5 * * * *', 'Every 5 minutes.'],
    ['10-59/15 * * * *', 'Every 15 minutes, starting at minute 10.'],
    ['0 0 * * *', 'At 00:00, every day.'],
    ['30 8 * * 1-5', 'At 08:30, on Monday through Friday.'],
    ['0 12 1 * 0', 'At 12:00, on day 1 of the month or on Sunday.'],
    ['15,45 9-17 * * 1', 'At minute 15 and 45, from 09:00 to 17:59, on Monday.'],
    ['0 9-17 * * 1-5', 'At minute 00, from 09:00 to 17:59, on Monday through Friday.'],
    ['* 9 * * *', 'Every minute, from 09:00 to 09:59.'],
    ['* */6 * * *', 'Every minute, every 6 hours.'],
    ['0 6,18 * * *', 'At minute 00, past hours 06 and 18, every day.'],
    ['0 0 29 2 *', 'At 00:00, on day 29 of the month, in February.'],
    ['30 8 1,15 * *', 'At 08:30, on days 1 and 15 of the month.'],
    ['0 12 1-3 * *', 'At 12:00, on days 1 through 3 of the month.'],
    ['0 0 1 3-5 *', 'At 00:00, on day 1 of the month, during March through May.'],
    ['0 0 * * 1,3,5', 'At 00:00, on Monday, Wednesday and Friday.'],
    ['0 0 * 2 *', 'At 00:00, every day, in February.'],
    ['0 0 1 1 *', 'At 00:00, on day 1 of the month, in January.'],
    ['@weekly', 'At 00:00, on Sunday.'],
    ['* * 1 1 1', 'Every minute, on day 1 of the month or on Monday, in January.'],
  ];

  it.each(cases)('describes %s', (expression, expected) => {
    expect(describeCron(expression)).toBe(expected);
  });

  it('honours formatting options', () => {
    expect(describeCron('30 8 * * 1-5', { capital: false, period: false })).toBe(
      'At 08:30, on Monday through Friday',
    );
  });
});
