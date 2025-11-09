import React from 'react';
import { LucideIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  secondaryText?: string;
  className?: string;
  minHeight?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  secondaryText,
  className = '',
  minHeight = 'min-h-[300px]'
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} text-center p-6 ${className}`}>
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {action && (
            <Button
              onClick={action.onClick}
              size="lg"
              variant={action.variant || 'default'}
              className="w-full sm:w-auto"
            >
              {action.icon && <action.icon className="mr-2 h-5 w-5" />}
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              size="lg"
              variant={secondaryAction.variant || 'outline'}
              className="w-full sm:w-auto"
            >
              {secondaryAction.icon && <secondaryAction.icon className="mr-2 h-5 w-5" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {secondaryText && (
        <p className="text-sm text-muted-foreground mt-4">{secondaryText}</p>
      )}
    </div>
  );
}

// Specialized empty state variants for common use cases
export function EmptyStateWithBorder(props: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed rounded-lg">
      <EmptyState {...props} />
    </div>
  );
}

// Search-specific empty state
interface SearchEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export function SearchEmptyState({ searchQuery, onClearSearch }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <Search className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-muted-foreground text-center mb-2">
        Nenhum resultado encontrado para <strong>"{searchQuery}"</strong>
      </p>
      <Button variant="link" onClick={onClearSearch} className="mt-2">
        Limpar pesquisa
      </Button>
    </div>
  );
}

export default EmptyState;
