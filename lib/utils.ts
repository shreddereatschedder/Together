import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import bcrypt from 'bcrypt';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export default async function saltAndHashPassword(password: string): Promise<string> {
   const saltRounds = 12;
   
   const hash = await bcrypt.hash(password, saltRounds);
   
   return hash;
}