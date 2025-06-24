'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CompetencyCode {
  id: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  description: string;
}

interface TaskFormData {
  title: string;
  description: string;
  competencyCodeIds: string[];
  evidenceFiles: File[];
}

export function useCompetencyLog() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [competencyCodes, setCompetencyCodes] = useState<CompetencyCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch competency codes from database
  useEffect(() => {
    if (isModalOpen && competencyCodes.length === 0) {
      fetchCompetencyCodes();
    }
  }, [isModalOpen, competencyCodes.length]);

  const fetchCompetencyCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/competency-codes');
      if (!response.ok) {
        throw new Error('Failed to fetch competency codes');
      }
      const codes = await response.json();
      setCompetencyCodes(codes);
    } catch (error) {
      console.error('Error fetching competency codes:', error);
      toast.error('Failed to load competency codes');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const submitTask = async (formData: TaskFormData) => {
    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('competencyCodeIds', JSON.stringify(formData.competencyCodeIds));
      
      // Append files
      formData.evidenceFiles.forEach((file, index) => {
        submitData.append(`evidenceFile_${index}`, file);
      });

      const response = await fetch('/api/competency-tasks', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const result = await response.json();
      
      toast.success('Task added successfully!');
      closeModal();
      
      return result;
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add task');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isModalOpen,
    competencyCodes,
    isLoading,
    isSubmitting,
    openModal,
    closeModal,
    submitTask,
  };
} 