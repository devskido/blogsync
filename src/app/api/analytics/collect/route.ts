import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAccessToken } from '@/lib/auth'
import { createRateLimiter } from '@/lib/rate-limit'

// Rate limiter: 5 requests per hour for manual analytics collection
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyPrefix: 'analytics-collect',
})

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  // Verify authentication
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = verifyAccessToken(token)
    const userId = payload.userId

    // Get user's published content
    const userContent = await prisma.publishingJob.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        content: true,
        platform: true
      }
    })

    const results = []

    for (const job of userContent) {
      // Check if analytics already collected today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existing = await prisma.contentAnalytics.findFirst({
        where: {
          contentId: job.contentId,
          platformId: job.platformId,
          recordedAt: { gte: today }
        }
      })

      if (!existing) {
        // In production, you would call the actual platform APIs here
        // For now, we'll create mock data
        const analytics = await prisma.contentAnalytics.create({
          data: {
            contentId: job.contentId,
            platformId: job.platformId,
            views: Math.floor(Math.random() * 500) + 100,
            reads: Math.floor(Math.random() * 300) + 50,
            likes: Math.floor(Math.random() * 50) + 10,
            comments: Math.floor(Math.random() * 20) + 5,
            shares: Math.floor(Math.random() * 10) + 1,
            platformData: {
              collectedAt: new Date().toISOString(),
              source: 'manual'
            }
          }
        })

        results.push({
          contentId: job.contentId,
          platform: job.platform.name,
          title: job.content.title,
          analytics: {
            views: analytics.views,
            reads: analytics.reads,
            likes: analytics.likes,
            comments: analytics.comments,
            shares: analytics.shares
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Collected analytics for ${results.length} content items`,
      data: results
    })

  } catch (error) {
    console.error('Analytics collection error:', error)
    return NextResponse.json(
      { error: 'Failed to collect analytics' },
      { status: 500 }
    )
  }
}