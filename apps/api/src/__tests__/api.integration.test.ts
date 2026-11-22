import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../lib/store.js';
import { INITIAL_SKILLS } from '../data/catalog-seed.js';

const app = createApp();

describe('SkillLoop REST API — Integration & E2E Flow Tests (PRD Section 18.2 & 18.3)', () => {
  beforeEach(() => {
    resetTestDatabase();
  });

  it('enforces authentication on private endpoints and hides passwordHash', async () => {
    const unauth = await request(app).get('/api/v1/profile/me');
    expect(unauth.status).toBe(401);
    expect(unauth.body.error.code).toBe('UNAUTHORIZED');

    const agent = request.agent(app);
    const reg = await agent.post('/api/v1/auth/register').send({
      email: 'baru@skillloop.id',
      password: 'PasswordKuat123!',
      displayName: 'Budi Santoso',
      timezone: 'Asia/Jakarta',
      languages: ['id', 'en']
    });

    expect(reg.status).toBe(201);
    expect(reg.body.data.email).toBe('baru@skillloop.id');
    expect(reg.body.data.passwordHash).toBeUndefined();

    // Duplicate email registration must fail with 409
    const dup = await request(app).post('/api/v1/auth/register').send({
      email: 'BARU@skillloop.id',
      password: 'PasswordKuat123!',
      displayName: 'Budi Duplikat'
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('searches canonical skills by name and curated aliases, and prevents duplicate declarations', async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({
      email: 'raka@demo.skillloop.id',
      password: 'DemoSkillLoop123!'
    });

    // Alias search: "js" -> JavaScript
    const aliasSearch = await agent.get('/api/v1/skills?q=js');
    expect(aliasSearch.status).toBe(200);
    expect(
      aliasSearch.body.data.some((s: { slug: string }) => s.slug === 'javascript')
    ).toBe(true);

    // Duplicate skill declaration with same role must fail with 409
    const jsSkillId = INITIAL_SKILLS.find((s) => s.slug === 'javascript')!.id;
    const dupSkill = await agent.post('/api/v1/skills/me').send({
      skillId: jsSkillId,
      role: 'TEACH',
      proficiencyLevel: 'ADVANCED'
    });
    expect(dupSkill.status).toBe(409);
    expect(dupSkill.body.error.code).toBe('DUPLICATE_SKILL_DECLARATION');
  });

  it('completes the full E2E reciprocal skill exchange journey: Match -> Request -> Accept -> Propose Session -> Confirm -> Complete', async () => {
    const rakaAgent = request.agent(app);
    const nayaAgent = request.agent(app);
    const farhanAgent = request.agent(app);

    // 1. Login as Raka and Naya (PRD Section 24.2 Demo Accounts)
    const rakaLogin = await rakaAgent.post('/api/v1/auth/login').send({
      email: 'raka@demo.skillloop.id',
      password: 'DemoSkillLoop123!'
    });
    expect(rakaLogin.status).toBe(200);
    const rakaId = rakaLogin.body.data.id;

    const nayaLogin = await nayaAgent.post('/api/v1/auth/login').send({
      email: 'naya@demo.skillloop.id',
      password: 'DemoSkillLoop123!'
    });
    expect(nayaLogin.status).toBe(200);
    const nayaId = nayaLogin.body.data.id;

    await farhanAgent.post('/api/v1/auth/login').send({
      email: 'farhan@demo.skillloop.id',
      password: 'DemoSkillLoop123!'
    });

    // 2. Raka discovers reciprocal matches -> Naya MUST be present; one-way candidates MUST NOT be present
    const matchesRes = await rakaAgent.get('/api/v1/matches');
    expect(matchesRes.status).toBe(200);
    const matches = matchesRes.body.data;
    expect(matches.length).toBeGreaterThanOrEqual(1);

    const nayaMatch = matches.find(
      (m: { user: { id: string } }) => m.user.id === nayaId
    );
    expect(nayaMatch).toBeDefined();
    expect(nayaMatch.explanation.aCanTeachB.length).toBeGreaterThanOrEqual(1);
    expect(nayaMatch.explanation.bCanTeachA.length).toBeGreaterThanOrEqual(1);

    // 3. Raka sends a collaboration request to Naya
    const createReqRes = await rakaAgent.post('/api/v1/requests').send({
      recipientId: nayaId,
      introMessage:
        'Halo Naya! Aku ingin belajar dasar UI/UX & Figma, dan siap membantumu belajar JavaScript dasar.'
    });
    expect(createReqRes.status).toBe(201);
    const requestId = createReqRes.body.data.id;
    expect(createReqRes.body.data.status).toBe('PENDING');

    // Duplicate pending request must be rejected (409)
    const dupReqRes = await rakaAgent.post('/api/v1/requests').send({
      recipientId: nayaId,
      introMessage: 'Request duplikat'
    });
    expect(dupReqRes.status).toBe(409);

    // Sender (Raka) cannot accept his own request (403)
    const selfAccept = await rakaAgent
      .patch(`/api/v1/requests/${requestId}`)
      .send({ action: 'ACCEPT' });
    expect(selfAccept.status).toBe(403);

    // Uninvolved user (Farhan) cannot access or modify the request (403)
    const farhanHack = await farhanAgent
      .patch(`/api/v1/requests/${requestId}`)
      .send({ action: 'ACCEPT' });
    expect(farhanHack.status).toBe(403);

    // 4. Naya receives notification and accepts the collaboration request
    const nayaNotifs = await nayaAgent.get('/api/v1/notifications');
    expect(nayaNotifs.status).toBe(200);
    expect(nayaNotifs.body.meta.unreadCount).toBeGreaterThanOrEqual(1);

    const acceptRes = await nayaAgent
      .patch(`/api/v1/requests/${requestId}`)
      .send({ action: 'ACCEPT' });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    // 5. Raka proposes a learning session in the future
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const proposeSessionRes = await rakaAgent.post('/api/v1/sessions').send({
      requestId,
      topic: 'Sesi 1: Pertukaran Dasar JavaScript DOM & Figma Auto-Layout',
      description: '30 menit pertama bedah DOM JS, 30 menit kedua praktik Auto-Layout di Figma.',
      startAt: futureDate,
      timezone: 'Asia/Jakarta',
      durationMinutes: 60
    });
    expect(proposeSessionRes.status).toBe(201);
    const sessionId = proposeSessionRes.body.data.id;
    expect(proposeSessionRes.body.data.status).toBe('PROPOSED');

    // Proposer (Raka) cannot self-confirm the schedule (403)
    const selfConfirm = await rakaAgent
      .patch(`/api/v1/sessions/${sessionId}`)
      .send({ action: 'CONFIRM' });
    expect(selfConfirm.status).toBe(403);

    // Uninvolved user (Farhan) cannot view the session (403)
    const farhanViewSession = await farhanAgent.get(
      `/api/v1/sessions/${sessionId}`
    );
    expect(farhanViewSession.status).toBe(403);

    // 6. Naya confirms the proposed session -> status becomes SCHEDULED
    const confirmRes = await nayaAgent
      .patch(`/api/v1/sessions/${sessionId}`)
      .send({ action: 'CONFIRM' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('SCHEDULED');
    // Instant in time must remain identical
    expect(new Date(confirmRes.body.data.startAt).toISOString()).toBe(futureDate);

    // 7. Mark session as COMPLETED
    const completeRes = await rakaAgent
      .patch(`/api/v1/sessions/${sessionId}`)
      .send({ action: 'COMPLETE' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    // 8. Verify block control prevents future discovery and requests
    const blockRes = await rakaAgent.post('/api/v1/blocks').send({
      userId: nayaId
    });
    expect(blockRes.status).toBe(201);

    const matchesAfterBlock = await rakaAgent.get('/api/v1/matches');
    expect(
      matchesAfterBlock.body.data.some(
        (m: { user: { id: string } }) => m.user.id === nayaId
      )
    ).toBe(false);

    // Report endpoint works and sets status OPEN
    const reportRes = await nayaAgent.post('/api/v1/reports').send({
      reportedUserId: rakaId,
      category: 'SPAM_COMMERCIAL',
      description: 'Laporan pengujian keamanan sistem moderasi MVP.'
    });
    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.status).toBe('OPEN');
  });

  it('enforces login/signup/logout lifecycle and restricts Admin catalog add/delete to Admin accounts', async () => {
    const userAgent = request.agent(app);

    // 1. Register a brand-new user
    const signUpRes = await userAgent.post('/api/v1/auth/register').send({
      email: 'sinta.new@skillloop.id',
      password: 'PasswordKuat123!',
      displayName: 'Sinta Permata',
      timezone: 'Asia/Jakarta',
      languages: ['id', 'en']
    });
    expect(signUpRes.status).toBe(201);
    expect(signUpRes.body.data.email).toBe('sinta.new@skillloop.id');
    expect(signUpRes.body.data.isAdmin).toBe(false);

    // 2. Non-admin cannot access admin endpoints or delete catalog skills
    const blockedAdmin = await userAgent.get('/api/v1/admin/overview');
    expect(blockedAdmin.status).toBe(403);
    expect(blockedAdmin.body.error.code).toBe('ADMIN_ONLY');

    // 3. Logout invalidates session cookie
    const logoutRes = await userAgent.post('/api/v1/auth/logout');
    expect(logoutRes.status).toBe(200);
    const afterLogoutMe = await userAgent.get('/api/v1/auth/me');
    expect(afterLogoutMe.status).toBe(401);

    // 4. Wrong password is rejected cleanly with 401
    const badLogin = await userAgent.post('/api/v1/auth/login').send({
      email: 'sinta.new@skillloop.id',
      password: 'SalahPassword123'
    });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error.code).toBe('INVALID_CREDENTIALS');

    // 5. Login with newly registered account succeeds
    const goodLogin = await userAgent.post('/api/v1/auth/login').send({
      email: 'sinta.new@skillloop.id',
      password: 'PasswordKuat123!'
    });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.body.data.email).toBe('sinta.new@skillloop.id');

    // 6. Admin account (Raka) has isAdmin=true and can add + delete canonical catalog skills
    const adminAgent = request.agent(app);
    const adminLogin = await adminAgent.post('/api/v1/auth/login').send({
      email: 'raka@demo.skillloop.id',
      password: 'DemoSkillLoop123!'
    });
    expect(adminLogin.status).toBe(200);
    expect(adminLogin.body.data.isAdmin).toBe(true);

    const createdSkill = await adminAgent.post('/api/v1/admin/skills').send({
      name: 'Rust Systems Test',
      categoryId: '11111111-1111-4111-8111-111111111101',
      description: 'Bahasa pemrograman sistem yang aman dan cepat.',
      aliases: ['rustlang']
    });
    expect(createdSkill.status).toBe(201);
    const skillId = createdSkill.body.data.id;

    const deletedSkill = await adminAgent.delete(`/api/v1/admin/skills/${skillId}`);
    expect(deletedSkill.status).toBe(200);
    expect(deletedSkill.body.data.deleted).toBe(true);

    const catalogAfterDelete = await adminAgent.get('/api/v1/skills?q=rustlang');
    expect(catalogAfterDelete.status).toBe(200);
    expect(catalogAfterDelete.body.data.length).toBe(0);
  });
});
