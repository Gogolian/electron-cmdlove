import { describe, expect, it, vi } from 'vitest';
import type { CmdLoveConfig } from '../src/config/types.js';
import { buildTrayMenuTemplate } from '../src/menu/trayMenu.js';

const config: CmdLoveConfig = {
  terminals: { cmd: { type: 'cmd' } },
  defaultTerminal: 'cmd',
  menu: [
    { type: 'command', id: 'one', label: 'One', command: 'echo one' },
    {
      type: 'group',
      label: 'Group',
      items: [
        { type: 'command', id: 'two', label: 'Two', command: 'echo two' },
      ],
    },
  ],
};

describe('tray menu generation', () => {
  it('generates configured commands and dynamic utility items', () => {
    const template = buildTrayMenuTemplate({
      config,
      configErrors: [],
      actions: {
        launchCommand: vi.fn(),
        reloadConfig: vi.fn(),
        openConfig: vi.fn(),
        openLogs: vi.fn(),
      },
    });

    expect(
      template.map((item) => item.label ?? item.role ?? item.type),
    ).toEqual([
      'One',
      'Group',
      'separator',
      'Reload config',
      'Open config',
      'Open logs',
      'separator',
      'quit',
    ]);
  });

  it('shows disabled config errors before default menu items', () => {
    const template = buildTrayMenuTemplate({
      config,
      configErrors: ['menu[0].label must be a non-empty string.'],
      actions: {
        launchCommand: vi.fn(),
        reloadConfig: vi.fn(),
        openConfig: vi.fn(),
        openLogs: vi.fn(),
      },
    });

    expect(template[0]).toMatchObject({
      label: 'Config errors - using defaults',
      enabled: false,
    });
    expect(template[1]).toMatchObject({
      label: 'menu[0].label must be a non-empty string.',
      enabled: false,
    });
  });
});
