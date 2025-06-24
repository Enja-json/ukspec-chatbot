'use client';

import { AddTaskButton } from '@/components/add-task-button';

interface CompetencyLogEmptyStateProps {
  onAddTask: () => void;
  disabled?: boolean;
}

export function CompetencyLogEmptyState({ 
  onAddTask, 
  disabled = false 
}: CompetencyLogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon placeholder - clean minimalist design */}
      <div className="w-16 h-16 bg-muted rounded-lg mb-6 flex items-center justify-center">
        <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
      </div>
      
      {/* Heading */}
      <h3 className="text-xl font-semibold text-foreground mb-3">
        Start Building Your Competency Portfolio
      </h3>
      
      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Record your engineering tasks and map them to UK-SPEC competencies. 
        Track your progress towards chartership by documenting your professional achievements.
      </p>
      
      {/* Call to Action */}
      <AddTaskButton 
        onClick={onAddTask}
        disabled={disabled}
      />
      
      {/* Help text */}
      <p className="text-sm text-muted-foreground mt-6 max-w-lg">
        Add tasks that demonstrate your engineering competencies across the five UK-SPEC categories: 
        Knowledge & Understanding, Design & Problem Solving, Management & Leadership, 
        Communication Skills, and Professional Commitment.
      </p>
    </div>
  );
} 