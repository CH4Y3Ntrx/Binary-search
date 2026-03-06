import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RefreshCw, TreeDeciduous } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- BST Logic ---

class BSTNode {
  value: number;
  left: BSTNode | null = null;
  right: BSTNode | null = null;

  constructor(value: number) {
    this.value = value;
  }
}

function insertNode(root: BSTNode | null, value: number): BSTNode {
  if (!root) return new BSTNode(value);
  if (value < root.value) {
    root.left = insertNode(root.left, value);
  } else if (value > root.value) {
    root.right = insertNode(root.right, value);
  }
  return root;
}

function getPreorder(root: BSTNode | null, result: number[] = []): number[] {
  if (!root) return result;
  result.push(root.value);
  getPreorder(root.left, result);
  getPreorder(root.right, result);
  return result;
}

function getInorder(root: BSTNode | null, result: number[] = []): number[] {
  if (!root) return result;
  getInorder(root.left, result);
  result.push(root.value);
  getInorder(root.right, result);
  return result;
}

function getPostorder(root: BSTNode | null, result: number[] = []): number[] {
  if (!root) return result;
  getPostorder(root.left, result);
  getPostorder(root.right, result);
  result.push(root.value);
  return result;
}

// --- Components ---

const NodeVisualizer: React.FC<{ node: BSTNode | null, x: number, y: number, level: number }> = ({ node, x, y, level }) => {
  if (!node) return null;

  const horizontalSpacing = Math.max(160 / (level + 1), 30);
  const verticalSpacing = 70;

  return (
    <g>
      {/* Lines to children */}
      {node.left && (
        <line
          x1={x}
          y1={y}
          x2={x - horizontalSpacing}
          y2={y + verticalSpacing}
          stroke="#4ade80"
          strokeWidth="2"
          opacity="0.5"
        />
      )}
      {node.right && (
        <line
          x1={x}
          y1={y}
          x2={x + horizontalSpacing}
          y2={y + verticalSpacing}
          stroke="#4ade80"
          strokeWidth="2"
          opacity="0.5"
        />
      )}

      {/* Node Circle */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <circle
          cx={x}
          cy={y}
          r="20"
          fill="#1e293b"
          stroke="#4ade80"
          strokeWidth="2"
          className="drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
        />
        <text
          x={x}
          y={y}
          dy=".3em"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="12"
          fontWeight="bold"
          className="select-none"
        >
          {node.value}
        </text>
      </motion.g>

      {/* Recursive children */}
      <NodeVisualizer node={node.left} x={x - horizontalSpacing} y={y + verticalSpacing} level={level + 1} />
      <NodeVisualizer node={node.right} x={x + horizontalSpacing} y={y + verticalSpacing} level={level + 1} />
    </g>
  );
};

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [root, setRoot] = useState<BSTNode | null>(null);
  const [history, setHistory] = useState<{ id: number, numbers: string, created_at: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data and history
  const fetchData = async () => {
    try {
      const response = await fetch('/api/bst/history');
      const data = await response.json();
      setHistory(data);
      
      if (data.length > 0) {
        const latest = data[0];
        const nums = latest.numbers.split(',').map(Number).filter((n: any) => !isNaN(n));
        setNumbers(nums);
        let newRoot: BSTNode | null = null;
        nums.forEach((n: number) => {
          newRoot = insertNode(newRoot, n);
        });
        setRoot(newRoot);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save data when numbers change
  const saveToDb = async (newNumbers: number[]) => {
    setIsSaving(true);
    try {
      await fetch('/api/bst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: newNumbers.join(',') }),
      });
      // Refresh history after saving
      const response = await fetch('/api/bst/history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadFromHistory = (numbersStr: string) => {
    const nums = numbersStr.split(',').map(Number).filter(n => !isNaN(n));
    setNumbers(nums);
    let newRoot: BSTNode | null = null;
    nums.forEach(n => {
      newRoot = insertNode(newRoot, n);
    });
    setRoot(newRoot);
  };

  const handleAdd = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    if (numbers.includes(val)) {
      setInputValue('');
      return;
    }

    const newNumbers = [...numbers, val];
    setNumbers(newNumbers);
    setRoot(insertNode(root, val));
    setInputValue('');
    saveToDb(newNumbers);
  };

  const handleClear = () => {
    setNumbers([]);
    setRoot(null);
    saveToDb([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TreeDeciduous className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Binary Search Tree <span className="text-emerald-400">Visualizer</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="text-emerald-500/70">● Connected to MariaDB</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Controls</h2>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a number..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white"
              />
              <button
                onClick={handleAdd}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all border border-slate-700"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Preorder</h2>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-sm min-h-[40px] break-all">
                {getPreorder(root).join(' → ') || '-'}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Inorder</h2>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-sm min-h-[40px] break-all">
                {getInorder(root).join(' → ') || '-'}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Postorder</h2>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-sm min-h-[40px] break-all">
                {getPostorder(root).join(' → ') || '-'}
              </div>
            </div>

            {/* History Section */}
            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Recent History</h2>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item.numbers)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors group"
                  >
                    <div className="text-[10px] text-slate-500 mb-1">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs font-mono text-slate-300 truncate group-hover:text-emerald-400">
                      {item.numbers || 'Empty Tree'}
                    </div>
                  </button>
                ))}
                {history.length === 0 && (
                  <p className="text-xs text-slate-600 italic">No history yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl h-[600px] relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Tree Structure</h2>
            </div>
            
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : numbers.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                <TreeDeciduous className="w-16 h-16 opacity-20" />
                <p className="text-sm italic">The tree is empty. Add some numbers to begin.</p>
              </div>
            ) : (
              <svg className="w-full h-full cursor-grab active:cursor-grabbing" viewBox="0 0 800 600">
                <NodeVisualizer node={root} x={400} y={60} level={0} />
              </svg>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-800 mt-8 text-center text-slate-500 text-xs">
        <p>© 2024 BST Visualizer • Connected to MariaDB at 202.29.70.18</p>
      </footer>
    </div>
  );
}
