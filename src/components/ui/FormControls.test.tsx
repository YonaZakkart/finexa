import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';
import { Select } from './Select';
import { Textarea } from './Textarea';

describe('form controls', () => {
  it('associates the input label and error', () => {
    render(<Input label="Monto" error="El monto debe ser mayor que cero" />);

    const input = screen.getByLabelText('Monto');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('El monto debe ser mayor que cero');
    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
  });

  it('associates select and textarea labels', () => {
    render(
      <>
        <Select label="Categoría" defaultValue="food">
          <option value="food">Comida</option>
        </Select>
        <Textarea label="Nota" />
      </>
    );

    expect(screen.getByLabelText('Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Nota')).toBeInTheDocument();
  });
});
