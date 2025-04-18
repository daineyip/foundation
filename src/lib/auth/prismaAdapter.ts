import { PrismaAdapter } from "@auth/prisma-adapter";
import { AdapterUser } from "next-auth/adapters";
import prisma from '@/lib/db/prisma';
import { Adapter } from "next-auth/adapters";

/**
 * Custom Prisma adapter that properly handles user creation
 * to fix the "Argument `id` is missing" error
 */
export function CustomPrismaAdapter(): Adapter {
  // Get the base adapter
  const baseAdapter = PrismaAdapter(prisma as any);

  // Return a modified adapter with the custom createUser implementation
  return {
    ...baseAdapter,
    createUser: async (userData: Omit<AdapterUser, "id">) => {
      // Explicitly handle ID generation with cuid
      const newUser = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email as string, // Email is required in our schema
          emailVerified: userData.emailVerified,
          image: userData.image
        },
      });
      return newUser as AdapterUser;
    }
  };
} 