import { describe, expect, it } from 'vitest';
import { createLaunchPlan, findCommand } from '../src/commands/terminal.js';
import type { CmdLoveConfig } from '../src/config/types.js';

const config: CmdLoveConfig = {
  terminals: {
    cmd: { type: 'cmd', executable: 'cmd.exe', args: ['/d'] },
    conemu: { type: 'conemu', executable: 'ConEmu64.exe' },
    custom: { type: 'custom', executable: 'tool.exe', args: ['--base'] },
  },
  defaultTerminal: 'cmd',
  menu: [
    { type: 'command', id: 'root', label: 'Root', command: 'echo root' },
    {
      type: 'group',
      label: 'Group',
      items: [{ type: 'command', id: 'child', label: 'Child', args: ['--child'] }],
    },
  ],
};

describe('terminal launch plans', () => {
  it('builds cmd.exe arguments without shell execution', () => {
    const plan = createLaunchPlan(config, {
      type: 'command',
      id: 'docker',
      label: 'Docker',
      command: 'docker ps -a',
    });

    expect(plan.executable).toBe('cmd.exe');
    expect(plan.args).toEqual(['/d', '/k', 'docker ps -a']);
    expect(plan.detached).toBe(true);
  });

  it('builds ConEmu task arguments', () => {
    const plan = createLaunchPlan(config, {
      type: 'command',
      id: 'task',
      label: 'Task',
      terminal: 'conemu',
      task: '{sam-api}',
    });

    expect(plan.executable).toBe('ConEmu64.exe');
    expect(plan.args).toEqual(['-run', '{sam-api}']);
  });

  it('passes explicit custom args through', () => {
    const plan = createLaunchPlan(config, {
      type: 'command',
      id: 'custom',
      label: 'Custom',
      terminal: 'custom',
      args: ['--run', 'job'],
      detached: false,
    });

    expect(plan.args).toEqual(['--base', '--run', 'job']);
    expect(plan.detached).toBe(false);
  });

  it('finds nested command ids', () => {
    expect(findCommand(config, 'child')?.label).toBe('Child');
    expect(findCommand(config, 'missing')).toBeUndefined();
  });
});
