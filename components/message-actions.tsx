import type { Message } from 'ai';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';
import { isCompetencyAnalysisTask } from '@/lib/competency-detection';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon, LogsIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  selectedChatModel,
  onAddToCompetencyLog,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  selectedChatModel?: string;
  onAddToCompetencyLog?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  // Check if this message contains a competency analysis and we're in UK-SPEC model
  const showCompetencyLogButton = 
    selectedChatModel === 'uk-spec-competency-model' && 
    onAddToCompetencyLog &&
    message.parts?.some(part => 
      part.type === 'text' && isCompetencyAnalysisTask(part.text)
    );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {showCompetencyLogButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="py-1 px-2 h-fit text-muted-foreground"
                variant="outline"
                onClick={onAddToCompetencyLog}
              >
                <LogsIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to Competency Log</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: 'Upvoting Response...',
                  success: () => {
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: true,
                          },
                        ];
                      },
                      { revalidate: false },
                    );

                    return 'Upvoted Response!';
                  },
                  error: 'Failed to upvote response.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted}
              onClick={async () => {
                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down',
                  }),
                });

                toast.promise(downvote, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: false,
                          },
                        ];
                      },
                      { revalidate: false },
                    );

                    return 'Downvoted Response!';
                  },
                  error: 'Failed to downvote response.',
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.selectedChatModel !== nextProps.selectedChatModel) return false;

    return true;
  },
);
