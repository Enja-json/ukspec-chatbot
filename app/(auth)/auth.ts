import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import LinkedIn from 'next-auth/providers/linkedin';
import { getUser, createOrUpdateLinkedInUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'regular' | 'professional';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      onboardingCompleted?: boolean;
      tutorialCompleted?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    onboardingCompleted?: boolean;
    tutorialCompleted?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    onboardingCompleted?: boolean;
    tutorialCompleted?: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular', onboardingCompleted: user.onboardingCompleted, tutorialCompleted: user.tutorialCompleted };
      },
    }),

  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'linkedin') {
        try {
          const linkedinUser = await createOrUpdateLinkedInUser({
            linkedinId: profile?.sub || account.providerAccountId,
            email: user.email!,
            name: user.name || undefined,
            image: user.image || undefined,
          });
          
          // Add the user data to the user object for the next callback
          user.id = linkedinUser.id;
          user.type = 'regular';
          user.onboardingCompleted = linkedinUser.onboardingCompleted;
          user.tutorialCompleted = linkedinUser.tutorialCompleted;
          user.name = linkedinUser.name;
          user.image = linkedinUser.image;
          
          return true;
        } catch (error) {
          console.error('Failed to create/update LinkedIn user:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.onboardingCompleted = user.onboardingCompleted;
        token.tutorialCompleted = user.tutorialCompleted;
      }

      // Handle session updates (when update() is called)
      if (trigger === 'update' && session) {
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
        if (session.tutorialCompleted !== undefined) {
          token.tutorialCompleted = session.tutorialCompleted;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.tutorialCompleted = token.tutorialCompleted;
      }

      return session;
    },
  },
});
