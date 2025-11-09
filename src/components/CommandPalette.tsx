import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  FolderPlus,
  FileText,
  Settings,
  LogOut,
  Download,
  Sparkles,
  Clock,
  Upload,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';

interface Project {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user, signOut } = useAuth();

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);

        // Track command palette opened
        if (!open) {
          analytics.featureUsed('command_palette', { action: 'opened' });
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // Fetch recent projects when palette opens
  useEffect(() => {
    if (open && user) {
      fetchRecentProjects();
    }
  }, [open, user]);

  const fetchRecentProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentProjects(data || []);
    } catch (error) {
      console.error('Error fetching recent projects:', error);
    }
  };

  const handleCommand = (command: string, metadata?: Record<string, any>) => {
    analytics.featureUsed('command_palette', {
      action: 'command_executed',
      command,
      ...metadata
    });
    setOpen(false);
  };

  // Check if we're on a project page
  const isProjectPage = location.pathname.startsWith('/projects/');
  const currentProjectId = params.projectId;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation Commands */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              handleCommand('navigate_dashboard');
              navigate('/');
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
        </CommandGroup>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Projects">
              {recentProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => {
                    handleCommand('open_project', { projectId: project.id });
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{project.title}</div>
                    {project.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Action Commands */}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              handleCommand('create_project');
              navigate('/dashboard');
              // Trigger project creation after navigation
              setTimeout(() => {
                const createButton = document.querySelector('[data-command="create-project"]') as HTMLButtonElement;
                if (createButton) createButton.click();
              }, 100);
            }}
            disabled={!user}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            <span>Create Project</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>N
            </kbd>
          </CommandItem>

          {isProjectPage && currentProjectId && (
            <>
              <CommandItem
                onSelect={() => {
                  handleCommand('upload_document', { projectId: currentProjectId });
                  // Close command palette and focus on upload
                  // This would need to be implemented in the project page
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload Document</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>U
                </kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  handleCommand('view_progress', { projectId: currentProjectId });
                  // Switch to progress tab
                  const progressTab = document.querySelector('[data-tab="progress"]') as HTMLButtonElement;
                  if (progressTab) progressTab.click();
                }}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>View Progress Dashboard</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>P
                </kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  handleCommand('generate_ai', { projectId: currentProjectId });
                  // This would trigger AI generation
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Generate with AI</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>G
                </kbd>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  handleCommand('export_pdf', { projectId: currentProjectId });
                  // This would trigger PDF export
                  const exportButton = document.querySelector('[data-command="export-pdf"]') as HTMLButtonElement;
                  if (exportButton) exportButton.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Export PDF</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>E
                </kbd>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {/* Account Commands */}
        {user && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem
                onSelect={async () => {
                  handleCommand('logout');
                  await signOut();
                  navigate('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
