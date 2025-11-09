import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import {
  ProjectRole,
  Permissions,
  getPermissions,
  canManageRole,
} from '@/lib/permissions';
import { analytics } from '@/lib/analytics';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  role: ProjectRole;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
  inviter?: {
    full_name: string | null;
    email: string;
  };
}

export function useProjectPermissions(projectId: string) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState<ProjectRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>(
    getPermissions(null, false)
  );
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project ownership and member role
  const fetchRoleAndPermissions = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is the project owner
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const userIsOwner = project?.user_id === user.id;
      setIsOwner(userIsOwner);

      if (userIsOwner) {
        setRole('owner');
        setPermissions(getPermissions('owner', true));
      } else {
        // Fetch user's role from project_members
        const { data: memberData, error: memberError } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          // PGRST116 is "not found" - it's ok if user is not a member
          throw memberError;
        }

        const userRole = memberData?.role as ProjectRole | null;
        setRole(userRole);
        setPermissions(getPermissions(userRole, false));
      }
    } catch (error) {
      console.error('Error fetching role and permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível verificar as permissões.',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, user, toast]);

  // Fetch all project members
  const fetchMembers = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(
          `
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [projectId, user]);

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_invitations')
        .select(
          `
          *,
          inviter:invited_by (
            full_name,
            email
          )
        `
        )
        .eq('project_id', projectId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [projectId, user]);

  // Initial load
  useEffect(() => {
    fetchRoleAndPermissions();
    fetchMembers();
    fetchInvitations();
  }, [fetchRoleAndPermissions, fetchMembers, fetchInvitations]);

  // Set up real-time subscriptions for members and invitations
  useEffect(() => {
    if (!projectId) return;

    const membersChannel = supabase
      .channel(`project_members:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchMembers();
          fetchRoleAndPermissions(); // Re-fetch in case our role changed
        }
      )
      .subscribe();

    const invitationsChannel = supabase
      .channel(`project_invitations:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invitations',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(invitationsChannel);
    };
  }, [projectId, fetchMembers, fetchInvitations, fetchRoleAndPermissions]);

  // Invite a member via edge function
  const inviteMember = useCallback(
    async (email: string, inviteRole: ProjectRole) => {
      if (!user || !permissions.canInviteMembers) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não tens permissão para convidar membros.',
        });
        return { success: false };
      }

      try {
        // Call edge function to create invitation and send email
        const { data, error } = await supabase.functions.invoke(
          'invite-project-member',
          {
            body: {
              projectId,
              email,
              role: inviteRole,
            },
          }
        );

        if (error) throw error;

        analytics.featureUsed('invitation_sent', { role: inviteRole });

        toast({
          title: 'Convite enviado',
          description: `Convite enviado para ${email}`,
        });

        // Refresh invitations
        await fetchInvitations();

        return { success: true, data };
      } catch (error) {
        console.error('Error inviting member:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível enviar o convite.',
        });
        return { success: false, error };
      }
    },
    [user, permissions, projectId, toast, fetchInvitations]
  );

  // Remove a member
  const removeMember = useCallback(
    async (memberId: string, memberRole: ProjectRole) => {
      if (!user || !permissions.canManageMembers) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não tens permissão para remover membros.',
        });
        return { success: false };
      }

      // Check if we can manage this member's role
      if (!canManageRole(role!, memberRole, isOwner)) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não podes remover membros com este papel.',
        });
        return { success: false };
      }

      try {
        const { error } = await supabase
          .from('project_members')
          .delete()
          .eq('id', memberId);

        if (error) throw error;

        analytics.featureUsed('member_removed', { role: memberRole });

        toast({
          title: 'Membro removido',
          description: 'O membro foi removido do projeto.',
        });

        // Refresh members
        await fetchMembers();

        return { success: true };
      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível remover o membro.',
        });
        return { success: false, error };
      }
    },
    [user, permissions, role, isOwner, toast, fetchMembers]
  );

  // Update member role
  const updateMemberRole = useCallback(
    async (memberId: string, oldRole: ProjectRole, newRole: ProjectRole) => {
      if (!user || !permissions.canManageMembers) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não tens permissão para alterar papéis.',
        });
        return { success: false };
      }

      // Check if we can manage both the old and new roles
      if (
        !canManageRole(role!, oldRole, isOwner) ||
        !canManageRole(role!, newRole, isOwner)
      ) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não podes alterar para este papel.',
        });
        return { success: false };
      }

      try {
        const { error } = await supabase
          .from('project_members')
          .update({ role: newRole })
          .eq('id', memberId);

        if (error) throw error;

        analytics.featureUsed('member_role_changed', {
          oldRole,
          newRole,
        });

        toast({
          title: 'Papel atualizado',
          description: 'O papel do membro foi atualizado.',
        });

        // Refresh members
        await fetchMembers();

        return { success: true };
      } catch (error) {
        console.error('Error updating member role:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível atualizar o papel.',
        });
        return { success: false, error };
      }
    },
    [user, permissions, role, isOwner, toast, fetchMembers]
  );

  // Cancel an invitation
  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      if (!user || !permissions.canInviteMembers) {
        toast({
          variant: 'destructive',
          title: 'Sem permissão',
          description: 'Não tens permissão para cancelar convites.',
        });
        return { success: false };
      }

      try {
        const { error } = await supabase
          .from('project_invitations')
          .delete()
          .eq('id', invitationId);

        if (error) throw error;

        toast({
          title: 'Convite cancelado',
          description: 'O convite foi cancelado.',
        });

        // Refresh invitations
        await fetchInvitations();

        return { success: true };
      } catch (error) {
        console.error('Error canceling invitation:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível cancelar o convite.',
        });
        return { success: false, error };
      }
    },
    [user, permissions, toast, fetchInvitations]
  );

  return {
    role,
    isOwner,
    permissions,
    members,
    invitations,
    loading,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
    refresh: () => {
      fetchRoleAndPermissions();
      fetchMembers();
      fetchInvitations();
    },
  };
}
