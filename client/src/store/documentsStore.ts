import { create } from "zustand";
import { Document } from "../types/document";

interface DocumentsState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  setDocuments: (documents: Document[]) => void;
  setSelectedDocument: (document: Document | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
  removeDocument: (documentId: string) => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  documents: [],
  selectedDocument: null,
  isLoading: false,
  error: null,
  setDocuments: (documents) => set({ documents }),
  setSelectedDocument: (document) => set({ selectedDocument: document }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addDocument: (document) =>
    set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (document) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === document.id ? document : d
      ),
    })),
  removeDocument: (documentId) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== documentId),
    })),
}));
