export interface Document {
  id: string;
  title: string;
  category: string;
  tags: string[];
  chunk_count: number;
  file_size: number;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface SourceReference {
  document_title: string;
  content_preview: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface UploadMetadata {
  title: string;
  category: string;
  tags: string[];
}

export interface ApiError {
  detail: string;
}
