export const DEFAULT_CHAT_MODEL: string = 'mini-mentor-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'mini-mentor-model',
    name: 'Mini Mentor',
    description: 'Your guide through the UK engineering chartership journey',
  },
  {
    id: 'uk-spec-competency-model',
    name: 'UK-SPEC Competency Analyser',
    description: 'Analyses engineering tasks against UK-SPEC Fourth Edition competencies',
  },
];
