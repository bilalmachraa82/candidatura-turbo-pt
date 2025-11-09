import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions';
import { Users, Crown } from 'lucide-react';

interface ProjectMembersProps {
  projectId: string;
  maxVisible?: number;
  onOpenShareModal?: () => void;
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({
  projectId,
  maxVisible = 3,
  onOpenShareModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { members, isOwner, permissions, loading } = useProjectPermissions(projectId);

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

  const totalMembers = members.length + 1; // +1 for owner
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, totalMembers - maxVisible);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {/* Owner indicator */}
              {isOwner && (
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                    <Crown className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Visible members */}
              {visibleMembers.map((member, idx) => (
                <Avatar
                  key={member.id}
                  className="h-8 w-8 border-2 border-white shadow-sm"
                >
                  <AvatarImage src={member.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {getInitials(
                      member.profiles?.full_name || null,
                      member.profiles?.email || ''
                    )}
                  </AvatarFallback>
                </Avatar>
              ))}

              {/* Remaining count */}
              {remainingCount > 0 && (
                <Avatar className="h-8 w-8 border-2 border-white bg-gray-100 shadow-sm">
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <span className="text-sm text-gray-600">
              <Users className="h-4 w-4" />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Membros do Projeto ({totalMembers})
              </h3>
              {permissions.canInviteMembers && onOpenShareModal && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenShareModal();
                  }}
                  className="text-pt-green hover:text-pt-green/90"
                >
                  Partilhar
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {/* Owner */}
              {isOwner && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      Eu
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      Eu (Proprietário)
                    </div>
                    <div className="text-xs text-gray-500">Controlo total</div>
                  </div>
                  <Badge className={getRoleBadgeColor('owner')}>
                    <Crown className="h-3 w-3 mr-1" />
                    {getRoleDisplayName('owner')}
                  </Badge>
                </div>
              )}

              {/* Members */}
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(
                        member.profiles?.full_name || null,
                        member.profiles?.email || ''
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.profiles?.full_name || member.profiles?.email}
                    </div>
                    {member.profiles?.full_name && (
                      <div className="text-xs text-gray-500 truncate">
                        {member.profiles?.email}
                      </div>
                    )}
                  </div>
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {getRoleDisplayName(member.role)}
                  </Badge>
                </div>
              ))}

              {members.length === 0 && !isOwner && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Ainda não há membros neste projeto
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectMembers;
