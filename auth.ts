import NextAuth, { DefaultSession } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import CredentialsProvider from 'next-auth/providers/credentials';

// Extend NextAuth types to include the role on the user and session
declare module 'next-auth' {
  interface Session {
    user: {
      role: 'admin' | 'viewer' | null;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'admin' | 'viewer' | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest Access",
      credentials: {},
      async authorize() {
        return {
          id: 'guest-user',
          name: 'Portfolio Guest',
          email: 'guest@anchor.demo',
          role: 'viewer' // Guests are strictly viewers
        };
      }
    }),
  ],
  callbacks: {
    jwt({ token, profile, user }) {
      // If logging in via Credentials, `user` contains the role.
      if (user && user.role) {
        token.role = user.role;
      }
      
      // If logging in via Entra ID, `profile` contains the roles.
      if (profile) {
        const roles = profile.roles as string[] | undefined;
        if (roles?.includes('admin')) {
          token.role = 'admin';
        } else if (roles?.includes('viewer')) {
          token.role = 'viewer';
        } else if (!token.role) {
          token.role = null;
        }
      }
      return token;
    },
    session({ session, token }) {
      // Pass the role from the token to the session
      if (session.user && typeof token.role === 'string') {
        session.user.role = token.role as 'admin' | 'viewer';
      } else if (session.user) {
        session.user.role = null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect here if unauthenticated
  },
});
