import { DynamicModule, Module } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { isObject } from 'util';
import { ConfigHostModule } from './config-host.module';
import {
  CONFIGURATION_LOADER,
  CONFIGURATION_SERVICE_TOKEN,
  CONFIGURATION_TOKEN,
  VALIDATED_CONFIGURATION_KEY,
  VALIDATED_ENV_LOADER,
} from './config.constants';
import { ConfigService } from './config.service';
import { ConfigFactory, ConfigModuleOptions } from './interfaces';
import { ConfigFactoryKeyHost } from './utils';
import { createConfigProvider } from './utils/create-config-factory.util';
import { loadEnvFile, loadJsonFile } from './utils/file-loaders.util';
import { getRegistrationToken } from './utils/get-registration-token.util';
import { mergeConfigObject } from './utils/merge-configs.util';

@Module({
  imports: [ConfigHostModule],
  providers: [
    {
      provide: ConfigService,
      useExisting: CONFIGURATION_SERVICE_TOKEN,
    },
  ],
  exports: [ConfigHostModule, ConfigService],
})
export class ConfigModule {
  /**
   * Loads process environment variables depending on the "ignoreEnvFile" flag and "envFilePath" value.
   * Also, registers custom configurations globally.
   * @param options
   */
  static forRoot(
    options: ConfigModuleOptions = { type: 'env' },
  ): DynamicModule {
    const isConfigToLoad = options.load && options.load.length;
    const providers = (options.load || [])
      .map(factory =>
        createConfigProvider(factory as ConfigFactory & ConfigFactoryKeyHost),
      )
      .filter(item => item) as FactoryProvider[];

    const configProviderTokens = providers.map(item => item.provide);
    const configServiceProvider = {
      provide: ConfigService,
      useFactory: (configService: ConfigService) => {
        if (options.type === 'env' && options.cache) {
          (configService as any).isCacheEnabled = true;
        }
        return configService;
      },
      inject: [CONFIGURATION_SERVICE_TOKEN, ...configProviderTokens],
    };
    providers.push(configServiceProvider);

    const validatedConfigLoader = {
      provide: VALIDATED_ENV_LOADER,
      useFactory: async (host: Record<string, any>) => {
        const config = await this.loadFile(options);
        const validatedConfig: Record<string, any> = this.validateConfig(
          config,
          options,
        );
        host[VALIDATED_CONFIGURATION_KEY] = validatedConfig;
      },
      inject: [CONFIGURATION_TOKEN],
    };
    providers.push(validatedConfigLoader);

    return {
      module: ConfigModule,
      global: options.isGlobal,
      providers: isConfigToLoad
        ? [
            ...providers,
            {
              provide: CONFIGURATION_LOADER,
              useFactory: (
                host: Record<string, any>,
                ...configurations: Record<string, any>[]
              ) => {
                configurations.forEach((item, index) =>
                  this.mergePartial(host, item, providers[index]),
                );
              },
              inject: [CONFIGURATION_TOKEN, ...configProviderTokens],
            },
          ]
        : providers,
      exports: [ConfigService, ...configProviderTokens],
    };
  }

  /**
   * Registers configuration object (partial registration).
   * @param config
   */
  static forFeature(config: ConfigFactory): DynamicModule {
    const configProvider = createConfigProvider(
      config as ConfigFactory & ConfigFactoryKeyHost,
    );
    const serviceProvider = {
      provide: ConfigService,
      useFactory: (configService: ConfigService) => configService,
      inject: [CONFIGURATION_SERVICE_TOKEN, configProvider.provide],
    };

    return {
      module: ConfigModule,
      providers: [
        configProvider,
        serviceProvider,
        {
          provide: CONFIGURATION_LOADER,
          useFactory: (
            host: Record<string, any>,
            partialConfig: Record<string, any>,
          ) => {
            this.mergePartial(host, partialConfig, configProvider);
          },
          inject: [CONFIGURATION_TOKEN, configProvider.provide],
        },
      ],
      exports: [ConfigService, configProvider.provide],
    };
  }

  private static validateConfig(
    config: Record<string, any>,
    options: ConfigModuleOptions,
  ) {
    if (options.validate) {
      const validatedConfig = options.validate(config);
      if (options.type === 'env') {
        this.assignVariablesToProcess(validatedConfig);
      }
      return validatedConfig;
    } else if (options.validationSchema) {
      const validationOptions = this.getSchemaValidationOptions(options);
      const {
        error,
        value: validatedConfig,
      } = options.validationSchema.validate(config, validationOptions);
      if (error) {
        throw new Error(`Config validation error: ${error.message}`);
      }
      if (options.type === 'env') {
        this.assignVariablesToProcess(validatedConfig);
      }
      return validatedConfig;
    } else {
      if (options.type === 'env') {
        this.assignVariablesToProcess(config);
        return {};
      } else {
        return config;
      }
    }
  }

  private static async loadFile(
    options: ConfigModuleOptions,
  ): Promise<Record<string, any>> {
    if (options.type === 'env') {
      let config = await loadEnvFile(options);
      if (!options.ignoreEnvVars) {
        config = {
          ...config,
          ...process.env,
        };
      }
      return config;
    } else if (options.type === 'json') {
      return await loadJsonFile(options);
    } else if (options.type === 'custom') {
      return await options.configLoader();
    } else {
      throw new Error(`Incorrect configuration type: ${(<any>options).type}`);
    }
  }

  private static assignVariablesToProcess(config: Record<string, any>) {
    if (!isObject(config)) {
      return;
    }
    const keys = Object.keys(config).filter(key => !(key in process.env));
    keys.forEach(key => (process.env[key] = config[key]));
  }

  private static mergePartial(
    host: Record<string, any>,
    item: Record<string, any>,
    provider: FactoryProvider,
  ) {
    const factoryRef = provider.useFactory;
    const token = getRegistrationToken(factoryRef);
    mergeConfigObject(host, item, token);
  }

  private static getSchemaValidationOptions(options: ConfigModuleOptions) {
    if (options.validationOptions) {
      if (typeof options.validationOptions.allowUnknown === 'undefined') {
        options.validationOptions.allowUnknown = true;
      }
      return options.validationOptions;
    }
    return {
      abortEarly: false,
      allowUnknown: true,
    };
  }
}
