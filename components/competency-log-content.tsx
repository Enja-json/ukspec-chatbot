'use client';

import { useState, useEffect } from 'react';
import type { Session } from 'next-auth';
import { CompetencyLogHeader } from '@/components/competency-log-header';
import { AddTaskButton } from '@/components/add-task-button';
import { CompetencyLogModal } from '@/components/competency-log-modal';
import { CompetencyLogEmptyState } from '@/components/competency-log-empty-state';
import { TaskList } from '@/components/task-list';
import { useCompetencyLog } from '@/hooks/use-competency-log';
import { toast } from 'sonner';

interface CompetencyTask {
  id: string;
  title: string;
  description: string;
  source: 'manual' | 'ai_analysis';
  createdAt: Date;
  competencies: Array<{
    competencyCodeId: string;
    code: {
      id: string;
      category: 'A' | 'B' | 'C' | 'D' | 'E';
      title: string;
      description: string;
    };
  }>;
  evidence: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

interface CompetencyLogContentProps {
  session: Session;
}

export function CompetencyLogContent({ session }: CompetencyLogContentProps) {
  const [tasks, setTasks] = useState<CompetencyTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [editingTask, setEditingTask] = useState<CompetencyTask | null>(null);

  const {
    isModalOpen,
    openModal,
    closeModal,
    openModalWithAnalysis,
    submitTask,
    competencyCodes,
    isLoading,
    isSubmitting,
    modalData,
  } = useCompetencyLog();

  // Fetch user's tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch('/api/competency-tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Handle task submission (both new and edit)
  const handleTaskSubmit = async (formData: any) => {
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, formData);
      } else {
        // Create new task
        await submitTask(formData);
      }
      
      // Refresh task list
      await fetchTasks();
      setEditingTask(null);
    } catch (error) {
      // Error handling is done in the submitTask/updateTask functions
    }
  };

  // Update existing task
  const updateTask = async (taskId: string, formData: any) => {
    const updateData = new FormData();
    updateData.append('title', formData.title);
    updateData.append('description', formData.description);
    updateData.append('competencyCodeIds', JSON.stringify(formData.competencyCodeIds));
    
    // Append files
    formData.evidenceFiles.forEach((file: File, index: number) => {
      updateData.append(`evidenceFile_${index}`, file);
    });

    const response = await fetch(`/api/competency-tasks/${taskId}`, {
      method: 'PUT',
      body: updateData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update task');
    }

    toast.success('Task updated successfully!');
  };

  // Handle edit action
  const handleEdit = (task: CompetencyTask) => {
    setEditingTask(task);
    openModal();
  };

  // Handle delete action
  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/competency-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast.success('Task deleted successfully!');
      await fetchTasks(); // Refresh task list
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setEditingTask(null);
    closeModal();
  };

  // Handle add task
  const handleAddTask = () => {
    setEditingTask(null);
    openModal();
  };

  return (
    <div className="group w-full overflow-auto">
      {/* Header - simplified for competency log */}
      <CompetencyLogHeader session={session} />

              {/* Main Content */}
        <div className="mx-auto max-w-3xl px-4 pb-24">
          {/* Page Title and Add Button */}
          <div className="flex items-center justify-between mb-8 pt-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Competency Log
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your engineering tasks and map them to UK-SPEC competencies
              </p>
            </div>
            
            {/* Add Task Button - only show if user has tasks */}
            {tasks.length > 0 && (
              <AddTaskButton 
                onClick={handleAddTask}
                disabled={isSubmitting}
              />
            )}
          </div>

        {/* Content */}
        {isLoadingTasks ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          // Empty state
          <CompetencyLogEmptyState 
            onAddTask={handleAddTask}
            disabled={isSubmitting}
          />
        ) : (
          // Task list
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      <CompetencyLogModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleTaskSubmit}
        competencyCodes={competencyCodes}
        isLoading={isSubmitting}
        editingTask={editingTask}
      />
    </div>
  );
} 