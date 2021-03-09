import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/custom/app.module';

describe('Files', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.withLoadedConfigurations()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return loaded configuration`, () => {
    const host = app.get(AppModule).getDatabaseHost();
    expect(host).toEqual('host');
    const timeout = app.get(AppModule).getTimeout();
    expect(timeout).toEqual(5000);
  });

  it(`should return loaded configuration (injected through constructor)`, () => {
    const config = app.get(AppModule).getDatabaseConfig();
    expect(config.host).toEqual('host');
    expect(config.port).toEqual(4000);
  });

  afterEach(async () => {
    await app.close();
  });
});
