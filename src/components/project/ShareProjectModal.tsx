import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useProjectPermissions, ProjectMember, ProjectInvitation } from '@/hooks/useProjectPermissions';
import {
  ProjectRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  getAvailableRolesForInvite,
  canManageRole,
} from '@/lib/permissions';
import {
  Mail,
  UserPlus,
  X,
  Copy,
  Clock,
  CheckCircle,
  MoreVertical,
  Trash2,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { toast } = useToast();
  const {
    role,
    isOwner,
    permissions,
    members,
    invitations,
    inviteMember,
    removeMember,
    updateMemberRole,
    cancelInvitation,
  } = useProjectPermissions(projectId);

  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('editor');
  const [isInviting, setIsInviting] = useState(false);

  const availableRoles = getAvailableRolesForInvite(role || 'viewer', isOwner);

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor, insere um email válido.',
      });
      return;
    }

    setIsInviting(true);
    try {
      const result = await inviteMember(email, selectedRole);
      if (result.success) {
        setEmail('');
        setSelectedRole('editor');
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link copiado',
      description: 'O link de convite foi copiado para a área de transferência.',
    });
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (
      confirm(
        `Tens a certeza que queres remover ${member.profiles?.full_name || member.profiles?.email} do projeto?`
      )
    ) {
      await removeMember(member.id, member.role);
    }
  };

  const handleChangeRole = async (
    member: ProjectMember,
    newRole: ProjectRole
  ) => {
    await updateMemberRole(member.id, member.role, newRole);
  };

  const handleCancelInvitation = async (invitation: ProjectInvitation) => {
    if (confirm(`Tens a certeza que queres cancelar o convite para ${invitation.email}?`)) {
      await cancelInvitation(invitation.id);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (!permissions.canInviteMembers) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partilhar Projeto</DialogTitle>
          <DialogDescription>
            Convida membros para colaborar em "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite new member */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInvite();
                    }
                  }}
                />
              </div>
              <div className="w-40 space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as ProjectRole)}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {getRoleDisplayName(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="opacity-0">Convidar</Label>
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !email}
                  className="bg-pt-green hover:bg-pt-green/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>
                  <strong>Administrador:</strong> Pode editar tudo e gerir membros
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>
                  <strong>Editor:</strong> Pode editar conteúdo e fazer upload de documentos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>
                  <strong>Visualizador:</strong> Apenas pode ver e comentar
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current members */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Membros ({members.length + 1})
            </h3>
            <div className="space-y-2">
              {/* Owner (not in members list) */}
              {isOwner && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        Eu
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">Eu (Proprietário)</div>
                      <div className="text-xs text-gray-500">Controlo total</div>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor('owner')}>
                    {getRoleDisplayName('owner')}
                  </Badge>
                </div>
              )}

              {/* Members */}
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(
                          member.profiles?.full_name || null,
                          member.profiles?.email || ''
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {member.profiles?.full_name || member.profiles?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.profiles?.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleDisplayName(member.role)}
                    </Badge>
                    {canManageRole(role || 'viewer', member.role, isOwner) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                            Alterar papel
                          </div>
                          {availableRoles.map((r) => (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleChangeRole(member, r)}
                              disabled={r === member.role}
                            >
                              {getRoleDisplayName(r)}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Convites Pendentes ({invitations.length})
                </h3>
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {invitation.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Convite enviado{' '}
                            {new Date(invitation.created_at).toLocaleDateString('pt-PT')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(invitation.role)}>
                          {getRoleDisplayName(invitation.role)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyInviteLink(invitation.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProjectModal;
