import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getActorColor(index: number): string {
  const colors = [
    '#6366f1', // Indigo
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#06b6d4', // Cyan
  ];
  return colors[index % colors.length];
}

export function getSentimentColor(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
    case 'deescalation':
      return 'text-game-success';
    case 'negative':
    case 'escalation':
      return 'text-game-danger';
    default:
      return 'text-gray-400';
  }
}

export function getTensionColor(level: number): string {
  if (level < 30) return 'bg-green-500';
  if (level < 50) return 'bg-yellow-500';
  if (level < 70) return 'bg-orange-500';
  return 'bg-red-500';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
