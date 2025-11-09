
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  FileText,
  Upload,
  Euro,
  CheckCircle,
  Send,
  ExternalLink,
  Lock,
  Check
} from 'lucide-react';
import { ChecklistItem } from '@/lib/progressCalculator';
import { CHECKLIST_CATEGORIES, getCategoryProgress } from '@/data/pt2030Checklist';

interface ProgressChecklistProps {
  checklist: ChecklistItem[];
  onCheckToggle: (itemId: string, checked: boolean) => void;
  onActionClick?: (link: string) => void;
}

const ProgressChecklist: React.FC<ProgressChecklistProps> = ({
  checklist,
  onCheckToggle,
  onActionClick
}) => {
  // Get icon component by name
  const getIcon = (iconName: string) => {
    const icons = {
      FileText,
      Upload,
      Euro,
      CheckCircle,
      Send
    };
    const Icon = icons[iconName as keyof typeof icons] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  // Group checklist items by category
  const groupedChecklist = CHECKLIST_CATEGORIES.map(category => ({
    ...category,
    items: checklist.filter(item => item.category === category.id),
    progress: getCategoryProgress(category.id, checklist)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist da Candidatura</CardTitle>
        <CardDescription>
          Acompanhe todos os requisitos necessários para a submissão
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Checklist Progress */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso Total</span>
            <span className="text-sm font-bold">
              {checklist.filter(c => c.checked).length} / {checklist.length}
            </span>
          </div>
          <Progress
            value={(checklist.filter(c => c.checked).length / checklist.length) * 100}
            className="h-3"
          />
        </div>

        {/* Checklist by Category */}
        <Accordion type="multiple" defaultValue={['content', 'documents']} className="w-full">
          {groupedChecklist.map(category => (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getIcon(category.icon)}
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto mr-2">
                    {category.items.filter(i => i.checked).length} / {category.items.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-2">
                  {/* Category Description */}
                  <p className="text-sm text-muted-foreground mb-3 px-2">
                    {category.description}
                  </p>

                  {/* Category Progress */}
                  <div className="px-2 mb-4">
                    <Progress value={category.progress} className="h-2" />
                  </div>

                  {/* Checklist Items */}
                  {category.items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        item.checked ? 'bg-muted/30' : ''
                      }`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => {
                          if (!item.autoCheck) {
                            onCheckToggle(item.id, checked as boolean);
                          }
                        }}
                        disabled={item.autoCheck}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={item.id}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.task}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {item.autoCheck && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                          {item.checked && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Concluído
                            </Badge>
                          )}
                        </div>
                      </div>
                      {item.link && onActionClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onActionClick(item.link!)}
                          className="shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Legenda</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Auto
              </Badge>
              <span>Verificação automática baseada em dados do projeto</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox disabled />
              <span>Itens automáticos não podem ser marcados manualmente</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>Clique para navegar para a ação relacionada</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChecklist;
