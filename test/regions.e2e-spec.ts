import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('RegionsController (e2e)', () => {
  let app: INestApplication;
  let tempRegionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Full Lifecycle: Create -> Get -> Update -> Delete', async () => {
    try {
      const uniqueId = `T-${Date.now()}`;
      // 1. CREATE
      const createRes = await request(app.getHttpServer())
        .post('/api/regions')
        .send({
          id: uniqueId,
          name: 'Test Region',
          level: 'PJ'
        })
        .expect(201);

      tempRegionId = createRes.body._id;
      expect(createRes.body.name).toBe('Test Region');

      // 2. GET BY ID
      await request(app.getHttpServer())
        .get(`/api/regions/${tempRegionId}`)
        .expect(200)
        .then(res => {
          expect(res.body.name).toBe('Test Region');
        });

      // 3. UPDATE
      await request(app.getHttpServer())
        .patch(`/api/regions/${tempRegionId}`)
        .send({ name: 'Updated Region Name' })
        .expect(200);

      // 4. DELETE (Normal Flow)
      await request(app.getHttpServer())
        .delete(`/api/regions/${tempRegionId}`)
        .expect(200);

    } finally {
      // 5. CLEANUP (Ensures deletion if any step above failed)
      if (tempRegionId) {
        await request(app.getHttpServer()).delete(`/api/regions/${tempRegionId}`);
      }
    }
  });

  it('/api/regions (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/regions')
      .expect(200)
      .then(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
