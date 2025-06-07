'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
  selectedChatModel: string;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
  selectedChatModel,
}: SuggestedActionsProps) {
  // Mini Mentor specific suggestions
  const miniMentorActions = [
    {
      title: 'Should I pursue',
      label: 'CEng, IEng, or EngTech registration?',
      action: 'Should I pursue CEng, IEng, or EngTech registration? What are the differences between these levels?',
    },
    {
      title: 'How do I document',
      label: 'evidence for UK-SPEC competencies?',
      action: 'How do I document evidence for UK-SPEC competencies? What should I include in my evidence forms?',
    },
    {
      title: 'What CPD activities',
      label: 'count towards chartership?',
      action: 'What CPD activities count towards chartership? How should I plan and record my professional development?',
    },
    {
      title: 'How do I prepare',
      label: 'for my professional review interview?',
      action: 'How do I prepare for my professional review interview? What can I expect during the process?',
    },
  ];

  // Default general suggestions (fallback, though not used in current setup)
  const defaultActions = [
    {
      title: 'What are the advantages',
      label: 'of using Next.js?',
      action: 'What are the advantages of using Next.js?',
    },
    {
      title: 'Write code to',
      label: `demonstrate djikstra's algorithm`,
      action: `Write code to demonstrate djikstra's algorithm`,
    },
    {
      title: 'Help me write an essay',
      label: `about silicon valley`,
      action: `Help me write an essay about silicon valley`,
    },
    {
      title: 'What is the weather',
      label: 'in San Francisco?',
      action: 'What is the weather in San Francisco?',
    },
  ];

  // Choose suggestions based on model - only show for Mini Mentor, hide for UK-SPEC
  const suggestedActions = selectedChatModel === 'mini-mentor-model' 
    ? miniMentorActions 
    : selectedChatModel === 'uk-spec-competency-model'
    ? [] // No suggestions for UK-SPEC model
    : defaultActions;

  // Don't render anything if no suggestions
  if (suggestedActions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.selectedChatModel !== nextProps.selectedChatModel)
      return false;

    return true;
  },
);
