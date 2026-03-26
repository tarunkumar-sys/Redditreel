'use server'

import { prisma, signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function registerAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  if (!email || !password || !name) return { error: "Missing required fields" };
  
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "User already exists" };
    
    // Check if it's the first user -> make them ADMIN
    const count = await prisma.user.count();
    const role = count === 0 ? 'ADMIN' : 'USER';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, password: hashedPassword, role }
    });
    
    return { success: true };
  } catch (err) {
    return { error: "Failed to register account" };
  }
}

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') return { error: 'Invalid credentials' };
      return { error: 'Something went wrong.' };
    }
    throw error; // Expected for Next.js NEXT_REDIRECT to work
  }
}
