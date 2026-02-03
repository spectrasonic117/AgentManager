import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Search, FileText, Folder } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResourceType } from '../types';

const RESOURCE_LABELS: Record<ResourceType, string> = {
  agents: 'Agents',
  subagents: 'Subagents',
  skills: 'Skills',
  mcp_servers: 'MCP Servers',
  hooks: 'Hooks',
  system_prompts: 'System Prompts',
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  agents: 'text-cyan-400',
  subagents: 'text-indigo-400',
  skills: 'text-emerald-400',
  mcp_servers: 'text-amber-400',
  hooks: 'text-rose-400',
  system_prompts: 'text-violet-400',
};

export function Sidebar() {
  const { resources, selectedResource, searchQuery, setSearchQuery, selectResource, createResource } = useApp();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['agents', 'subagents', 'skills', 'mcp_servers', 'hooks', 'system_prompts'])
  );
  const [isCreating, setIsCreating] = useState<ResourceType | null>(null);
  const [newName, setNewName] = useState('');

  const toggleFolder = (type: ResourceType) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleCreate = (type: ResourceType) => {
    if (newName.trim()) {
      if (createResource(type, newName.trim())) {
        setNewName('');
        setIsCreating(null);
      }
    }
  };

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resourcesByType = (type: ResourceType) =>
    filteredResources.filter(r => r.type === type);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {Object.entries(RESOURCE_LABELS).map(([type, label]) => {
          const resourceType = type as ResourceType;
          const isExpanded = expandedFolders.has(resourceType);
          const items = resourcesByType(resourceType);

          return (
            <div key={type} className="mb-1">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer group">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => toggleFolder(resourceType)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <Folder className={`w-4 h-4 ${RESOURCE_COLORS[resourceType]}`} />
                  <span className="text-sm font-medium text-slate-300">{label}</span>
                  <span className="text-xs text-slate-500">({items.length})</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating(resourceType);
                    setNewName('');
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/50 rounded transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {isCreating === resourceType && (
                    <div className="px-2 py-1">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate(resourceType);
                          if (e.key === 'Escape') {
                            setIsCreating(null);
                            setNewName('');
                          }
                        }}
                        onBlur={() => {
                          if (newName.trim()) handleCreate(resourceType);
                          else setIsCreating(null);
                        }}
                        placeholder="Resource name..."
                        autoFocus
                        className="w-full px-2 py-1 bg-slate-800/50 border border-blue-500/50 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  )}

                  {items.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => selectResource(resource)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                        selectedResource?.id === resource.id
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-sm truncate">{resource.name}</span>
                    </button>
                  ))}

                  {items.length === 0 && isCreating !== resourceType && (
                    <div className="px-2 py-2 text-xs text-slate-500 italic">
                      No resources yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
