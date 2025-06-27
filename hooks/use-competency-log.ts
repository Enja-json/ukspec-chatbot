'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [modalData, setModalData] = useState<{
    taskTitle: string;
    taskDescription: string;
    demonstratedCompetencies: Array<{
      code: string;
      confidence_percentage: number;
      explanation: string;
    }>;
    aiMetadata?: {
      chatId: string;
      messageId: string;
      aiModel: string;
      aiResponseData?: any;
    };
  } | null>(null);

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
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const openModalWithAnalysis = useCallback((analysisData: {
    taskTitle: string;
    taskDescription: string;
    demonstratedCompetencies: Array<{
      code: string;
      confidence_percentage: number;
      explanation: string;
    }>;
    aiMetadata?: {
      chatId: string;
      messageId: string;
      aiModel: string;
      aiResponseData?: any;
    };
  }) => {
    setModalData(analysisData);
    setIsModalOpen(true);
  }, []);

  const submitTask = async (formData: TaskFormData, aiMetadata?: {
    chatId: string;
    messageId: string;
    aiModel: string;
    aiResponseData?: any;
  }) => {
    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('competencyCodeIds', JSON.stringify(formData.competencyCodeIds));
      
      // Add AI metadata if provided
      if (aiMetadata) {
        submitData.append('chatId', aiMetadata.chatId);
        submitData.append('messageId', aiMetadata.messageId);
        submitData.append('aiModel', aiMetadata.aiModel);
        if (aiMetadata.aiResponseData) {
          submitData.append('aiResponseData', JSON.stringify(aiMetadata.aiResponseData));
        }
        
        // Map modal data to AI competency data if available
        if (modalData) {
          const aiCompetencyData = modalData.demonstratedCompetencies.map(comp => ({
            competencyCodeId: comp.code,
            confidenceScore: comp.confidence_percentage,
            aiExplanation: comp.explanation,
          }));
          submitData.append('aiCompetencyData', JSON.stringify(aiCompetencyData));
        }
      }
      
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
    modalData,
    openModal,
    closeModal,
    submitTask,
    openModalWithAnalysis,
  };
} 