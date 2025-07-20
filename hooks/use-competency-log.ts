'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useUserEntitlements } from './use-user-entitlements';
import { usePaywall } from '@/components/paywall-provider';

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
  const [currentTaskCount, setCurrentTaskCount] = useState(0);
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

  const { entitlements, loading: entitlementsLoading } = useUserEntitlements();
  const { showPaywall } = usePaywall();

  // Fetch competency codes from database
  useEffect(() => {
    if (isModalOpen && competencyCodes.length === 0) {
      fetchCompetencyCodes();
    }
  }, [isModalOpen, competencyCodes.length]);

  // Fetch current task count when entitlements are loaded
  useEffect(() => {
    if (entitlements && !entitlementsLoading) {
      fetchCurrentTaskCount();
    }
  }, [entitlements, entitlementsLoading]);

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

  const fetchCurrentTaskCount = async () => {
    try {
      const response = await fetch('/api/competency-tasks');
      if (response.ok) {
        const data = await response.json();
        setCurrentTaskCount(data.tasks?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching task count:', error);
    }
  };

  const canAddMoreTasks = () => {
    if (!entitlements) return true; // Allow if entitlements not loaded yet
    return currentTaskCount < entitlements.maxCompetencyTasks;
  };

  const openModal = () => {
    if (!canAddMoreTasks()) {
      // Show paywall modal instead of competency modal
      showPaywall('competency-limit');
      return;
    }
    setIsModalOpen(true);
  };

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
    if (!canAddMoreTasks()) {
      // Show paywall modal instead of competency modal
      showPaywall('competency-limit');
      return;
    }
    setModalData(analysisData);
    setIsModalOpen(true);
  }, [entitlements, currentTaskCount, showPaywall]);

  const submitTask = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/competency-tasks', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.requiresUpgrade) {
          // Show paywall modal for upgrade
          showPaywall('competency-limit');
          return { success: false };
        }
        throw new Error(result.error || 'Failed to create task');
      }

      toast.success('Competency task created successfully!');
      
      // Refresh task count after successful creation
      setCurrentTaskCount(prev => prev + 1);
      
      return { success: true, taskId: result.taskId };
    } catch (error) {
      console.error('Error creating competency task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
    openModalWithAnalysis,
    submitTask,
    competencyCodes,
    isLoading,
    isSubmitting,
    modalData,
    currentTaskCount,
    maxTasks: entitlements?.maxCompetencyTasks || 0,
    canAddMoreTasks: canAddMoreTasks(),
    tasksRemaining: entitlements ? Math.max(0, entitlements.maxCompetencyTasks - currentTaskCount) : 0,
  };
} 