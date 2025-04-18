import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db/prisma';

// Get auth session
export async function auth() {
  const session = await getServerSession(authOptions);
  return session;
}

// Get current authenticated user
export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }
  
  // Get the user from the database by email
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
} 