import { supabase } from './supabase'

// Email template types
export type EmailTemplate = 'project_shared' | 'deadline_reminder' | 'export_ready' | 'validation_issues' | 'welcome'

// Template data interfaces
export interface ProjectSharedData {
  sharedBy: string
  projectName: string
  projectUrl: string
  recipientName?: string
}

export interface DeadlineReminderData {
  projectName: string
  daysUntilDeadline: number
  deadline: string
  projectUrl: string
  recipientName?: string
}

export interface ExportReadyData {
  projectName: string
  downloadUrl: string
  expiresIn: string
  recipientName?: string
}

export interface ValidationIssuesData {
  projectName: string
  issueCount: number
  criticalCount: number
  projectUrl: string
  issues: Array<{ section: string; message: string; severity: string }>
  recipientName?: string
}

export interface WelcomeData {
  userName: string
  loginUrl: string
}

export type EmailData = ProjectSharedData | DeadlineReminderData | ExportReadyData | ValidationIssuesData | WelcomeData

// Email preferences interface
export interface EmailPreferences {
  user_id: string
  project_shared: boolean
  deadline_reminders: boolean
  export_ready: boolean
  validation_issues: boolean
  frequency: 'immediate' | 'daily_digest' | 'never'
}

/**
 * Check if user has email notifications enabled for a specific type
 */
export async function checkEmailPreference(
  userId: string,
  notificationType: keyof Omit<EmailPreferences, 'user_id' | 'frequency'>
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Default to true if no preferences are set
      return true
    }

    return data[notificationType] ?? true
  } catch (error) {
    console.error('Error checking email preference:', error)
    return true // Default to sending if check fails
  }
}

/**
 * Send an email using the edge function
 */
export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  data: EmailData,
  from?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: { to, template, data, from }
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: result?.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Send project shared notification
 */
export async function sendProjectSharedEmail(
  recipientEmail: string,
  recipientUserId: string,
  data: ProjectSharedData
): Promise<{ success: boolean; error?: string }> {
  // Check if user has this notification enabled
  const enabled = await checkEmailPreference(recipientUserId, 'project_shared')
  if (!enabled) {
    console.log('Project shared notifications disabled for user:', recipientUserId)
    return { success: true } // Not an error, just disabled
  }

  return sendEmail(recipientEmail, 'project_shared', data)
}

/**
 * Send deadline reminder notification
 */
export async function sendDeadlineReminder(
  recipientEmail: string,
  recipientUserId: string,
  data: DeadlineReminderData
): Promise<{ success: boolean; error?: string }> {
  // Check if user has this notification enabled
  const enabled = await checkEmailPreference(recipientUserId, 'deadline_reminders')
  if (!enabled) {
    console.log('Deadline reminder notifications disabled for user:', recipientUserId)
    return { success: true }
  }

  return sendEmail(recipientEmail, 'deadline_reminder', data)
}

/**
 * Send export ready notification
 */
export async function sendExportReadyEmail(
  recipientEmail: string,
  recipientUserId: string,
  data: ExportReadyData
): Promise<{ success: boolean; error?: string }> {
  // Check if user has this notification enabled
  const enabled = await checkEmailPreference(recipientUserId, 'export_ready')
  if (!enabled) {
    console.log('Export ready notifications disabled for user:', recipientUserId)
    return { success: true }
  }

  return sendEmail(recipientEmail, 'export_ready', data)
}

/**
 * Send validation issues notification
 */
export async function sendValidationIssuesEmail(
  recipientEmail: string,
  recipientUserId: string,
  data: ValidationIssuesData
): Promise<{ success: boolean; error?: string }> {
  // Check if user has this notification enabled
  const enabled = await checkEmailPreference(recipientUserId, 'validation_issues')
  if (!enabled) {
    console.log('Validation issues notifications disabled for user:', recipientUserId)
    return { success: true }
  }

  return sendEmail(recipientEmail, 'validation_issues', data)
}

/**
 * Send welcome email (no preference check, always send)
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  data: WelcomeData
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(recipientEmail, 'welcome', data)
}

/**
 * Get user email preferences
 */
export async function getEmailPreferences(userId: string): Promise<EmailPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching email preferences:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching email preferences:', error)
    return null
  }
}

/**
 * Update user email preferences
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<Omit<EmailPreferences, 'user_id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })

    if (error) {
      console.error('Error updating email preferences:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating email preferences:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Calculate days until deadline
 */
export function calculateDaysUntilDeadline(deadline: Date): number {
  const now = new Date()
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Format date for email
 */
export function formatDeadlineDate(date: Date): string {
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
