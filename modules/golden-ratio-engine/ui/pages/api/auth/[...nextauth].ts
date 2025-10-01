import NextAuth from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';

export default NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH_CLIENT_ID || '',
      clientSecret: process.env.AUTH_CLIENT_SECRET || '',
      issuer: process.env.AUTH_ISSUER || ''
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
});
