import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Brand } from './Brand';

describe('Brand', () => {
  it('renders the logo and wordmark when expanded', () => {
    const { container } = render(<Brand />);

    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByAltText('Finexa')).toBeInTheDocument();
  });

  it('renders only the logo when collapsed', () => {
    const { container } = render(<Brand collapsed />);

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(screen.getByAltText('Finexa')).toBeInTheDocument();
  });
});
