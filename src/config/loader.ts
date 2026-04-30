import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { defaultConfig } from './defaultConfig.js';
import type { CmdLoveConfig, ConfigLoadResult } from './types.js';
import { validateConfig } from './validation.js';

export interface ConfigPaths {
  userDataPath: string;
  fileName?: string;
}

export function getConfigPath(paths: ConfigPaths): string {
  return path.join(paths.userDataPath, paths.fileName ?? 'config.json');
}

export function loadConfig(paths: ConfigPaths): ConfigLoadResult {
  const configPath = getConfigPath(paths);
  ensureDefaultConfig(configPath);

  try {
    const content = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    const errors = validateConfig(parsed);

    if (errors.length > 0) {
      return { config: defaultConfig, configPath, errors };
    }

    return { config: parsed as CmdLoveConfig, configPath, errors: [] };
  } catch (error) {
    return {
      config: defaultConfig,
      configPath,
      errors: [`Unable to read config: ${formatError(error)}`],
    };
  }
}

export function writeDefaultConfig(configPath: string): void {
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(`${configPath}.example`, `${JSON.stringify(defaultConfig, null, 2)}\n`, 'utf8');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, `${JSON.stringify(defaultConfig, null, 2)}\n`, 'utf8');
  }
}

function ensureDefaultConfig(configPath: string): void {
  if (!existsSync(configPath)) {
    writeDefaultConfig(configPath);
    return;
  }

  const examplePath = `${configPath}.example`;
  if (!existsSync(examplePath)) {
    writeDefaultConfig(configPath);
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
