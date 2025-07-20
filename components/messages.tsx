import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo, useCallback } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { extractCompetencyAnalysis } from '@/lib/competency-detection';
import { useCompetencyLog } from '@/hooks/use-competency-log';
import { CompetencyLogModal } from './competency-log-modal';
import type { Session } from 'next-auth';

interface TaskFormData {
  title: string;
  description: string;
  competencyCodeIds: string[];
  evidenceFiles: File[];
}

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedChatModel: string;
  session?: Session;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  selectedChatModel,
  session,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  const {
    isModalOpen,
    competencyCodes,
    isLoading: isCompetencyLoading,
    isSubmitting,
    modalData,
    closeModal,
    submitTask,
    openModalWithAnalysis,
  } = useCompetencyLog();

  // Handler for adding competency analysis to log
  const handleAddToCompetencyLog = useCallback((message: UIMessage) => {
    // Extract competency analysis from the message
    const textContent = message.parts
      ?.filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n');
    
    if (!textContent) return;
    
    const analysis = extractCompetencyAnalysis(textContent);
    if (!analysis) return;
    
    // Find the user message that preceded this AI response
    const messageIndex = messages.findIndex(m => m.id === message.id);
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;
    const userContent = userMessage?.content || '';
    
    // Generate a suggested title from the user's message
    const suggestedTitle = userContent.length > 50 
      ? userContent.substring(0, 47) + '...'
      : userContent || 'Engineering Task';
    
    // Store AI metadata for the submit handler
    const aiMetadata = {
      chatId,
      messageId: message.id,
      aiModel: selectedChatModel,
      aiResponseData: {
        originalText: textContent,
        analysis,
        userPrompt: userContent,
      },
    };
    
    // Open the modal with pre-populated data and enhanced submit handler
    openModalWithAnalysis({
      taskTitle: suggestedTitle,
      taskDescription: userContent,
      demonstratedCompetencies: analysis.demonstrated_competencies,
      aiMetadata, // Pass AI metadata to the modal
    });
  }, [chatId, messages, selectedChatModel, openModalWithAnalysis]);

  // Enhanced submit handler that includes AI metadata
  const handleSubmitTaskWithAI = useCallback(async (formData: TaskFormData) => {
    const aiMetadata = modalData?.aiMetadata;
    
    // Convert TaskFormData to browser FormData
    const browserFormData = new FormData();
    browserFormData.append('title', formData.title);
    browserFormData.append('description', formData.description);
    
    // Add competency codes
    formData.competencyCodeIds.forEach(id => {
      browserFormData.append('competencyCodeIds', id);
    });
    
    // Add evidence files
    formData.evidenceFiles.forEach(file => {
      browserFormData.append('evidenceFiles', file);
    });
    
    // Append AI metadata to the FormData if it exists
    if (aiMetadata) {
      browserFormData.append('aiMetadata', JSON.stringify(aiMetadata));
    }
    
    try {
      const result = await submitTask(browserFormData);
      if (result.success) {
        closeModal();
      }
    } catch (error) {
      console.error('Error in AI task submit:', error);
    }
  }, [submitTask, modalData, closeModal]);

  return (
    <>
      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
      >
        {messages.length === 0 && <Greeting selectedChatModel={selectedChatModel} session={session} />}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
            selectedChatModel={selectedChatModel}
            onAddToCompetencyLog={() => handleAddToCompetencyLog(message)}
            session={session}
          />
        ))}

        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        <motion.div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
          onViewportLeave={onViewportLeave}
          onViewportEnter={onViewportEnter}
        />
      </div>

      {/* Competency Log Modal */}
      <CompetencyLogModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitTaskWithAI}
        competencyCodes={competencyCodes}
        isLoading={isSubmitting}
        aiAnalysisData={modalData}
      />
    </>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
