import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PortfolioFilter } from '@/app/components/portfolio/portfolio-filter';

const defaultOptions = ['engineering', 'marketing', 'design'];

describe('PortfolioFilter', () => {
  describe('Rendering', () => {
    it('renders "All" option by default', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    it('renders all provided filter options', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      expect(screen.getByRole('button', { name: 'Engineering' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Design' })).toBeInTheDocument();
    });

    it('renders total of options.length + 1 buttons (including All)', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(defaultOptions.length + 1);
    });

    it('renders with empty options array — only All button', () => {
      render(<PortfolioFilter options={[]} selected="all" onChange={jest.fn()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent('All');
    });

    it('capitalises the first letter of each option label', () => {
      render(
        <PortfolioFilter options={['management']} selected="all" onChange={jest.fn()} />
      );
      expect(screen.getByRole('button', { name: 'Management' })).toBeInTheDocument();
    });
  });

  describe('Selection state', () => {
    it('sets aria-pressed="true" on selected "All" button', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed="false" on non-selected buttons', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const engButton = screen.getByRole('button', { name: 'Engineering' });
      expect(engButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('sets aria-pressed="true" on the currently selected option', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="engineering" onChange={jest.fn()} />
      );
      const engButton = screen.getByRole('button', { name: 'Engineering' });
      expect(engButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('sets aria-pressed="false" on "All" when a specific filter is selected', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="marketing" onChange={jest.fn()} />
      );
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Interaction', () => {
    it('calls onChange with "all" when All button is clicked', () => {
      const onChange = jest.fn();
      render(
        <PortfolioFilter options={defaultOptions} selected="engineering" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'All' }));
      expect(onChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange with the option value when a filter button is clicked', () => {
      const onChange = jest.fn();
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Marketing' }));
      expect(onChange).toHaveBeenCalledWith('marketing');
    });

    it('calls onChange exactly once per click', () => {
      const onChange = jest.fn();
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Design' }));
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('wraps buttons in a group with aria-label', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const group = screen.getByRole('group', { name: 'Filter by industry' });
      expect(group).toBeInTheDocument();
    });

    it('all buttons have min-h-[44px] for touch target compliance', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('min-h-[44px]');
      });
    });

    it('all buttons have focus-visible styles', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.className).toContain('focus-visible:ring-2');
      });
    });

    it('all buttons have type="button" to prevent form submission', () => {
      render(
        <PortfolioFilter options={defaultOptions} selected="all" onChange={jest.fn()} />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });
  });
});
