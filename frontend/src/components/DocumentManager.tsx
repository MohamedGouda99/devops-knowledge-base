import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  FileText,
  Loader2,
  X,
  Plus,
  FolderOpen,
  Search,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Document, UploadMetadata } from "@/types";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  getCategories,
} from "@/lib/api";
import { cn, formatFileSize, formatDate } from "@/lib/utils";

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload form state
  const [showUpload, setShowUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await getDocuments(activeCategory);
      setDocuments(docs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    } finally {
      setIsLoadingDocs(false);
    }
  }, [activeCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      // Categories endpoint may not exist yet; ignore
    }
  }, []);

  useEffect(() => {
    void fetchDocuments();
    void fetchCategories();
  }, [fetchDocuments, fetchCategories]);

  const clearNotification = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setCategory("");
    setTagsInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const metadata: UploadMetadata = {
      title: title || selectedFile.name.replace(/\.[^/.]+$/, ""),
      category: category || "general",
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      setIsUploading(true);
      setError(null);
      await uploadDocument(selectedFile, metadata);
      setSuccess(`"${metadata.title}" uploaded successfully`);
      resetForm();
      setShowUpload(false);
      void fetchDocuments();
      void fetchCategories();
      clearNotification();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed",
      );
      clearNotification();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      setDeletingId(doc.id);
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setSuccess(`"${doc.title}" deleted`);
      void fetchCategories();
      clearNotification();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Delete failed",
      );
      clearNotification();
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = searchQuery
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags.some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
    : documents;

  return (
    <div className="flex flex-col h-full">
      {/* Notifications */}
      {(error || success) && (
        <div
          className={cn(
            "mx-4 mt-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2",
            error
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          )}
        >
          {error ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">{error ?? success}</span>
        </div>
      )}

      {/* Header actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              "shrink-0 h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors",
              showUpload
                ? "bg-gray-800 text-gray-300"
                : "bg-emerald-600 hover:bg-emerald-500 text-white",
            )}
          >
            {showUpload ? (
              <>
                <X className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Upload
              </>
            )}
          </button>
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory(undefined)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                !activeCategory
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-gray-200",
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? undefined : cat)
                }
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="mx-4 mb-4 border border-gray-800 rounded-xl bg-gray-900/50 p-4">
          <form onSubmit={(e) => void handleUpload(e)} className="space-y-3">
            {/* Drag & drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                dragActive
                  ? "border-emerald-500 bg-emerald-500/5"
                  : selectedFile
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-gray-700 hover:border-gray-600",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.md,.txt,.docx,.doc,.yaml,.yml,.json,.tf,.py,.sh,.js,.ts"
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-500">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-8 w-8 mx-auto text-gray-500" />
                  <p className="text-sm text-gray-400">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-gray-600">
                    PDF, Markdown, TXT, DOCX, YAML, JSON, TF, PY, SH
                  </p>
                </div>
              )}
            </div>

            {/* Metadata inputs */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g., kubernetes, ci-cd, monitoring)"
              className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="w-full px-3 py-2 rounded-lg border border-gray-800 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
                selectedFile && !isUploading
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed",
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
        {isLoadingDocs ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No documents match your search"
                : "No documents uploaded yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-gray-600 mt-1">
                Upload your first DevOps document to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="group border border-gray-800 rounded-lg p-3 hover:border-gray-700 hover:bg-gray-900/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 truncate">
                      {doc.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                        {doc.category}
                      </span>
                      <span className="text-xs text-gray-600">
                        {doc.chunk_count} chunks
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatFileSize(doc.file_size)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="shrink-0 opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete document"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
