
/* ─── Admin SSE ─────────────────────────────────────────────── */
const adminClients = new Set();

export function addAdminSSEClient(res) {
  adminClients.add(res);

  res.on("close", () => {
    adminClients.delete(res);
  });
}

export function broadcastToAdmin(event, data) {
  const payload =
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  adminClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (err) {
      adminClients.delete(client);
    }
  });
}

/* ─── Candidate SSE ─────────────────────────────────────────── */
const candidateClients = new Map();

export function addCandidateSSEClient(candidateId, res) {
  if (!candidateClients.has(candidateId)) {
    candidateClients.set(candidateId, new Set());
  }

  candidateClients.get(candidateId).add(res);

  res.on("close", () => {
    const set = candidateClients.get(candidateId);

    if (set) {
      set.delete(res);

      if (set.size === 0) {
        candidateClients.delete(candidateId);
      }
    }
  });
}

export function broadcastToCandidate(candidateId, event, data) {
  const clients = candidateClients.get(candidateId);

  if (!clients) return;

  const payload =
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  clients.forEach((client) => {
    try {
      client.write(payload);
    } catch (err) {
      clients.delete(client);
    }
  });
}

/* ─── Public SSE ────────────────────────────────────────────── */
const publicClients = new Set();

export function addPublicSSEClient(res) {
  publicClients.add(res);
  res.on("close", () => publicClients.delete(res));
}

export function broadcastToPublic(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  publicClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (err) {
      publicClients.delete(client);
    }
  });
}