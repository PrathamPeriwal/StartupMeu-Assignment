import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

process.env.JWT_SECRET ??= 'test-secret';
const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/jobtrail_test';

before(async () => {
  await mongoose.connect(MONGO_URL);
  await mongoose.connection.dropDatabase();
  await mongoose.syncIndexes(); // unique email index must exist before the duplicate test
});
after(() => mongoose.disconnect());

async function signUp(email) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ name: 'Test', email, password: 'password123' }).expect(201);
  return agent;
}

describe('auth', () => {
  test('register, me, logout', async () => {
    const agent = await signUp('a@example.com');
    const me = await agent.get('/api/auth/me').expect(200);
    assert.equal(me.body.email, 'a@example.com');
    assert.equal(me.body.passwordHash, undefined);
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  test('rejects duplicate email, short password, bad credentials', async () => {
    await request(app).post('/api/auth/register').send({ name: 'X', email: 'A@example.com', password: 'password123' }).expect(409);
    await request(app).post('/api/auth/register').send({ name: 'X', email: 'b@example.com', password: 'short' }).expect(400);
    await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'wrong-password' }).expect(401);
    await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'x' }).expect(401);
    await request(app).post('/api/auth/login').expect(401); // no body at all
    await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'password123' }).expect(200);
  });
});

describe('applications', () => {
  let alice, bob;
  before(async () => {
    alice = await signUp('alice@example.com');
    bob = await signUp('bob@example.com');
  });

  test('requires auth', async () => {
    await request(app).get('/api/applications').expect(401);
  });

  test('CRUD, search and ownership', async () => {
    const { body: created } = await alice
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Backend Engineer', status: 'applied', user: 'ignored' })
      .expect(201);
    await alice.post('/api/applications').send({ company: 'Globex', role: 'Frontend Dev' }).expect(201);

    assert.equal((await alice.get('/api/applications?q=acme').expect(200)).body.length, 1);
    assert.equal((await alice.get('/api/applications?q=.*').expect(200)).body.length, 0, 'regex is escaped');
    assert.equal((await alice.get('/api/applications?status=wishlist').expect(200)).body.length, 1);

    const { body: moved } = await alice.patch(`/api/applications/${created._id}`).send({ status: 'interview' }).expect(200);
    assert.equal(moved.status, 'interview');

    // Bob can neither see nor touch Alice's data.
    assert.equal((await bob.get('/api/applications').expect(200)).body.length, 0);
    await bob.patch(`/api/applications/${created._id}`).send({ status: 'offer' }).expect(404);
    await bob.delete(`/api/applications/${created._id}`).expect(404);

    await alice.delete(`/api/applications/${created._id}`).expect(204);
    await alice.delete(`/api/applications/${created._id}`).expect(404);
  });

  test('validation errors are 400s', async () => {
    await alice.post('/api/applications').send({ role: 'No company' }).expect(400);
    await alice.post('/api/applications').expect(400); // no body at all
    await alice.post('/api/applications').send({ company: 'A', role: 'B', status: 'ghosted' }).expect(400);
    await alice.post('/api/applications').send({ company: 'A', role: 'B', link: 'javascript:alert(1)' }).expect(400);
    await alice.patch('/api/applications/not-an-id').send({ status: 'offer' }).expect(400);
  });

  test('stats', async () => {
    const carol = await signUp('carol@example.com');
    for (const status of ['wishlist', 'applied', 'applied', 'interview', 'rejected']) {
      await carol.post('/api/applications').send({ company: 'C', role: 'R', status }).expect(201);
    }
    const { body } = await carol.get('/api/applications/stats').expect(200);
    assert.equal(body.total, 5);
    assert.equal(body.byStatus.applied, 2);
    assert.equal(body.responseRate, 50); // 2 heard back of 4 sent
  });
});
