import { hash } from 'bcryptjs';
import prisma from '../db/prisma';

export type UserCreateInput = {
  name?: string;
  email: string;
  password: string;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  password?: string;
};

/**
 * Create a new user
 */
export const createUser = async (data: UserCreateInput) => {
  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash the password
  const hashedPassword = await hash(data.password, 12);

  // Create the user
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });
};

/**
 * Get a user by ID
 */
export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      // Don't include password in the response
    },
  });
};

/**
 * Get a user by email
 */
export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      password: true, // Include password for auth
      createdAt: true,
      updatedAt: true,
    },
  });
};

/**
 * Update a user
 */
export const updateUser = async (id: string, data: UserUpdateInput) => {
  const updateData: any = { ...data };
  
  // If password is being updated, hash it
  if (data.password) {
    updateData.password = await hash(data.password, 12);
  }
  
  return prisma.user.update({
    where: {
      id,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      // Don't include password in the response
    },
  });
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: {
      id,
    },
  });
}; 