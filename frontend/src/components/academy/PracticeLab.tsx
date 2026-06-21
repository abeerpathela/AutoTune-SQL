import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Terminal, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import type { PracticeLabSpec } from '../../types';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

type PracticeLabProps = {
  chapterTitle: string;
  practiceLab?: PracticeLabSpec | null;
};

function normalizeColumns(cols: string[]) {
  return cols.map((c) => c.toLowerCase()).sort();
}

function validateLabResult(
  result: { columns: string[]; rowCount: number },
  expected: PracticeLabSpec['expectedResult']
): boolean {
  const gotCols = normalizeColumns(result.columns);
  const expCols = normalizeColumns(expected.columns || []);

  const columnsMatch =
    expCols.length === 0 ||
    (gotCols.length === expCols.length && expCols.every((c, i) => gotCols[i] === c));

  if (!columnsMatch) return false;

  if (expected.rowCount !== undefined && expected.rowCount !== null) {
    return result.rowCount === expected.rowCount;
  }

  if (expected.minRows !== undefined) {
    return result.rowCount >= expected.minRows;
  }

  return result.rowCount >= 0;
}

export function PracticeLab({ chapterTitle, practiceLab }: PracticeLabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [sql, setSql] = useState(practiceLab?.practiceQuery ?? 'SELECT 1;');
  const [running, setRunning] = useState(false);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (practiceLab?.practiceQuery) {
      setSql(practiceLab.practiceQuery);
    }
  }, [practiceLab?.practiceQuery]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleRunQuery = useCallback(async () => {
    if (!sql.trim()) return;

    setRunning(true);
    setError(null);
    setPassed(false);

    try {
      const analysis = await api.analyzeQueryOrThrow(sql);
      const resultRows = analysis.analysis?.resultRows as
        | { columns: string[]; rows: Record<string, unknown>[]; rowCount: number }
        | undefined;

      if (!resultRows) {
        setError('Query executed but no row data was returned.');
        setColumns([]);
        setRows([]);
        return;
      }

      setColumns(resultRows.columns);
      setRows(resultRows.rows);

      if (practiceLab?.expectedResult) {
        const ok = validateLabResult(resultRows, practiceLab.expectedResult);
        setPassed(ok);
        if (ok) {
          toast.success('Practice Lab PASSED ✓');
        } else {
          toast.error('Results do not match the expected output for this chapter.');
        }
      } else {
        toast.success(`Query returned ${resultRows.rowCount} row(s).`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err as QueryAnalysisError)?.message ||
        'Query failed';
      setError(msg);
      setColumns([]);
      setRows([]);
    } finally {
      setRunning(false);
    }
  }, [sql, practiceLab]);

  return (
    <section ref={containerRef} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800/60">
        <Terminal className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-zinc-100">Practice Lab</h3>
        {passed && (
          <span className="ml-2 text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> PASSED
          </span>
        )}
        <span className="text-xs text-zinc-500 ml-auto">{chapterTitle}</span>
      </div>

      {!visible ? (
        <div className="h-64 animate-pulse bg-zinc-800/40 flex items-center justify-center">
          <span className="text-sm text-zinc-500">Scroll to load SQL editor…</span>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0">
          <div className="h-56 border-b border-zinc-800/60">
            <Suspense
              fallback={
                <div className="h-56 animate-pulse bg-zinc-800/40 flex items-center justify-center">
                  <span className="text-sm text-zinc-500">Loading editor…</span>
                </div>
              }
            >
              <MonacoEditor
                height="224px"
                language="sql"
                theme="vs-dark"
                value={sql}
                onChange={(v) => setSql(v ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                }}
              />
            </Suspense>
          </div>

          <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b border-zinc-800/60">
            <button
              onClick={handleRunQuery}
              disabled={running}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {running ? 'Running…' : 'Run Query'}
            </button>
            {practiceLab?.expectedResult && (
              <p className="text-xs text-zinc-500">
                Expected columns: {practiceLab.expectedResult.columns.join(', ')}
                {practiceLab.expectedResult.rowCount !== undefined &&
                  ` · ${practiceLab.expectedResult.rowCount} row(s)`}
              </p>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {columns.length > 0 && (
            <div className="p-6">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                Results ({rows.length} row{rows.length !== 1 ? 's' : ''})
              </p>
              <div className="overflow-auto max-h-64 rounded-xl border border-zinc-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-800/80 sticky top-0">
                    <tr>
                      {columns.map((col) => (
                        <th key={col} className="px-4 py-2.5 text-zinc-300 font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-zinc-800/80 hover:bg-zinc-800/30">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-zinc-400 whitespace-nowrap max-w-xs truncate">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}

type QueryAnalysisError = { message?: string };
