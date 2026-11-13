import type { ComponentProps } from 'react';
import { Tag } from '../tag';

type CellTag = Pick<ComponentProps<typeof Tag>, 'label' | 'variant' | 'ring'>;

export type TableCell = { tag?: CellTag; text?: string; note?: string; strong?: boolean };
export type TableColumn = { label: string; width?: string };
export type TableRow = { cells: TableCell[] };

type TableProps = { caption?: string; columns: TableColumn[]; rows: TableRow[] };

const HEAD_CLASSES = 'px-2.5 py-2 text-left text-caption font-semibold text-fg-muted';
const CELL_CLASSES = 'px-2.5 py-2 align-middle font-normal';

// The widths are CSS lengths, so a column without one takes what is left.
function CellContent({ tag, text, note, strong }: TableCell) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      {tag ? <Tag size="md" {...tag} /> : null}
      {text ? <span className={strong ? 'font-semibold' : 'whitespace-nowrap'}>{text}</span> : null}
      {note ? <span className="text-caption text-fg-muted">{note}</span> : null}
    </div>
  );
}

// The first cell of each row names the row, so it is its row header.
export function Table({ caption, columns, rows }: TableProps) {
  return (
    <table aria-label={caption} className="w-full table-fixed border-collapse text-body text-fg">
      <colgroup>
        {columns.map(({ label, width }) => (
          <col key={label} style={{ width }} />
        ))}
      </colgroup>
      <thead>
        <tr className="border-b border-line-strong">
          {columns.map(({ label }) => (
            <th key={label} scope="col" className={HEAD_CLASSES}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-line">
            {row.cells.map((cell, cellIndex) =>
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row" className={CELL_CLASSES}>
                  <CellContent {...cell} />
                </th>
              ) : (
                <td key={cellIndex} className={CELL_CLASSES}>
                  <CellContent {...cell} />
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
