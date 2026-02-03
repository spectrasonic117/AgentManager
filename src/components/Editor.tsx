import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Save, Eye, Edit3, Copy, Trash2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Editor() {
  const { selectedResource, isEditorMode, setIsEditorMode, updateResource, deleteResource, showNotification } = useApp();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedResource) {
      setName(selectedResource.name);
      setContent(selectedResource.content);
      setHasChanges(false);
    }
  }, [selectedResource]);

  const handleSave = async () => {
    if (selectedResource && hasChanges) {
      if (await updateResource(selectedResource.id, { name, content })) {
        setHasChanges(false);
      }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showNotification('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (selectedResource && confirm(`Are you sure you want to delete "${selectedResource.name}"?`)) {
      await deleteResource(selectedResource.id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedResource, name, content, hasChanges]);

  if (!selectedResource) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/30 backdrop-blur-xl">
        <div className="text-center">
          <FileIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No resource selected</h3>
          <p className="text-sm text-slate-500">Select a resource from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/30 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setHasChanges(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            placeholder="Resource Name"
            className="w-full text-xl font-semibold bg-transparent text-slate-200 focus:outline-none placeholder-slate-600 border-b border-transparent focus:border-blue-500/50 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            Last updated: {selectedResource.updatedAt.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors group relative"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setIsEditorMode(true)}
              className={`p-2 rounded transition-colors ${
                isEditorMode
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Edit mode"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditorMode(false)}
              className={`p-2 rounded transition-colors ${
                !isEditorMode
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Preview mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
            title="Delete resource"
          >
            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isEditorMode ? (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setHasChanges(true);
            }}
            className="w-full h-full px-6 py-4 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none"
            placeholder="Start writing..."
          />
        ) : (
          <div className="h-full overflow-y-auto px-6 py-4">
            <article className="prose prose-invert prose-slate max-w-none prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}
