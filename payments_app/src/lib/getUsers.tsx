// src/lib/api.ts
import users from '@/users.json'
export async function getUsers() {
    const res = users;
    return res
}