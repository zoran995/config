import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { join } from 'path';
import { ConfigService } from '../../../lib';
import { AppModule } from '../../src/json/app.module';

describe('Schema validation', () => {
  let app: INestApplication;
  const errorMessage = 'Validation error';
  const validate = (config: Record<string, any>) => {
    if (!('port' in config && 'database_name' in config)) {
      throw new Error(errorMessage);
    }
    return {};
  };

  it(`should prevent application from bootstrapping if error is thrown due to loaded json variables`, async () => {
    let hasThrown = false;
    try {
      const module = await Test.createTestingModule({
        imports: [AppModule.withValidateFunction(validate)],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    } catch (err) {
      hasThrown = true;
      expect(err.message).toEqual(errorMessage);
    }
    expect(hasThrown).toBe(true);
  });

  it(`should load json variables if everything is ok`, async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.withValidateFunction(validate, join(__dirname, 'valid.json')),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const configService = app.get(ConfigService);
    expect(typeof configService.get('PORT')).not.toBe(undefined);
    expect(typeof configService.get('DATABASE_NAME')).not.toBe(undefined);
  });

  it(`should parse loaded json variables`, async () => {
    const validateAndTransform = (config: Record<string, any>) => {
      return {
        PORT: Number(config.PORT),
        DATABASE_NAME: config.DATABASE_NAME,
      };
    };
    const module = await Test.createTestingModule({
      imports: [
        AppModule.withValidateFunction(
          validateAndTransform,
          join(__dirname, 'valid.json'),
        ),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const configService = app.get(ConfigService);
    expect(typeof configService.get('PORT')).toEqual('number');
  });
});
