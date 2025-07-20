'use client';

import { Button } from '@/components/ui/button';

interface CompetencyLogEmptyStateProps {
  onAddTask: () => void;
  disabled?: boolean;
}

export function CompetencyLogEmptyState({
  onAddTask,
  disabled = false,
}: CompetencyLogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Start Building Your Competency Log</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Track your engineering tasks and map them to UK-SPEC competencies to prepare for your professional registration.
        </p>
        
        <Button onClick={onAddTask} disabled={disabled} size="lg">
          Add Your First Task
        </Button>
      </div>
    </div>
  );
} 