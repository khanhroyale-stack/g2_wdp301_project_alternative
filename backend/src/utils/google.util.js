const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token (credential) tra ve tu Google Identity Services.
 * Kiem tra chu ky va audience (aud === GOOGLE_CLIENT_ID).
 * @param {string} credential - id_token (JWT) tu frontend
 * @returns {Promise<object>} payload: { sub, email, email_verified, name, picture, ... }
 */
const verifyGoogleIdToken = async (credential) => {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { verifyGoogleIdToken };
