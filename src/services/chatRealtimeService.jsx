class ChatRealtimeService {
  constructor() {
    this.connections = new Map();
  }

  subscribe(userId, res, recipientId) {
    const connection = {
      res,
      recipientId: recipientId || null,
      heartbeat: null,
    };

    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId).add(connection);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    this.sendEvent(res, 'connected', {
      userId,
      recipientId: recipientId || null,
      connectedAt: new Date().toISOString(),
    });

    connection.heartbeat = setInterval(() => {
      this.sendEvent(res, 'heartbeat', {
        timestamp: new Date().toISOString(),
      });
    }, 25000);

    res.on('close', () => {
      this.unsubscribe(userId, connection);
    });
  }

  unsubscribe(userId, connection) {
    if (connection.heartbeat) {
      clearInterval(connection.heartbeat);
    }

    const userConnections = this.connections.get(userId);
    if (!userConnections) {
      return;
    }

    userConnections.delete(connection);
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  publishMessage(message) {
    this.publishToUser(message.senderId, 'chat.message', message);
    if (message.recipientId !== message.senderId) {
      this.publishToUser(message.recipientId, 'chat.message', message);
    }
  }

  publishToUser(userId, eventName, payload) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return;
    }

    for (const connection of userConnections) {
      if (connection.recipientId) {
        const isConversationMessage =
          payload.senderId === connection.recipientId || payload.recipientId === connection.recipientId;
        if (!isConversationMessage) {
          continue;
        }
      }

      this.sendEvent(connection.res, eventName, payload);
    }
  }

  sendEvent(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}

module.exports = new ChatRealtimeService();
