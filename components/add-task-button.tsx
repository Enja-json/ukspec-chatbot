'use client';

import { Button } from '@/components/ui/button';

interface AddTaskButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddTaskButton({ onClick, disabled = false }: AddTaskButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="
        bg-white 
        text-black 
        border-2 
        border-gray-200 
        hover:bg-gray-50 
        hover:border-gray-300 
        focus:bg-gray-50 
        focus:border-gray-400 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        shadow-sm
        font-medium
        px-6 
        py-2
      "
    >
      Add Task
    </Button>
  );
} 