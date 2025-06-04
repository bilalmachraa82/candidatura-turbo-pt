
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Zap, 
  Target, 
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';

interface ProjectStatsProps {
  totalSections: number;
  completedSections: number;
  totalChars: number;
  totalCharLimit: number;
  documentsCount: number;
  lastGenerated?: Date;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({
  totalSections,
  completedSections,
  totalChars,
  totalCharLimit,
  documentsCount,
  lastGenerated
}) => {
  const completionPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  const charUsagePercentage = totalCharLimit > 0 ? (totalChars / totalCharLimit) * 100 : 0;

  const stats = [
    {
      title: 'Secções Completas',
      value: `${completedSections}/${totalSections}`,
      percentage: completionPercentage,
      icon: Target,
      color: completionPercentage >= 100 ? 'text-green-600' : 'text-blue-600'
    },
    {
      title: 'Utilização de Caracteres',
      value: `${totalChars.toLocaleString()}/${totalCharLimit.toLocaleString()}`,
      percentage: charUsagePercentage,
      icon: FileText,
      color: charUsagePercentage > 90 ? 'text-red-600' : charUsagePercentage > 70 ? 'text-amber-600' : 'text-green-600'
    },
    {
      title: 'Documentos Indexados',
      value: documentsCount.toString(),
      icon: Database,
      color: 'text-purple-600'
    },
    {
      title: 'Última Geração IA',
      value: lastGenerated ? lastGenerated.toLocaleDateString('pt-PT') : 'Nunca',
      icon: Zap,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            {stat.percentage !== undefined && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stat.percentage >= 100 ? 'bg-green-500' :
                      stat.percentage > 70 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {stat.percentage.toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectStats;
