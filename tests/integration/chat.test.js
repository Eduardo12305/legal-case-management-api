const request = require('supertest');
const app = require('../../src/app.jsx');
const { disconnectDatabase, resetDatabase } = require('../helpers/database');
const { getAuthHeader } = require('../helpers/auth');
const { createProcess } = require('../helpers/processFactory');
const { createUser } = require('../helpers/userFactory');

describe('Chat API', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('shows general and lawyer conversations for a client linked to a lawyer', async () => {
    const lawyer = await createUser({
      email: 'lawyer-chat-linked@test.com',
      role: 'LAWYER',
      name: 'Advogado Vinculado',
    });
    const client = await createUser({
      email: 'client-chat-linked@test.com',
      role: 'CLIENT',
      name: 'Cliente Vinculado',
    });

    await createProcess({
      clientId: client.client.id,
      lawyerId: lawyer.id,
      processNumber: 'PROC-CHAT-001',
    });

    const response = await request(app)
      .get('/api/chat/conversations')
      .set(await getAuthHeader(client));

    expect(response.status).toBe(200);
    expect(response.body.conversations).toHaveLength(2);

    const generalConversation = response.body.conversations.find((conversation) => conversation.type === 'GENERAL');
    const lawyerConversation = response.body.conversations.find((conversation) => conversation.type === 'LAWYER');

    expect(generalConversation).toBeTruthy();
    expect(generalConversation.title).toBe('Atendimento geral');
    expect(lawyerConversation).toBeTruthy();
    expect(lawyerConversation.lawyer.id).toBe(lawyer.id);
    expect(lawyerConversation.counterpart.name).toBe('Advogado Vinculado');
  });

  it('shows a lawyer chat to the client after the lawyer sends the first message', async () => {
    const lawyer = await createUser({
      email: 'lawyer-chat-first@test.com',
      role: 'LAWYER',
      name: 'Advogada Primeira Mensagem',
    });
    const client = await createUser({
      email: 'client-chat-first@test.com',
      role: 'CLIENT',
      name: 'Cliente Sem Vinculo',
    });

    const sendResponse = await request(app)
      .post('/api/chat')
      .set(await getAuthHeader(lawyer))
      .send({
        recipientId: client.id,
        content: 'Olá, este é o seu atendimento jurídico.',
      });

    expect(sendResponse.status).toBe(201);

    const listResponse = await request(app)
      .get('/api/chat/conversations')
      .set(await getAuthHeader(client));

    expect(listResponse.status).toBe(200);

    const lawyerConversation = listResponse.body.conversations.find((conversation) => conversation.type === 'LAWYER');

    expect(lawyerConversation).toBeTruthy();
    expect(lawyerConversation.lawyer.id).toBe(lawyer.id);
    expect(lawyerConversation.lastMessage.content).toBe('Olá, este é o seu atendimento jurídico.');
  });

  it('allows staff to resolve the general chat for a client and share the same conversation', async () => {
    const staff = await createUser({
      email: 'staff-chat-general@test.com',
      role: 'STAFF',
      name: 'Atendente Advon',
    });
    const client = await createUser({
      email: 'client-chat-general@test.com',
      role: 'CLIENT',
      name: 'Cliente Atendimento',
    });

    const resolveResponse = await request(app)
      .post('/api/chat/conversations/resolve')
      .set(await getAuthHeader(staff))
      .send({
        type: 'GENERAL',
        clientUserId: client.id,
      });

    expect(resolveResponse.status).toBe(200);
    expect(resolveResponse.body.type).toBe('GENERAL');

    const conversationId = resolveResponse.body.id;

    const messageResponse = await request(app)
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .set(await getAuthHeader(staff))
      .send({
        content: 'Olá, em que posso ajudar?',
      });

    expect(messageResponse.status).toBe(201);

    const clientConversationsResponse = await request(app)
      .get('/api/chat/conversations')
      .set(await getAuthHeader(client));

    expect(clientConversationsResponse.status).toBe(200);

    const generalConversation = clientConversationsResponse.body.conversations.find((conversation) => conversation.type === 'GENERAL');
    expect(generalConversation).toBeTruthy();
    expect(generalConversation.id).toBe(conversationId);
    expect(generalConversation.lastMessage.content).toBe('Olá, em que posso ajudar?');

    const messagesResponse = await request(app)
      .get(`/api/chat/conversations/${conversationId}/messages`)
      .set(await getAuthHeader(client));

    expect(messagesResponse.status).toBe(200);
    expect(messagesResponse.body.messages).toHaveLength(1);
    expect(messagesResponse.body.messages[0].sender.role).toBe('STAFF');
  });

  it('blocks a client from opening a lawyer chat with an unrelated lawyer', async () => {
    const lawyer = await createUser({
      email: 'lawyer-chat-unrelated@test.com',
      role: 'LAWYER',
    });
    const client = await createUser({
      email: 'client-chat-unrelated@test.com',
      role: 'CLIENT',
    });

    const response = await request(app)
      .post('/api/chat/conversations/resolve')
      .set(await getAuthHeader(client))
      .send({
        type: 'LAWYER',
        lawyerUserId: lawyer.id,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Advogado não disponível para este cliente');
  });
});
