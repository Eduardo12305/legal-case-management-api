class ChatRealtimeService {
  constructor() {
    this.connections = new Map();
  }

  subscribe(userId, res, conversationId) {
    const connection = {
      res,
      conversationId: conversationId || null,
      heartbeat: null,
    };

    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId).add(connection);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Content-Encoding', 'identity');
    res.flushHeaders?.();

    // Helps some proxies/clients start streaming immediately.
    res.write(': connected\n\n');
    res.flush?.();

    this.sendEvent(res, 'connected', {
      userId,
      conversationId: conversationId || null,
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

  publishMessage(message, audienceUserIds = []) {
    const recipients = [...new Set(audienceUserIds.filter(Boolean))];
    for (const userId of recipients) {
      this.publishToUser(userId, 'chat.message', message);
    }
  }

  publishToUser(userId, eventName, payload) {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      return;
    }

    for (const connection of userConnections) {
      if (connection.conversationId && payload.conversationId !== connection.conversationId) {
        continue;
      }

      this.sendEvent(connection.res, eventName, payload);
    }
  }

  sendEvent(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.flush?.();
  }
}

module.exports = new ChatRealtimeService();
