import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScoreRing } from '@/app/components/ui/score-ring';

describe('ScoreRing', () => {
  it('renders SVG with role="img"', () => {
    render(<ScoreRing score={75} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toBeInTheDocument();
  });

  it('has correct aria-label with score', () => {
    render(<ScoreRing score={85} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Match score: 85 percent');
  });

  it('aria-label shows 0 for score=0', () => {
    render(<ScoreRing score={0} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Match score: 0 percent');
  });

  it('aria-label shows 100 for score=100', () => {
    render(<ScoreRing score={100} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Match score: 100 percent');
  });

  it('strokeDashoffset is circumference*(1-0/100) = full offset at score=0', () => {
    const { container } = render(<ScoreRing score={0} size="md" />);
    const r = 38;
    const circumference = 2 * Math.PI * r;
    const progressCircle = container.querySelectorAll('circle')[1];
    const dashoffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0');
    expect(dashoffset).toBeCloseTo(circumference, 1);
  });

  it('strokeDashoffset is 0 at score=100', () => {
    const { container } = render(<ScoreRing score={100} size="md" />);
    const progressCircle = container.querySelectorAll('circle')[1];
    const dashoffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '999');
    expect(dashoffset).toBeCloseTo(0, 1);
  });

  it('strokeDashoffset is half circumference at score=50', () => {
    const { container } = render(<ScoreRing score={50} size="md" />);
    const r = 38;
    const circumference = 2 * Math.PI * r;
    const progressCircle = container.querySelectorAll('circle')[1];
    const dashoffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0');
    expect(dashoffset).toBeCloseTo(circumference * 0.5, 1);
  });

  it('uses red color for score=49 (below 50)', () => {
    const { container } = render(<ScoreRing score={49} />);
    const scoreText = container.querySelector('span[aria-hidden="true"]');
    expect(scoreText?.className).toContain('text-red-400');
  });

  it('uses yellow color for score=50', () => {
    const { container } = render(<ScoreRing score={50} />);
    const scoreText = container.querySelector('span[aria-hidden="true"]');
    expect(scoreText?.className).toContain('text-yellow-400');
  });

  it('uses green color for score=75', () => {
    const { container } = render(<ScoreRing score={75} />);
    const scoreText = container.querySelector('span[aria-hidden="true"]');
    expect(scoreText?.className).toContain('text-green-400');
  });

  it('clamps score below 0 to 0', () => {
    render(<ScoreRing score={-10} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Match score: 0 percent');
  });

  it('clamps score above 100 to 100', () => {
    render(<ScoreRing score={150} />);
    const svg = document.querySelector('svg[role="img"]');
    expect(svg).toHaveAttribute('aria-label', 'Match score: 100 percent');
  });

  it('renders sm size with smaller SVG', () => {
    const { container } = render(<ScoreRing score={60} size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '80');
    expect(svg).toHaveAttribute('height', '80');
  });

  it('renders lg size with larger SVG', () => {
    const { container } = render(<ScoreRing score={60} size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('applies custom className', () => {
    const { container } = render(<ScoreRing score={60} className="my-custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });
});
