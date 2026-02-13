import React from 'react';

export default function StatisticsTable({ data, columns }) {
  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/40 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-medium border-b border-slate-800">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">No data available</div>
      )}
    </div>
  );
}