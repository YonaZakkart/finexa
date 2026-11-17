import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders its title and content and can be closed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Detalle" description="Descripción">
        <p>Contenido</p>
      </Modal>
    );

    expect(screen.getByRole('dialog', { name: 'Detalle' })).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ConfirmDialog', () => {
  it('runs confirm and cancel actions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="¿Pagar deuda?"
        description="Esta acción actualizará el balance."
        confirmLabel="Pagar"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Pagar' }));
    expect(onConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
