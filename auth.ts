import NextAuth, { DefaultSession } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

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
      // By default, Microsoft includes roles in the ID token if configured in the app registration
    }),
  ],
  callbacks: {
    jwt({ token, profile }) {
      // When the user signs in, the profile object is available.
      // Entra ID sends App Roles in the `roles` array claim.
      if (profile) {
        const roles = profile.roles as string[] | undefined;
        // Map the Entra ID role to our internal role.
        if (roles?.includes('admin')) {
          token.role = 'admin';
        } else if (roles?.includes('viewer')) {
          token.role = 'viewer';
        } else {
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
