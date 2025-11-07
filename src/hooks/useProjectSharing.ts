import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sendProjectSharedEmail } from '@/lib/emailNotifications'
import { useToast } from './use-toast'

interface ShareProjectParams {
  projectId: string
  projectName: string
  userEmail: string
  permission?: 'view' | 'edit' | 'admin'
}

export function useProjectSharing() {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const shareProject = async ({
    projectId,
    projectName,
    userEmail,
    permission = 'edit'
  }: ShareProjectParams) => {
    setIsSharing(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get current user's profile to get their name
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Find user by email to get their ID
      const { data: recipientProfile, error: recipientError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', userEmail)
        .single()

      if (recipientError || !recipientProfile) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Utilizador não encontrado com este email.'
        })
        return { success: false, error: 'User not found' }
      }

      // Check if user is trying to share with themselves
      if (recipientProfile.id === user.id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não podes partilhar um projeto contigo mesmo.'
        })
        return { success: false, error: 'Cannot share with yourself' }
      }

      // Check if project is already shared with this user
      const { data: existingShare } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', recipientProfile.id)
        .single()

      if (existingShare) {
        toast({
          variant: 'destructive',
          title: 'Já partilhado',
          description: 'Este projeto já está partilhado com este utilizador.'
        })
        return { success: false, error: 'Already shared' }
      }

      // Share the project (insert into project_shares table)
      const { error: shareError } = await supabase
        .from('project_shares')
        .insert({
          project_id: projectId,
          user_id: recipientProfile.id,
          permission,
          shared_by: user.id
        })

      if (shareError) {
        throw shareError
      }

      // Send email notification
      const projectUrl = `${window.location.origin}/projects/${projectId}`
      const emailResult = await sendProjectSharedEmail(
        recipientProfile.email,
        recipientProfile.id,
        {
          sharedBy: currentUserProfile?.full_name || currentUserProfile?.email || 'Um colega',
          projectName,
          projectUrl,
          recipientName: recipientProfile.full_name
        }
      )

      if (!emailResult.success) {
        console.warn('Failed to send email notification:', emailResult.error)
        // Don't fail the whole operation if email fails
      }

      toast({
        title: 'Projeto partilhado',
        description: `Projeto partilhado com ${userEmail} com sucesso.`
      })

      return { success: true }

    } catch (error) {
      console.error('Error sharing project:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível partilhar o projeto.'
      })
      return { success: false, error: (error as Error).message }
    } finally {
      setIsSharing(false)
    }
  }

  const removeShare = async (projectId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) throw error

      toast({
        title: 'Partilha removida',
        description: 'A partilha do projeto foi removida com sucesso.'
      })

      return { success: true }

    } catch (error) {
      console.error('Error removing share:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover a partilha.'
      })
      return { success: false, error: (error as Error).message }
    }
  }

  const getProjectShares = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)

      if (error) throw error

      return { success: true, data }

    } catch (error) {
      console.error('Error fetching project shares:', error)
      return { success: false, error: (error as Error).message, data: [] }
    }
  }

  return {
    shareProject,
    removeShare,
    getProjectShares,
    isSharing
  }
}
