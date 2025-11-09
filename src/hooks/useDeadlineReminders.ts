import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  sendDeadlineReminder,
  calculateDaysUntilDeadline,
  formatDeadlineDate
} from '@/lib/emailNotifications'

interface Project {
  id: string
  title: string
  end_date: string | null
  user_id: string
}

interface DeadlineCheck {
  project: Project
  daysUntil: number
  shouldNotify: boolean
}

// Days before deadline to send reminders
const REMINDER_DAYS = [7, 3, 1, 0]

/**
 * Hook to check and send deadline reminders
 * This should be called periodically (e.g., daily via a cron job or background task)
 */
export function useDeadlineReminders() {
  const [isChecking, setIsChecking] = useState(false)

  const checkDeadlines = async (): Promise<DeadlineCheck[]> => {
    setIsChecking(true)

    try {
      // Get all projects with end dates in the future
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, end_date, user_id')
        .not('end_date', 'is', null)
        .gte('end_date', new Date().toISOString())

      if (error) {
        console.error('Error fetching projects:', error)
        return []
      }

      if (!projects || projects.length === 0) {
        return []
      }

      const checks: DeadlineCheck[] = []

      for (const project of projects) {
        if (!project.end_date) continue

        const deadline = new Date(project.end_date)
        const daysUntil = calculateDaysUntilDeadline(deadline)

        // Check if we should send a reminder for this project
        const shouldNotify = REMINDER_DAYS.includes(daysUntil)

        checks.push({
          project,
          daysUntil,
          shouldNotify
        })
      }

      return checks

    } catch (error) {
      console.error('Error checking deadlines:', error)
      return []
    } finally {
      setIsChecking(false)
    }
  }

  const sendReminders = async () => {
    const checks = await checkDeadlines()

    const results = {
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0
    }

    for (const check of checks) {
      if (!check.shouldNotify) {
        results.skipped++
        continue
      }

      results.total++

      try {
        // Get user profile to get email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', check.project.user_id)
          .single()

        if (!profile?.email) {
          console.warn(`No email found for user ${check.project.user_id}`)
          results.failed++
          continue
        }

        // Check if reminder was already sent today for this project
        const today = new Date().toISOString().split('T')[0]
        const { data: existingReminder } = await supabase
          .from('deadline_reminders_sent')
          .select('*')
          .eq('project_id', check.project.id)
          .eq('days_before', check.daysUntil)
          .gte('sent_at', `${today}T00:00:00`)
          .single()

        if (existingReminder) {
          console.log(`Reminder already sent today for project ${check.project.id}`)
          results.skipped++
          continue
        }

        // Send reminder email
        const projectUrl = `${window.location.origin}/projects/${check.project.id}`
        const deadline = new Date(check.project.end_date!)

        const emailResult = await sendDeadlineReminder(
          profile.email,
          check.project.user_id,
          {
            projectName: check.project.title,
            daysUntilDeadline: check.daysUntil,
            deadline: formatDeadlineDate(deadline),
            projectUrl,
            recipientName: profile.full_name
          }
        )

        if (emailResult.success) {
          // Record that reminder was sent
          await supabase.from('deadline_reminders_sent').insert({
            project_id: check.project.id,
            user_id: check.project.user_id,
            days_before: check.daysUntil,
            sent_at: new Date().toISOString()
          })

          results.sent++
          console.log(`Reminder sent for project ${check.project.id} (${check.daysUntil} days)`)
        } else {
          results.failed++
          console.error(`Failed to send reminder for project ${check.project.id}:`, emailResult.error)
        }

      } catch (error) {
        results.failed++
        console.error(`Error sending reminder for project ${check.project.id}:`, error)
      }
    }

    return results
  }

  return {
    checkDeadlines,
    sendReminders,
    isChecking
  }
}

/**
 * Hook to monitor deadlines for current user's projects
 * Returns upcoming deadlines for display in UI
 */
export function useUpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState<DeadlineCheck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeadlines = async () => {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, title, end_date, user_id')
          .eq('user_id', user.id)
          .not('end_date', 'is', null)
          .gte('end_date', new Date().toISOString())
          .order('end_date', { ascending: true })

        if (error) {
          console.error('Error fetching deadlines:', error)
          return
        }

        const checks: DeadlineCheck[] = (projects || [])
          .filter(p => p.end_date)
          .map(project => {
            const deadline = new Date(project.end_date!)
            const daysUntil = calculateDaysUntilDeadline(deadline)

            return {
              project,
              daysUntil,
              shouldNotify: REMINDER_DAYS.includes(daysUntil)
            }
          })

        setDeadlines(checks)

      } catch (error) {
        console.error('Error fetching upcoming deadlines:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeadlines()

    // Refresh every hour
    const interval = setInterval(fetchDeadlines, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { deadlines, loading }
}
