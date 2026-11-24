/* Simpan file ini sebagai: netlify/functions/db.js */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const endpoint = process.env.NEON_ENDPOINT;
  const conn = process.env.NEON_CONN;
  if (!endpoint || !conn) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Environment variable NEON_ENDPOINT / NEON_CONN belum diatur di Netlify.' })
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': conn
      },
      body: event.body || '{}'
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Gagal menghubungi NeonDB' })
    };
  }
};