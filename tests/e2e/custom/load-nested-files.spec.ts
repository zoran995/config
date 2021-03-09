import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/custom/app.module';

describe('Nested Files', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.withNestedLoadedConfigurations()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return nested loaded configuration`, () => {
    const host = app.get(AppModule).getNestedDatabaseHost();
    expect(host).toEqual('host');
    const timeout = app.get(AppModule).getTimeout();
    expect(timeout).toEqual(5000);
  });

  afterEach(async () => {
    await app.close();
  });
});
