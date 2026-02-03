import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Resource, ResourceType } from '../types';

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
  createResource: (type: ResourceType, name: string) => boolean;
  updateResource: (id: string, updates: Partial<Resource>) => boolean;
  deleteResource: (id: string) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ai_agent_resources';

export function AppProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((r: Resource) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  }, [resources]);

  const selectResource = (resource: Resource | null) => {
    setSelectedResource(resource);
  };

  const createResource = (type: ResourceType, name: string): boolean => {
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
    setResources(prev => [...prev, newResource]);
    setSelectedResource(newResource);
    showNotification(`${trimmedName} created successfully`, 'success');
    return true;
  };

  const updateResource = (id: string, updates: Partial<Resource>): boolean => {
    if (updates.name) {
      const trimmedName = updates.name.trim();
      if (resources.some(r => r.id !== id && r.name.toLowerCase() === trimmedName.toLowerCase())) {
        showNotification(`A resource with the name "${trimmedName}" already exists`, 'error');
        return false;
      }
      updates.name = trimmedName;
    }

    setResources(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date() }
          : r
      )
    );
    if (selectedResource?.id === id) {
      setSelectedResource(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
    showNotification('Changes saved', 'success');
    return true;
  };

  const deleteResource = (id: string) => {
    setResources(prev => prev.filter(r => r.id !== id));
    if (selectedResource?.id === id) {
      setSelectedResource(null);
    }
    showNotification('Resource deleted', 'info');
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
        showNotification,
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
