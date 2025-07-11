import { kv } from '@vercel/kv'

export const cache = {
  async get(key: string): Promise<any> {
    try {
      return await kv.get(key)
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  },

  async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    try {
      if (expirationInSeconds) {
        await kv.set(key, value, { ex: expirationInSeconds })
      } else {
        await kv.set(key, value)
      }
    } catch (error) {
      console.error('KV set error:', error)
    }
  },

  async del(key: string): Promise<void> {
    try {
      await kv.del(key)
    } catch (error) {
      console.error('KV delete error:', error)
    }
  },

  async incr(key: string): Promise<number> {
    try {
      return await kv.incr(key)
    } catch (error) {
      console.error('KV incr error:', error)
      return 0
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await kv.expire(key, seconds)
    } catch (error) {
      console.error('KV expire error:', error)
    }
  },
}