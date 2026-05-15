import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Search, FileText, Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResourceType, Folder as FolderType } from '../types';
import { Modal } from './Modal';

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
  const {
    resources, folders, selectedResource, searchQuery, setSearchQuery,
    selectResource, createResource, createFolder, updateFolder, deleteFolder,
  } = useApp();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedSubfolders, setExpandedSubfolders] = useState<Set<string>>(new Set());
  const [creatingResourceIn, setCreatingResourceIn] = useState<{ type: ResourceType; folderId: string | null } | null>(null);
  const [newName, setNewName] = useState('');

  // Create modal state
  const [creatingFolderIn, setCreatingFolderIn] = useState<{ type: ResourceType; parentId: string | null } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  // Edit modal state
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleFolder = (type: ResourceType) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleSubfolder = (folderId: string) => {
    setExpandedSubfolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!creatingResourceIn || !newName.trim()) return;
    if (await createResource(creatingResourceIn.type, newName.trim(), creatingResourceIn.folderId)) {
      setNewName('');
      setCreatingResourceIn(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!creatingFolderIn || !newFolderName.trim()) return;
    if (await createFolder(creatingFolderIn.type, newFolderName.trim(), newFolderColor, creatingFolderIn.parentId)) {
      setNewFolderName('');
      setNewFolderColor('#3b82f6');
      setCreatingFolderIn(null);
    }
  };

  const handleOpenEditModal = (folder: FolderType) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
    setDeleteConfirmId(null);
  };

  const handleSaveFolderEdit = async () => {
    if (editingFolder && editFolderName.trim()) {
      await updateFolder(editingFolder.id, { name: editFolderName.trim(), color: editFolderColor });
      setEditingFolder(null);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    await deleteFolder(id);
    setEditingFolder(null);
    setDeleteConfirmId(null);
  };

  const filteredResources = resources.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChildFolders = (parentId: string | null, type: ResourceType) =>
    folders.filter(f => f.type === type && f.parentId === parentId);

  const getResourcesInFolder = (folderId: string) =>
    filteredResources.filter(r => r.folderId === folderId);

  const getUnfolderedResources = (type: ResourceType) =>
    filteredResources.filter(r => r.type === type && r.folderId == null);

  const countAllInFolder = (folderId: string): number => {
    const directResources = getResourcesInFolder(folderId).length;
    const childFolders = folders.filter(f => f.parentId === folderId);
    const childCount = childFolders.reduce((sum, cf) => sum + countAllInFolder(cf.id), 0);
    return directResources + childCount;
  };

  const renderResourceButton = (resource: typeof resources[0]) => (
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
  );

  const renderFolder = (folder: FolderType) => {
    const isFolderExpanded = expandedSubfolders.has(folder.id);
    const childFolders = getChildFolders(folder.id, folder.type);
    const folderResources = getResourcesInFolder(folder.id);
    const totalCount = countAllInFolder(folder.id);

    return (
      <div key={folder.id}>
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer group/folder"
          onClick={() => toggleSubfolder(folder.id)}
        >
          {isFolderExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: folder.color }}
          />
          <span className="text-sm text-slate-300 flex-1 truncate">{folder.name}</span>
          <span className="text-xs text-slate-500">({totalCount})</span>
          <div className="opacity-0 group-hover/folder:opacity-100 flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreatingResourceIn({ type: folder.type, folderId: folder.id });
                setNewName('');
              }}
              className="p-1 hover:bg-slate-700/50 rounded transition-opacity"
              title="New resource"
            >
              <Plus className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCreatingFolderIn({ type: folder.type, parentId: folder.id });
                setNewFolderName('');
                setNewFolderColor('#3b82f6');
              }}
              className="p-1 hover:bg-slate-700/50 rounded transition-opacity"
              title="New subfolder"
            >
              <FolderPlus className="w-3 h-3 text-slate-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(folder);
              }}
              className="p-1 hover:bg-slate-700/50 rounded transition-opacity"
              title="Edit folder"
            >
              <Pencil className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {isFolderExpanded && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {creatingResourceIn?.folderId === folder.id && (
              <div className="px-2 py-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setCreatingResourceIn(null);
                      setNewName('');
                    }
                  }}
                  onBlur={() => {
                    if (newName.trim()) handleCreate();
                    else setCreatingResourceIn(null);
                  }}
                  placeholder="Resource name..."
                  autoFocus
                  className="w-full px-2 py-1 bg-slate-800/50 border border-blue-500/50 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            )}
            {childFolders.map(renderFolder)}
            {folderResources.map(renderResourceButton)}
            {childFolders.length === 0 && folderResources.length === 0 &&
             creatingResourceIn?.folderId !== folder.id && (
              <div className="px-2 py-1.5 text-xs text-slate-500 italic">
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
          const topFolders = getChildFolders(null, resourceType);
          const unfolderedItems = getUnfolderedResources(resourceType);
          const totalItems = filteredResources.filter(r => r.type === resourceType).length;

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
                  <span className="text-xs text-slate-500">({totalItems})</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingFolderIn({ type: resourceType, parentId: null });
                      setNewFolderName('');
                      setNewFolderColor('#3b82f6');
                    }}
                    className="p-1 hover:bg-slate-700/50 rounded transition-opacity"
                    title="New folder"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingResourceIn({ type: resourceType, folderId: null });
                      setNewName('');
                    }}
                    className="p-1 hover:bg-slate-700/50 rounded transition-opacity"
                    title="New resource"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {creatingResourceIn?.type === resourceType && creatingResourceIn.folderId === null && (
                    <div className="px-2 py-1">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate();
                          if (e.key === 'Escape') {
                            setCreatingResourceIn(null);
                            setNewName('');
                          }
                        }}
                        onBlur={() => {
                          if (newName.trim()) handleCreate();
                          else setCreatingResourceIn(null);
                        }}
                        placeholder="Resource name..."
                        autoFocus
                        className="w-full px-2 py-1 bg-slate-800/50 border border-blue-500/50 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  )}

                  {topFolders.map(renderFolder)}

                  {unfolderedItems.map(renderResourceButton)}

                  {topFolders.length === 0 && unfolderedItems.length === 0 &&
                   creatingResourceIn?.type !== resourceType && (
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

      {/* Create folder modal */}
      <Modal
        isOpen={!!creatingFolderIn}
        onClose={() => setCreatingFolderIn(null)}
        title="New Folder"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              placeholder="Folder name..."
              autoFocus
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700/50"
              />
              <span className="text-sm text-slate-400 font-mono">{newFolderColor}</span>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleCreateFolder}
              className="px-4 py-1.5 text-sm bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit folder modal */}
      <Modal
        isOpen={!!editingFolder}
        onClose={() => { setEditingFolder(null); setDeleteConfirmId(null); }}
        title={deleteConfirmId ? 'Delete Folder' : 'Edit Folder'}
        size="sm"
      >
        {deleteConfirmId ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-slate-200">"{editingFolder?.name}"</span>?
            </p>
            <p className="text-xs text-slate-400">
              Subfolders and resources inside will become unfoldered.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFolder(deleteConfirmId)}
                className="px-3 py-1.5 text-sm bg-red-500/20 text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFolderEdit(); }}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editFolderColor}
                  onChange={(e) => setEditFolderColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700/50"
                />
                <span className="text-sm text-slate-400 font-mono">{editFolderColor}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
              <button
                onClick={() => setDeleteConfirmId(editingFolder!.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Folder
              </button>
              <button
                onClick={handleSaveFolderEdit}
                className="px-4 py-1.5 text-sm bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
