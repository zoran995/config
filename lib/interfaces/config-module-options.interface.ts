import { ConfigFactory } from './config-factory.interface';

interface ConfigModuleBaseOptions {
  /**
   * If "true", registers `ConfigModule` as a global module.
   * See: https://docs.nestjs.com/modules#global-modules
   */
  isGlobal?: boolean;

  /**
   * Custom function to validate environment variables. It takes an object containing environment
   * variables as input and outputs validated environment variables.
   * If exception is thrown in the function it would prevent the application from bootstrapping.
   * Also, environment variables can be edited through this function, changes
   * will be reflected in the process.env object.
   */
  validate?: (config: Record<string, any>) => Record<string, any>;

  /**
   * Environment variables validation schema (Joi).
   */
  validationSchema?: any;

  /**
   * Schema validation options.
   * See: https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options
   */
  validationOptions?: Record<string, any>;

  /**
   * Array of custom configuration files to be loaded.
   * See: https://docs.nestjs.com/techniques/configuration
   */
  load?: Array<ConfigFactory>;
}

export interface ConfigModuleEnvOptions {
  type: 'env';
  /**
   * If "true", values from the process.env object will be cached in the memory.
   * This improves the overall application performance.
   * See: https://github.com/nodejs/node/issues/3104
   */
  cache?: boolean;

  /**
   * If "true", environment files (`.env`) will be ignored.
   */
  ignoreEnvFile?: boolean;

  /**
   * If "true", predefined environment variables will not be validated.
   */
  ignoreEnvVars?: boolean;

  /**
   * Path to the environment file(s) to be loaded.
   */
  filePath?: string | string[];

  /**
   * Environment file encoding.
   */
  encoding?: BufferEncoding;

  /**
   * A boolean value indicating the use of expanded variables.
   * If .env contains expanded variables, they'll only be parsed if
   * this property is set to true.
   */
  expandVariables?: boolean;
}

export interface ConfigModuleJsonOptions {
  type: 'json';
  /**
   * Path to the json file(s) to be loaded.
   */
  filePath?: string | string[];

  /**
   * Environment file encoding.
   */
  encoding?: BufferEncoding;
}

export interface ConfigModuleCustomLoaderOptions {
  type: 'custom';
  configLoader: () => Promise<Record<string, any>>;
}

export type ConfigModuleOptions = ConfigModuleBaseOptions &
  (
    | ConfigModuleEnvOptions
    | ConfigModuleJsonOptions
    | ConfigModuleCustomLoaderOptions
  );
