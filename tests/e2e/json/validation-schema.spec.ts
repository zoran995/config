import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { join } from 'path';
import { ConfigService } from '../../../lib';
import { AppModule } from '../../src/json/app.module';

describe('Schema validation', () => {
  let app: INestApplication;

  it(`should validate loaded json variables`, async () => {
    try {
      const module = await Test.createTestingModule({
        imports: [AppModule.withSchemaValidation()],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    } catch (err) {
      expect(err.message).toEqual(
        'Config validation error: "port" is required. "database_name" is required',
      );
    }
  });

  it(`should parse loaded json variables`, async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.withSchemaValidation(join(__dirname, 'valid.json'))],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const configService = app.get(ConfigService);
    expect(typeof configService.get('port')).toEqual('number');
  });
});
