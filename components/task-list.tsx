'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { BotIcon, SparklesIcon } from '@/components/icons';

interface CompetencyTask {
  id: string;
  title: string;
  description: string;
  source: 'manual' | 'ai_analysis';
  createdAt: Date;
  // AI-specific metadata
  chatId?: string;
  messageId?: string;
  aiModel?: string;
  competencies: Array<{
    competencyCodeId: string;
    code: {
      id: string;
      category: 'A' | 'B' | 'C' | 'D' | 'E';
      title: string;
      description: string;
    };
    // AI competency metadata
    confidenceScore?: number;
    aiExplanation?: string;
    sourceType?: 'ai_suggested' | 'manual_added' | 'ai_modified';
  }>;
  evidence: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

interface TaskListProps {
  tasks: CompetencyTask[];
  onEdit: (task: CompetencyTask) => void;
  onDelete: (taskId: string) => void;
}

// Competency category colour mapping
const categoryColours = {
  A: 'bg-red-100 text-red-800 border-red-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-green-100 text-green-800 border-green-200',
  D: 'bg-orange-100 text-orange-800 border-orange-200',
  E: 'bg-purple-100 text-purple-800 border-purple-200',
} as const;

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteTaskId) {
      onDelete(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className={`border ${task.source === 'ai_analysis' ? 'border-[#288E99]' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-lg">
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {task.description}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(task)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTaskId(task.id)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Competencies */}
              {task.competencies && task.competencies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Competencies Demonstrated:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {task.competencies.map((comp) => (
                      <div key={comp.competencyCodeId} className="relative">
                        <span
                          className={`
                            inline-block px-2 py-1 text-xs font-medium rounded border
                            ${categoryColours[comp.code?.category || 'A']}
                            ${comp.sourceType === 'ai_suggested' ? 'ring-1 ring-[#288E99]/50 dark:ring-[#288E99]/70' : ''}
                          `}
                        >
                          {comp.code?.id || comp.competencyCodeId}
                          {comp.confidenceScore && (
                            <span className="ml-1 opacity-75">
                              {Math.round(comp.confidenceScore)}%
                            </span>
                          )}
                        </span>
                        {comp.sourceType === 'ai_suggested' && (
                          <div className="absolute -top-1 -right-1 text-[#288E99]">
                            <SparklesIcon size={10} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Files */}
              {task.evidence && task.evidence.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Evidence Files ({task.evidence.length}):
                  </h4>
                  <div className="space-y-1">
                    {task.evidence.slice(0, 3).map((file) => (
                      <div key={file.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate font-medium">{file.fileName}</span>
                        <span>({formatFileSize(file.fileSize)})</span>
                      </div>
                    ))}
                    {task.evidence && task.evidence.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{task.evidence.length - 3} more files
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-4">
                  <span>
                    Added: {format(new Date(task.createdAt), 'dd MMM yyyy')}
                  </span>
                  {task.source === 'ai_analysis' ? (
                    <div className="flex items-center gap-1 text-[#288E99] dark:text-[#288E99] font-medium">
                      <span>Generated from UK-SPEC Chat Analysis</span>
                    </div>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Manual Entry
                    </span>
                  )}
                </div>
                {task.source === 'ai_analysis' && (
                  <div className="flex items-center gap-1 text-xs text-[#288E99] dark:text-[#288E99]">
                    <SparklesIcon size={12} />
                    <span>AI Powered</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
              All associated competencies and evidence files will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 