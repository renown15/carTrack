import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncidentBadge } from '@client/components/IncidentBadge.js';

describe('IncidentBadge', () => {
  it('renders description', () => {
    render(
      <IncidentBadge
        category="Accident"
        magnitude="Major"
        description="Multi-vehicle crash"
      />,
    );
    expect(screen.getByText('Multi-vehicle crash')).toBeInTheDocument();
  });

  it('renders delay in minutes when delay > 0', () => {
    render(
      <IncidentBadge
        category="Jam"
        magnitude="Moderate"
        description="Traffic jam"
        delay={300}
      />,
    );
    expect(screen.getByText('+5 min delay')).toBeInTheDocument();
  });

  it('does not render delay when delay is 0', () => {
    render(
      <IncidentBadge
        category="Fog"
        magnitude="Minor"
        description="Light fog"
        delay={0}
      />,
    );
    expect(screen.queryByText(/min delay/)).not.toBeInTheDocument();
  });

  it('does not render delay when delay is undefined', () => {
    render(
      <IncidentBadge
        category="Rain"
        magnitude="Unknown"
        description="Rain shower"
      />,
    );
    expect(screen.queryByText(/min delay/)).not.toBeInTheDocument();
  });

  it('applies major magnitude colour class', () => {
    const { container } = render(
      <IncidentBadge
        category="RoadClosed"
        magnitude="Major"
        description="Road closed"
      />,
    );
    expect(container.firstChild).toHaveClass('bg-red-100');
  });

  it('applies moderate magnitude colour class', () => {
    const { container } = render(
      <IncidentBadge
        category="Jam"
        magnitude="Moderate"
        description="Heavy traffic"
      />,
    );
    expect(container.firstChild).toHaveClass('bg-orange-100');
  });

  it('rounds delay to nearest minute', () => {
    render(
      <IncidentBadge
        category="RoadWorks"
        magnitude="Minor"
        description="Roadworks"
        delay={89}
      />,
    );
    expect(screen.getByText('+1 min delay')).toBeInTheDocument();
  });
});
