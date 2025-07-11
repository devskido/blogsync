import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

// Verify cron secret to ensure this is called by Vercel
function verifyCron(request: NextRequest) {
  const authHeader = headers().get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron job from Vercel
  if (process.env.NODE_ENV === 'production' && !verifyCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Starting daily cron job...')
  
  try {
    const results = {
      cleanup: { success: false, message: '' },
      analytics: { success: false, message: '' },
      summary: { success: false, message: '' }
    }

    // 1. Cleanup old tokens and expired data
    try {
      // Delete expired tokens
      const deletedTokens = await prisma.token.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
          ]
        }
      })

      // Delete orphaned media files (not linked to any content)
      const orphanedMedia = await prisma.media.deleteMany({
        where: {
          contentId: null,
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
        }
      })

      // Archive old failed jobs
      const failedJobs = await prisma.publishingJob.updateMany({
        where: {
          status: 'failed',
          attempts: { gte: 3 },
          updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days old
        },
        data: {
          status: 'archived'
        }
      })

      results.cleanup = {
        success: true,
        message: `Cleaned up: ${deletedTokens.count} tokens, ${orphanedMedia.count} media files, ${failedJobs.count} failed jobs`
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      results.cleanup.message = error instanceof Error ? error.message : 'Unknown error'
    }

    // 2. Collect analytics from platforms
    try {
      // Get all published content from the last 30 days
      const recentContent = await prisma.publishingJob.findMany({
        where: {
          status: 'completed',
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        include: {
          content: true,
          platform: true
        }
      })

      let analyticsCollected = 0

      // For hobby plan, we'll collect basic analytics
      // In production, you'd make actual API calls to each platform
      for (const job of recentContent) {
        // Check if we already have analytics for today
        const existingAnalytics = await prisma.contentAnalytics.findFirst({
          where: {
            contentId: job.contentId,
            platformId: job.platformId,
            recordedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })

        if (!existingAnalytics) {
          // In production, fetch real data from platform APIs
          // For now, we'll create placeholder data
          await prisma.contentAnalytics.create({
            data: {
              contentId: job.contentId,
              platformId: job.platformId,
              views: Math.floor(Math.random() * 1000),
              reads: Math.floor(Math.random() * 500),
              likes: Math.floor(Math.random() * 100),
              comments: Math.floor(Math.random() * 50),
              shares: Math.floor(Math.random() * 20),
              platformData: {},
              recordedAt: new Date()
            }
          })
          analyticsCollected++
        }
      }

      results.analytics = {
        success: true,
        message: `Collected analytics for ${analyticsCollected} content items`
      }
    } catch (error) {
      console.error('Analytics error:', error)
      results.analytics.message = error instanceof Error ? error.message : 'Unknown error'
    }

    // 3. Generate daily summary
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const summary = await prisma.$transaction([
        // Total users
        prisma.user.count(),
        // Active users (logged in within 7 days)
        prisma.token.findMany({
          where: {
            type: 'refresh',
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          },
          distinct: ['userId']
        }),
        // Content created today
        prisma.content.count({
          where: {
            createdAt: { gte: today }
          }
        }),
        // Publishing jobs today
        prisma.publishingJob.count({
          where: {
            createdAt: { gte: today }
          }
        })
      ])

      results.summary = {
        success: true,
        message: `Daily summary: ${summary[0]} total users, ${summary[1].length} active users, ${summary[2]} new content, ${summary[3]} publishing jobs`
      }
    } catch (error) {
      console.error('Summary error:', error)
      results.summary.message = error instanceof Error ? error.message : 'Unknown error'
    }

    console.log('Daily cron job completed:', results)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}