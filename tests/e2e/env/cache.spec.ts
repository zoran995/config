import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import get from 'lodash.get';
import { ConfigService } from '../../../lib';
import { AppModule } from '../../src/env/app.module';

describe('Cache', () => {
  let app: INestApplication;
  let envBackup: NodeJS.ProcessEnv;
  beforeAll(() => {
    envBackup = process.env;
  });
  describe('without cache', () => {
    beforeAll(async () => {
      process.env['NAME'] = 'TEST';
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule.withEnvVars()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    it(`should return loaded env variables from vars`, () => {
      const configService = app.get(ConfigService);
      expect(configService.get('NAME')).toEqual('TEST');
    });

    it(`should return new vars`, () => {
      process.env['NAME'] = 'CHANGED';
      const processValue = get(process.env, 'NAME');
      const configService = app.get(ConfigService);
      expect(configService.get('NAME')).toEqual('CHANGED');
    });
  });

  describe('with cache', () => {
    beforeAll(async () => {
      process.env['NAME'] = 'TEST';
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule.withCache()],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    it(`should return loaded env variables from vars`, () => {
      const configService = app.get(ConfigService);
      expect(configService.get('NAME')).toEqual('TEST');
    });

    it(`should return cached vars`, () => {
      process.env['NAME'] = 'CHANGED';
      const configService = app.get(ConfigService);
      expect(configService.get('NAME')).toEqual('TEST');
    });
  });

  afterEach(async () => {
    process.env = envBackup;
    await app.close();
  });
});
