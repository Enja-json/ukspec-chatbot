'use client';

import { AddTaskButton } from '@/components/add-task-button';
import { CompetencyLogModal } from '@/components/competency-log-modal';
import { useCompetencyLog } from '@/hooks/use-competency-log';

interface CompetencyLogDemoProps {
  className?: string;
}

export function CompetencyLogDemo({ className }: CompetencyLogDemoProps) {
  const {
    isModalOpen,
    competencyCodes,
    isLoading,
    isSubmitting,
    openModal,
    closeModal,
    submitTask,
  } = useCompetencyLog();

  return (
    <div className={className}>
      {/* This is the white "Add Task" button that will go on the competency log page */}
      <div className="flex items-center justify-center p-8">
        <AddTaskButton 
          onClick={openModal}
          disabled={isSubmitting}
        />
      </div>

      {/* The competency log modal */}
      <CompetencyLogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={submitTask}
        competencyCodes={competencyCodes}
        isLoading={isSubmitting}
      />

      {/* Demo info */}
      <div className="max-w-2xl mx-auto p-6 space-y-4 text-sm text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-4">
            Competency Log Demo
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            This demo shows how the competency log modal works. In the real app, this would be integrated with the user&apos;s actual competency data and allow them to add &quot;Add to Log&quot; buttons in UK-SPEC chat responses.
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Features Implemented:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>✅ Clean modal design with no icons</li>
            <li>✅ White &quot;Add Task&quot; button</li>
            <li>✅ Manual task entry form with validation</li>
            <li>✅ Colour-coded competency selection:
              <span className="ml-2 space-x-1">
                <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">A: Red</span>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">B: Blue</span>
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">C: Green</span>
                <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">D: Orange</span>
                <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">E: Purple</span>
              </span>
            </li>
            <li>✅ Evidence file upload integration (PDF, Word, images, text)</li>
            <li>✅ Comprehensive form validation and error handling</li>
            <li>✅ Category filtering for competencies</li>
            <li>✅ File size and type validation (max 10MB per file)</li>
            <li>✅ Database integration with API endpoints</li>
            <li>✅ Toast notifications for user feedback</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Technical Implementation:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>Modal built with Radix UI AlertDialog</li>
            <li>Form validation using Zod schema</li>
            <li>File upload handling with type/size validation</li>
            <li>Database schema for tasks, competencies, and evidence</li>
            <li>API endpoints for competency codes and task creation</li>
            <li>Custom React hook for state management</li>
            <li>British English throughout (colour, not color)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Next Phase:</h4>
          <p>📋 <strong>Phase 4</strong>: Create the full competency log page with task listing, progress tracking, and dashboard features.</p>
        </div>
      </div>
    </div>
  );
} 