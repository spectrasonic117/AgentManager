import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Resource, ResourceType } from '../types';
import { supabase } from '../lib/supabase';

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
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load resources from Supabase
  useEffect(() => {
    async function loadResources() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) {
        console.error('Error loading resources:', error);
        showNotification('Error loading data from cloud', 'error');
        // Fallback to local storage if needed
        const stored = localStorage.getItem('ai_agent_resources');
        if (stored) setResources(JSON.parse(stored));
      } else if (data) {
        const parsedData = data.map(r => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        setResources(parsedData);
      }
      setIsLoading(false);
    }

    loadResources();
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

    const newResource = {
      id: crypto.randomUUID(),
      name: trimmedName,
      content: `# ${trimmedName}\n\nStart writing your ${type.replace('_', ' ')} configuration here...`,
      type,
      folderPath: type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('resources').insert([newResource]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      showNotification('Error saving to cloud', 'error');
      return false;
    }

    const resourceWithDates = {
      ...newResource,
      createdAt: new Date(newResource.createdAt),
      updatedAt: new Date(newResource.updatedAt)
    };

    setResources(prev => [resourceWithDates, ...prev]);
    setSelectedResource(resourceWithDates);
    showNotification(`${trimmedName} created successfully`, 'success');
    return true;
  };

  const updateResource = async (id: string, updates: Partial<Resource>): Promise<boolean> => {
    const dbUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('resources')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Supabase Update Error:', error);
      showNotification('Error updating cloud data', 'error');
      return false;
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

  const deleteResource = async (id: string) => {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase Delete Error:', error);
      showNotification('Error deleting from cloud', 'error');
      return;
    }

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
