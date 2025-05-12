import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User, Document, Summary, Audio } from "../types";
import { authService } from "../services/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: authService.isAuthenticated(),

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login(email, password);
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Login failed";
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        signup: async (username, email, password, phone) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.signup(
              username,
              email,
              password,
              phone
            );
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Signup failed";
            set({ error: message, isLoading: false });
            throw error;
          }
        },

        logout: () => {
          authService.logout();
          set({ user: null, isAuthenticated: false });
        },

        fetchUser: async () => {
          if (!authService.isAuthenticated()) {
            set({ user: null, isAuthenticated: false });
            return;
          }

          set({ isLoading: true, error: null });
          try {
            const response = await authService.getCurrentUser();
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to fetch user";
            set({ error: message, isLoading: false });
            authService.logout();
            set({ user: null, isAuthenticated: false });
          }
        },

        deleteAccount: async () => {
          set({ isLoading: true, error: null });
          try {
            await authService.deleteAccount();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to delete account";
            set({ error: message, isLoading: false });
            throw error;
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  currentSummary: Summary | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchDocuments: () => Promise<Document[]>;
  uploadDocument: (file: File) => Promise<Document>;
  fetchSummary: (documentId: string) => Promise<Summary>;
  deleteDocument: (documentId: string) => Promise<void>;
  resetState: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  devtools((set, get) => ({
    documents: [],
    currentDocument: null,
    currentSummary: null,
    isLoading: false,
    error: null,
    uploadProgress: 0,

    fetchDocuments: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data: documents } = await import("../services/documents").then(
          (module) => module.documentService.getAllDocuments()
        );

        set({ documents, isLoading: false });
        return documents;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch documents";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    uploadDocument: async (file: File) => {
      set({ isLoading: true, error: null, uploadProgress: 0 });
      try {
        const { data: document } = await import("../services/documents").then(
          (module) =>
            module.documentService.uploadDocument(file, (progress) =>
              set({ uploadProgress: progress })
            )
        );

        // Update documents list
        const documents = [...get().documents, document];
        set({
          documents,
          currentDocument: document,
          isLoading: false,
          uploadProgress: 100,
        });

        return document;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload document";
        set({ error: message, isLoading: false, uploadProgress: 0 });
        throw error;
      }
    },

    fetchSummary: async (documentId: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data: summary } = await import("../services/documents").then(
          (module) => module.documentService.getSummary(documentId)
        );

        set({ currentSummary: summary, isLoading: false });
        return summary;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch summary";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    deleteDocument: async (documentId: string) => {
      set({ isLoading: true, error: null });
      try {
        await import("../services/documents").then((module) =>
          module.documentService.deleteDocument(documentId)
        );

        // Update documents list
        const documents = get().documents.filter(
          (doc) => doc.id !== documentId
        );
        set({
          documents,
          isLoading: false,
          // Clear current document and summary if they match the deleted document
          currentDocument:
            get().currentDocument?.id === documentId
              ? null
              : get().currentDocument,
          currentSummary:
            get().currentSummary?.documentId === documentId
              ? null
              : get().currentSummary,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete document";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    resetState: () => {
      set({
        documents: [],
        currentDocument: null,
        currentSummary: null,
        isLoading: false,
        error: null,
        uploadProgress: 0,
      });
    },
  }))
);

interface AudioState {
  audioList: Audio[];
  currentAudio: Audio | null;
  isLoading: boolean;
  error: string | null;
  fetchAudioList: () => Promise<Audio[]>;
  generateAudio: (summaryId: string) => Promise<Audio>;
  fetchAudio: (audioId: string) => Promise<Audio>;
  deleteAudio: (audioId: string) => Promise<void>;
  resetState: () => void;
}

export const useAudioStore = create<AudioState>()(
  devtools((set, get) => ({
    audioList: [],
    currentAudio: null,
    isLoading: false,
    error: null,

    fetchAudioList: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data: audioList } = await import("../services/audio").then(
          (module) => module.audioService.getAllAudio()
        );

        set({ audioList, isLoading: false });
        return audioList;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch audio list";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    generateAudio: async (summaryId: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data: audio } = await import("../services/audio").then(
          (module) => module.audioService.generateAudio(summaryId)
        );

        // Update audio list
        const audioList = [...get().audioList, audio];
        set({
          audioList,
          currentAudio: audio,
          isLoading: false,
        });

        return audio;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate audio";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    fetchAudio: async (audioId: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data: audio } = await import("../services/audio").then(
          (module) => module.audioService.getAudio(audioId)
        );

        set({ currentAudio: audio, isLoading: false });
        return audio;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch audio";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    deleteAudio: async (audioId: string) => {
      set({ isLoading: true, error: null });
      try {
        await import("../services/audio").then((module) =>
          module.audioService.deleteAudio(audioId)
        );

        // Update audio list
        const audioList = get().audioList.filter(
          (audio) => audio.id !== audioId
        );
        set({
          audioList,
          isLoading: false,
          // Clear current audio if it matches the deleted audio
          currentAudio:
            get().currentAudio?.id === audioId ? null : get().currentAudio,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete audio";
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    resetState: () => {
      set({
        audioList: [],
        currentAudio: null,
        isLoading: false,
        error: null,
      });
    },
  }))
);
