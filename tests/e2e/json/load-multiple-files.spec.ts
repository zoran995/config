import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/json/app.module';

describe('Environment variables (multiple json files)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.withMultipleFiles()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return loaded env variables`, () => {
    const config = app.get(AppModule);
    expect(config.getPort()).toEqual(3000);
    expect(config.getTimeout()).toEqual(5000);
  });

  afterEach(async () => {
    await app.close();
  });
});
