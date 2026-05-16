import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let tempUserId: string;

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
      const uniqueNpa = `T-NPA-${Date.now()}`;
      const uniqueEmail = `test-${Date.now()}@example.com`;
      // 1. CREATE
      const createRes = await request(app.getHttpServer())
        .post('/api/users')
        .send({
          npa: uniqueNpa,
          fullname: 'Test User',
          email: uniqueEmail,
          password: 'password123',
          role: 'anggota'
        })
        .expect(201);
      
      tempUserId = createRes.body._id;
      expect(createRes.body.fullname).toBe('Test User');

      // 2. GET BY ID
      await request(app.getHttpServer())
        .get(`/api/users/${tempUserId}`)
        .expect(200)
        .then(res => {
          expect(res.body.fullname).toBe('Test User');
        });

      // 3. UPDATE
      await request(app.getHttpServer())
        .patch(`/api/users/${tempUserId}`)
        .send({ fullname: 'Updated User Name' })
        .expect(200);

      // 4. DELETE (Normal Flow)
      await request(app.getHttpServer())
        .delete(`/api/users/${tempUserId}`)
        .expect(200);

    } finally {
      // 5. CLEANUP (Ensures deletion if any step above failed)
      if (tempUserId) {
        await request(app.getHttpServer()).delete(`/api/users/${tempUserId}`);
      }
    }
  });

  it('/api/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .then(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/api/users/with-status (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users/with-status')
      .expect(200)
      .then(res => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/api/users/check-npa/:npa (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users/check-npa/invalid_npa')
      .expect(404);
  });

  it('/api/users/login (POST) - Invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/users/login')
      .send({ email: 'nonexistent@example.com', password: 'password' })
      .expect(404);
  });
});
