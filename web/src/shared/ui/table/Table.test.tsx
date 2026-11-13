import { render, screen, within } from '@testing-library/react';
import { expectNoAxeViolations } from '../../../../test/axe';
import { Table, type TableColumn, type TableRow } from './Table';

const COLUMNS: TableColumn[] = [
  { label: 'Código', width: '64px' },
  { label: 'Nombre' },
  { label: 'Valor', width: '84px' },
];

const ROWS: TableRow[] = [
  { cells: [{ tag: { label: 'A1' } }, { text: 'Primera fila', strong: true }, { text: '12' }] },
  {
    cells: [
      { tag: { label: 'B2', variant: 'inverse', ring: true } },
      { text: 'Segunda fila', note: 'Nota de la celda' },
      { text: '7' },
    ],
  },
];

describe('Table', () => {
  it('names the table and gives each column its header', () => {
    render(<Table caption="Tabla de ejemplo" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('table', { name: 'Tabla de ejemplo' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Código',
      'Nombre',
      'Valor',
    ]);
  });

  it('makes the first cell of each row its row header and the rest plain cells', () => {
    render(<Table columns={COLUMNS} rows={ROWS} />);
    const first = screen.getByRole('row', { name: /Primera fila/ });
    const second = screen.getByRole('row', { name: /Segunda fila/ });

    expect(within(first).getByRole('rowheader')).toHaveTextContent('A1');
    expect(within(second).getByRole('rowheader')).toHaveTextContent('B2');
    expect(within(second).getAllByRole('cell')).toHaveLength(2);
  });

  it('draws a tag with its variant and ring', () => {
    render(<Table columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByText('B2').parentElement).toHaveClass('bg-tag-inverse', 'inset-ring-2');
  });

  it('sets the column widths, and leaves the others to share the rest', () => {
    const { container } = render(<Table columns={COLUMNS} rows={ROWS} />);
    const cols = container.querySelectorAll('col');

    expect(cols[0]).toHaveStyle({ width: '64px' });
    expect(cols[1]).not.toHaveStyle({ width: '64px' });
    expect(cols[2]).toHaveStyle({ width: '84px' });
  });

  it('bolds only the strong text and shows the note under its text', () => {
    render(<Table columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByText('Primera fila')).toHaveClass('font-semibold');
    expect(screen.getByText('Segunda fila')).not.toHaveClass('font-semibold');
    expect(screen.getByText('Nota de la celda')).toBeInTheDocument();
  });

  it('shows only the header when there are no rows', () => {
    render(<Table columns={COLUMNS} rows={[]} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Table caption="Tabla de ejemplo" columns={COLUMNS} rows={ROWS} />,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
