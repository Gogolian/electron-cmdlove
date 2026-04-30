import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/loader.js';
import { validateConfig } from '../src/config/validation.js';

function tempDir(): string {
  return mkdtempSync(path.join(os.tmpdir(), 'cmdlove-'));
}

describe('config loading and validation', () => {
  it('creates a user-editable default config when none exists', () => {
    const userDataPath = tempDir();
    const result = loadConfig({ userDataPath });

    expect(result.errors).toEqual([]);
    expect(result.configPath).toBe(path.join(userDataPath, 'config.json'));
    expect(result.config.defaultTerminal).toBe('conemu');
    expect(readFileSync(result.configPath, 'utf8')).toContain('sam-api');
  });

  it('falls back to defaults with clear validation errors', () => {
    const userDataPath = tempDir();
    writeFileSync(
      path.join(userDataPath, 'config.json'),
      '{"menu": []}',
      'utf8',
    );

    const result = loadConfig({ userDataPath });

    expect(result.config.defaultTerminal).toBe('conemu');
    expect(result.errors).toContain('terminals must be an object.');
    expect(result.errors).toContain(
      'defaultTerminal must be a non-empty string.',
    );
  });

  it('rejects unknown terminal references and duplicate command ids', () => {
    const errors = validateConfig({
      terminals: { cmd: { type: 'cmd' } },
      defaultTerminal: 'cmd',
      menu: [
        { type: 'command', id: 'one', label: 'One', command: 'echo one' },
        {
          type: 'command',
          id: 'one',
          label: 'Two',
          terminal: 'missing',
          command: 'echo two',
        },
      ],
    });

    expect(errors).toContain('menu[1].id "one" is duplicated.');
    expect(errors).toContain(
      'menu[1].terminal "missing" does not exist in terminals.',
    );
  });
});
