
import React from 'react';
import { LibraryBook } from '../types';
import { Book, Search, Bot, Database } from 'lucide-react';

interface LibraryViewProps {
    books?: LibraryBook[];
}

const LibraryView: React.FC<LibraryViewProps> = ({ books = [] }) => {
  if (books.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[600px] glass-panel rounded-2xl border border-white/10 text-center">
              <Database size={64} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white font-sci-fi">ARCHIVES EMPTY</h3>
              <p className="text-slate-400 font-mono text-sm mt-2 max-w-md">The Neural Library has no indexed volumes. Import your catalog via the Nexus Data Bridge.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white font-sci-fi text-glow">NEURAL LIBRARY</h2>
          <p className="text-cyan-400/70 font-mono text-xs mt-1">AI CURATED KNOWLEDGE BASE</p>
        </div>
        
        <div className="relative">
            <input 
                type="text" 
                placeholder="SEARCH CATALOG..." 
                className="bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-64 font-mono"
            />
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
            <div key={book.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-1 group">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded shadow-lg flex items-center justify-center border border-white/10 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-shadow">
                        <Book size={20} className="text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        book.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                        {book.status}
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-white font-sci-fi leading-tight mb-1">{book.title}</h3>
                <p className="text-xs text-slate-400 font-mono mb-4">by {book.author}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 font-mono">{book.category}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryView;
