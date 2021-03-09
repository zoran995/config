import { Inject, Injectable, Optional } from '@nestjs/common';
import get from 'lodash.get';
import has from 'lodash.has';
import set from 'lodash.set';
import {
  CONFIGURATION_TOKEN,
  VALIDATED_CONFIGURATION_KEY,
} from './config.constants';
import { NoInferType } from './types';

@Injectable()
export class ConfigService<K = Record<string, any>> {
  get isCacheEnabled(): boolean {
    return this._isCacheEnabled;
  }

  set isCacheEnabled(value: boolean) {
    this._isCacheEnabled = value;
  }

  private readonly cache: Partial<K> = {} as any;
  private _isCacheEnabled = false;

  constructor(
    @Optional()
    @Inject(CONFIGURATION_TOKEN)
    private readonly internalConfig: Record<string, any> = {},
  ) {}

  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath
   * @param defaultValue
   */
  get<T = any>(propertyPath: keyof K): T | undefined;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath
   * @param defaultValue
   */
  get<T = any>(propertyPath: keyof K, defaultValue: NoInferType<T>): T;
  /**
   * Get a configuration value (either custom configuration or process environment variable)
   * based on property path (you can use dot notation to traverse nested object, e.g. "database.host").
   * It returns a default value if the key does not exist.
   * @param propertyPath
   * @param defaultValue
   */
  get<T = any>(propertyPath: keyof K, defaultValue?: T): T | undefined {
    const validatedConfigValue = this.getFromValidatedConfig(propertyPath);
    if (validatedConfigValue !== undefined) {
      return validatedConfigValue;
    }

    const processEnvValue = this.getFromProcessEnv(propertyPath, defaultValue);
    if (processEnvValue !== undefined) {
      return processEnvValue;
    }

    const internalValue = this.getFromInternalConfig(propertyPath);
    if (internalValue !== undefined) {
      return internalValue;
    }

    return defaultValue;
  }

  private getFromCache<T = any>(
    propertyPath: keyof K,
    defaultValue?: T,
  ): T | undefined {
    const cachedValue = get(this.cache, propertyPath);
    return cachedValue === undefined
      ? defaultValue
      : ((cachedValue as unknown) as T);
  }

  private getFromValidatedConfig<T = any>(
    propertyPath: keyof K,
  ): T | undefined {
    const validatedConfigValue = get(
      this.internalConfig[VALIDATED_CONFIGURATION_KEY],
      propertyPath,
    );
    return (validatedConfigValue as unknown) as T;
  }

  private getFromProcessEnv<T = any>(
    propertyPath: keyof K,
    defaultValue: any,
  ): T | undefined {
    if (
      this.isCacheEnabled &&
      has(this.cache as Record<any, any>, propertyPath)
    ) {
      const cachedValue = this.getFromCache(propertyPath, defaultValue);
      return cachedValue !== undefined ? cachedValue : defaultValue;
    }

    const processValue = get(process.env, propertyPath);
    this.setInCacheIfDefined(propertyPath, processValue);

    return (processValue as unknown) as T;
  }

  private getFromInternalConfig<T = any>(propertyPath: keyof K): T | undefined {
    const internalValue = get(this.internalConfig, propertyPath);
    return internalValue;
  }

  private setInCacheIfDefined(propertyPath: keyof K, value: any): void {
    if (typeof value === 'undefined') {
      return;
    }
    set(this.cache as Record<any, any>, propertyPath, value);
  }
}
