import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { MobileMenu } from './components/MobileMenu';
import { Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useApp } from './context/AppContext';

function App() {
  const { isSidebarOpen, setIsSidebarOpen } = useApp();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hidden md:block"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI Agent Manager
              </h1>
              <p className="text-xs text-slate-500">Centralized resource management</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <span className="text-xs text-slate-400">Press ⌘S to save</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <MobileMenu />

        <div 
          className={`flex-shrink-0 hidden md:block transition-all duration-300 ease-in-out border-r border-slate-700/50 ${
            isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-80 h-full overflow-hidden">
            <Sidebar />
          </div>
        </div>

        <div className="flex-1">
          <Editor />
        </div>
      </div>
    </div>
  );
}

export default App;
