'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

interface CompetencyCode {
  id: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  description: string;
}

interface CompetencyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: TaskFormData) => void;
  competencyCodes: CompetencyCode[];
  isLoading?: boolean;
  editingTask?: {
    id: string;
    title: string;
    description: string;
    competencies: Array<{
      competencyCodeId: string;
    }>;
  } | null;
  aiAnalysisData?: {
    taskTitle: string;
    taskDescription: string;
    demonstratedCompetencies: Array<{
      code: string;
      confidence_percentage: number;
      explanation: string;
    }>;
  } | null;
}

interface TaskFormData {
  title: string;
  description: string;
  competencyCodeIds: string[];
  evidenceFiles: File[];
}

interface FormErrors {
  title?: string;
  description?: string;
  competencyCodeIds?: string;
  evidenceFiles?: string;
}

// Competency category colour mapping
const categoryColours = {
  A: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  B: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  C: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  D: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  E: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
} as const;

const categoryNames = {
  A: 'Knowledge and Understanding',
  B: 'Design and Problem Solving',
  C: 'Management and Leadership',
  D: 'Communication Skills',
  E: 'Professional Commitment',
} as const;

export function CompetencyLogModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  competencyCodes,
  isLoading = false,
  editingTask = null,
  aiAnalysisData = null
}: CompetencyLogModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: editingTask?.title || '',
    description: editingTask?.description || '',
    competencyCodeIds: editingTask?.competencies.map(c => c.competencyCodeId) || [],
    evidenceFiles: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Update form data when editingTask or aiAnalysisData changes
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        competencyCodeIds: editingTask.competencies.map(c => c.competencyCodeId),
        evidenceFiles: [],
      });
    } else if (aiAnalysisData) {
      setFormData({
        title: aiAnalysisData.taskTitle,
        description: aiAnalysisData.taskDescription,
        competencyCodeIds: aiAnalysisData.demonstratedCompetencies.map(c => c.code),
        evidenceFiles: [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        competencyCodeIds: [],
        evidenceFiles: [],
      });
    }
    setErrors({});
    setSelectedCategory('all');
  }, [editingTask, aiAnalysisData]);

  // Group competency codes by category
  const groupedCompetencies = competencyCodes.reduce((acc, code) => {
    if (!acc[code.category]) {
      acc[code.category] = [];
    }
    acc[code.category].push(code);
    return acc;
  }, {} as Record<string, CompetencyCode[]>);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Task title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Task description must be at least 10 characters';
    }

    if (formData.competencyCodeIds.length === 0) {
      newErrors.competencyCodeIds = 'At least one competency must be selected';
    }

    if (formData.evidenceFiles.length > 10) {
      newErrors.evidenceFiles = 'Maximum 10 files allowed';
    }

    // Validate file sizes (max 10MB per file)
    const oversizedFiles = formData.evidenceFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      newErrors.evidenceFiles = 'Each file must be smaller than 10MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...files]
    }));
    
    // Clear file input for reuse
    e.target.value = '';
  }, []);

  // Remove file
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  // Toggle competency selection
  const toggleCompetency = (competencyId: string) => {
    setFormData(prev => ({
      ...prev,
      competencyCodeIds: prev.competencyCodeIds.includes(competencyId)
        ? prev.competencyCodeIds.filter(id => id !== competencyId)
        : [...prev.competencyCodeIds, competencyId]
    }));
  };

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      competencyCodeIds: [],
      evidenceFiles: [],
    });
    setErrors({});
    setSelectedCategory('all');
    onClose();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            {editingTask 
              ? 'Edit Competency Task' 
              : aiAnalysisData 
                ? 'Add Competency Task (AI Analysis)' 
                : 'Add Competency Task'
            }
          </AlertDialogTitle>
          {aiAnalysisData && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>This task has been pre-populated with AI competency analysis. You can review and modify the suggestions before saving.</span>
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a descriptive title for your task"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Task Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you did, the challenges you faced, and the outcomes achieved"
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Competency Selection */}
          <div className="space-y-3">
            <Label>UK-SPEC Competencies Demonstrated</Label>
            
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryNames).map(([category, name]) => (
                  <SelectItem key={category} value={category}>
                    {category}: {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Competency Grid */}
            <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {Object.entries(groupedCompetencies)
                .filter(([category]) => !selectedCategory || selectedCategory === 'all' || category === selectedCategory)
                .map(([category, codes]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {category}: {categoryNames[category as keyof typeof categoryNames]}
                    </h4>
                    <div className="grid gap-2">
                      {codes.map((code) => {
                        // Check if this competency was suggested by AI analysis
                        const aiSuggestion = aiAnalysisData?.demonstratedCompetencies.find(
                          comp => comp.code === code.id
                        );
                        
                        return (
                          <button
                            key={code.id}
                            type="button"
                            onClick={() => toggleCompetency(code.id)}
                            className={`
                              p-3 rounded-lg border text-sm text-left transition-all relative
                              ${formData.competencyCodeIds.includes(code.id) 
                                ? categoryColours[code.category] 
                                : 'bg-background hover:bg-muted border-border'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{code.id}: {code.title}</div>
                              {aiSuggestion && (
                                <div className="flex items-center gap-1 text-xs">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                                    AI: {aiSuggestion.confidence_percentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {code.description}
                            </div>
                            {aiSuggestion && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-950 p-1.5 rounded">
                                <strong>AI Analysis:</strong> {aiSuggestion.explanation}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
            
            {errors.competencyCodeIds && (
              <p className="text-sm text-red-600">{errors.competencyCodeIds}</p>
            )}
            
            {formData.competencyCodeIds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {formData.competencyCodeIds.join(', ')}
              </div>
            )}
          </div>

          {/* Evidence Upload */}
          <div className="space-y-3">
            <Label>Evidence Files (Optional)</Label>
            <div className="space-y-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, Word documents, images, text files. Max 10MB per file.
              </p>
            </div>

            {/* Uploaded Files List */}
            {formData.evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files ({formData.evidenceFiles.length})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.evidenceFiles && (
              <p className="text-sm text-red-600">{errors.evidenceFiles}</p>
            )}
          </div>

          {/* Form Actions */}
          <AlertDialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading 
                ? (editingTask ? 'Updating Task...' : 'Adding Task...') 
                : (editingTask ? 'Update Task' : 'Add Task')
              }
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
} 