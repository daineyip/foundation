import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';

export interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

// Helper function to generate a CUID-like ID without dependencies
const generateId = (): string => {
  return 'c' + Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
};

// Custom adapter implementation that works directly with Prisma
const customPrismaAdapter = (): Adapter => {
  return {
    createUser: async (userData: any) => {
      try {
        const user = await prisma.user.create({
          data: {
            id: generateId(), // Use our custom ID generator instead of uuidv4
            name: userData.name,
            email: userData.email,
            image: userData.image,
            emailVerified: userData.emailVerified,
          } as Prisma.UserCreateInput,
        });
        
        return {
          id: user.id,
          name: user.name,
          email: user.email || "",
          emailVerified: user.emailVerified,
          image: user.image,
        };
      } catch (error) {
        console.error('Error creating user in PrismaAdapter:', error);
        throw error;
      }
    },
    
    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image,
      };
    },
    
    getUserByEmail: async (email: string) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image,
      };
    },
    
    getUserByAccount: async ({ providerAccountId, provider }: { providerAccountId: string; provider: string }) => {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });
      
      if (!account || !account.user) return null;
      
      return {
        id: account.user.id,
        name: account.user.name,
        email: account.user.email || "",
        emailVerified: account.user.emailVerified,
        image: account.user.image,
      };
    },
    
    updateUser: async (userData: any) => {
      const user = await prisma.user.update({
        where: { id: userData.id },
        data: userData,
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email || "",
        emailVerified: user.emailVerified,
        image: user.image,
      };
    },
    
    linkAccount: async (accountData: any) => {
      await prisma.account.create({
        data: {
          userId: accountData.userId,
          type: accountData.type,
          provider: accountData.provider,
          providerAccountId: accountData.providerAccountId,
          refresh_token: accountData.refresh_token,
          access_token: accountData.access_token,
          expires_at: accountData.expires_at,
          token_type: accountData.token_type,
          scope: accountData.scope,
          id_token: accountData.id_token,
          session_state: accountData.session_state,
        } as Prisma.AccountUncheckedCreateInput,
      });
    },
    
    createSession: async (sessionData: { userId: string; expires: Date; sessionToken: string }) => {
      const session = await prisma.session.create({
        data: {
          userId: sessionData.userId,
          expires: sessionData.expires,
          sessionToken: sessionData.sessionToken,
        } as Prisma.SessionUncheckedCreateInput,
      });
      
      return {
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
      };
    },
    
    getSessionAndUser: async (sessionToken: string) => {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      
      if (!session) return null;
      
      const { user } = session;
      
      return {
        session: {
          userId: session.userId,
          expires: session.expires,
          sessionToken: session.sessionToken,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email || "",
          emailVerified: user.emailVerified,
          image: user.image,
        },
      };
    },
    
    updateSession: async (sessionData: any) => {
      const session = await prisma.session.update({
        where: { sessionToken: sessionData.sessionToken },
        data: sessionData,
      });
      
      return {
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
      };
    },
    
    deleteSession: async (sessionToken: string) => {
      const session = await prisma.session.delete({
        where: { sessionToken },
      });
      
      return {
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken,
      };
    },
    
    // Additional required methods for complete adapter
    deleteUser: async (userId: string) => {
      await prisma.user.delete({
        where: { id: userId },
      });
    },
    
    unlinkAccount: async ({ providerAccountId, provider }: { providerAccountId: string; provider: string }) => {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },
  };
};

export const authOptions = {
  adapter: customPrismaAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/api/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user: any; account: any }) {
      if (user) {
        token.id = user.id || '';
      }
      
      // Add the provider to the token
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 