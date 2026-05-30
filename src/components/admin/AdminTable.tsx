import type { ReactNode } from "react";

export function AdminTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-black/20">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/78">
        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.22em] text-white/42">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-4 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
