import type {
  ChatMessage,
  Document,
  SourceReference,
  UploadMetadata,
} from "@/types";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(
      res.status,
      (body as { detail?: string }).detail ?? res.statusText,
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  conversation_id?: string;
}

export async function sendChat(
  question: string,
  history: Pick<ChatMessage, "role" | "content">[],
  conversationId?: string,
): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({
      question,
      history,
      conversation_id: conversationId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function uploadDocument(
  file: File,
  metadata: UploadMetadata,
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", metadata.title);
  formData.append("category", metadata.category);
  formData.append("tags", JSON.stringify(metadata.tags));

  const url = `${API_BASE}/documents`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(
      res.status,
      (body as { detail?: string }).detail ?? res.statusText,
    );
  }

  return res.json() as Promise<Document>;
}

export async function getDocuments(category?: string): Promise<Document[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<Document[]>(`/documents${params}`);
}

export async function deleteDocument(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/documents/${id}`, { method: "DELETE" });
}

export async function getCategories(): Promise<string[]> {
  return request<string[]>("/documents/categories");
}

export async function searchDocuments(query: string): Promise<Document[]> {
  return request<Document[]>(
    `/documents/search?q=${encodeURIComponent(query)}`,
  );
}
