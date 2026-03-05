import { client } from './api';
import {
  LegalResponse,
  LegalDomain,
  LegalHotlinesResponse,
} from '../types';

export interface ChatRequest {
  question: string;
  language: string;
  domain: LegalDomain;
  history: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatApiResponse {
  response: LegalResponse;
  emergency: boolean;
}

export interface DocumentRequest {
  image: string;        // base64
  media_type: string;
  question: string;
  language: string;
}

export interface VoiceRequest {
  audio: string;        // base64
  language: string;
  domain: LegalDomain;
}

export interface VoiceApiResponse {
  transcription: string;
  response: LegalResponse;
  emergency: boolean;
  audio_response: string | null;  // base64 mp3
}

export const legalApi = {
  chat: async (req: ChatRequest): Promise<ChatApiResponse> => {
    const res = await client.post<ChatApiResponse>('/legal/chat', req);
    return res.data;
  },

  analyzeDocument: async (req: DocumentRequest): Promise<{ response: LegalResponse }> => {
    const res = await client.post<{ response: LegalResponse }>('/legal/document', req);
    return res.data;
  },

  voice: async (req: VoiceRequest): Promise<VoiceApiResponse> => {
    const res = await client.post<VoiceApiResponse>('/legal/voice', req);
    return res.data;
  },

  getHotlines: async (): Promise<LegalHotlinesResponse> => {
    const res = await client.get<LegalHotlinesResponse>('/legal/hotlines');
    return res.data;
  },
};
