import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Resource, ResourceType } from '../types';

const STORAGE_KEY = 'ai_agent_resources';

interface AppContextType {
  resources: Resource[];
  selectedResource: Resource | null;
  searchQuery: string;
  isEditorMode: boolean;
  isSidebarOpen: boolean;
  setSearchQuery: (query: string) => void;
  setIsEditorMode: (mode: boolean) => void;
  setIsSidebarOpen: (open: boolean) => void;
  selectResource: (resource: Resource | null) => void;
  createResource: (type: ResourceType, name: string) => Promise<boolean>;
  updateResource: (id: string, updates: Partial<Resource>) => Promise<boolean>;
  deleteResource: (id: string) => Promise<void>;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage(): Resource[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    }
  } catch (e) {
    console.error('Failed to load resources:', e);
  }
  return [];
}

function saveToStorage(resources: Resource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  } catch (e) {
    console.error('Failed to save resources:', e);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = loadFromStorage();
    setResources(stored);
    setIsLoading(false);
  }, []);

  const selectResource = (resource: Resource | null) => {
    setSelectedResource(resource);
  };

  const createResource = async (type: ResourceType, name: string): Promise<boolean> => {
    const trimmedName = name.trim();
    if (resources.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      showNotification(`A resource with the name "${trimmedName}" already exists`, 'error');
      return false;
    }

    const newResource: Resource = {
      id: crypto.randomUUID(),
      name: trimmedName,
      content: `# ${trimmedName}\n\nStart writing your ${type.replace('_', ' ')} configuration here...`,
      type,
      folderPath: type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [newResource, ...resources];
    setResources(updated);
    setSelectedResource(newResource);
    saveToStorage(updated);
    showNotification(`${trimmedName} created successfully`, 'success');
    return true;
  };

  const updateResource = async (id: string, updates: Partial<Resource>): Promise<boolean> => {
    setResources(prev => {
      const updated = prev.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      );
      saveToStorage(updated);
      return updated;
    });

    if (selectedResource?.id === id) {
      setSelectedResource(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }

    showNotification('Changes saved', 'success');
    return true;
  };

  const deleteResource = async (id: string) => {
    setResources(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveToStorage(updated);
      return updated;
    });
    if (selectedResource?.id === id) {
      setSelectedResource(null);
    }
    showNotification('Resource deleted', 'info');
  };

  const exportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      resources: resources.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-agent-manager-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully', 'success');
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.resources || !Array.isArray(data.resources)) {
        showNotification('Invalid file format: missing resources array', 'error');
        return;
      }

      const imported: Resource[] = data.resources.map((r: any) => ({
        id: r.id || crypto.randomUUID(),
        name: r.name,
        content: r.content || '',
        type: r.type,
        folderPath: r.folderPath || r.type,
        createdAt: new Date(r.createdAt || Date.now()),
        updatedAt: new Date(r.updatedAt || Date.now()),
      }));

      setResources(imported);
      setSelectedResource(null);
      saveToStorage(imported);
      showNotification(`Imported ${imported.length} resources successfully`, 'success');
    } catch (e) {
      showNotification('Error importing file. Make sure it\'s a valid JSON export.', 'error');
      console.error('Import error:', e);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <AppContext.Provider
      value={{
        resources,
        selectedResource,
        searchQuery,
        isEditorMode,
        isSidebarOpen,
        setSearchQuery,
        setIsEditorMode,
        setIsSidebarOpen,
        selectResource,
        createResource,
        updateResource,
        deleteResource,
        exportData,
        importData,
        showNotification,
        isLoading,
      }}
    >
      {children}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-xl backdrop-blur-xl shadow-2xl border ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100'
              : notification.type === 'error'
              ? 'bg-red-500/20 border-red-400/30 text-red-100'
              : 'bg-blue-500/20 border-blue-400/30 text-blue-100'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
