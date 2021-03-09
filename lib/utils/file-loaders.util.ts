import * as dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import * as fs from 'fs';
import { resolve } from 'path';
import {
  ConfigModuleEnvOptions,
  ConfigModuleJsonOptions,
  ConfigModuleOptions,
} from '../interfaces';

export function loadEnvFile(
  options: ConfigModuleEnvOptions,
): Record<string, any> {
  const envFilePaths = Array.isArray(options.filePath)
    ? options.filePath
    : [options.filePath || resolve(process.cwd(), '.env')];

  let config: ReturnType<typeof dotenv.parse> = {};
  for (const envFilePath of envFilePaths) {
    if (fs.existsSync(envFilePath)) {
      config = Object.assign(
        dotenv.parse(fs.readFileSync(envFilePath, options.encoding ?? 'utf-8')),
        config,
      );
      if (options.expandVariables) {
        config = dotenvExpand({ parsed: config }).parsed || config;
      }
    }
  }
  return config;
}

export function loadJsonFile(
  options: ConfigModuleJsonOptions,
): Record<string, any> {
  const jsonFilePaths = Array.isArray(options.filePath)
    ? options.filePath
    : [options.filePath || resolve(process.cwd(), '.env')];
  let config = {};
  for (const jsonFilePath of jsonFilePaths) {
    if (fs.existsSync(jsonFilePath)) {
      config = Object.assign(
        JSON.parse(
          fs.readFileSync(jsonFilePath, options.encoding ?? 'utf-8').toString(),
        ),
        config,
      );
    }
  }
  return config;
}
