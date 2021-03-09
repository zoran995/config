import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/json/app.module';

describe('Files', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.default()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it(`should return loaded configuration`, () => {
    const timeout = app.get(AppModule).getTimeout();
    expect(timeout).toEqual(5000);
  });

  afterEach(async () => {
    await app.close();
  });
});
