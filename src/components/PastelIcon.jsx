import React from 'react';
import * as Icons from 'lucide-react';

/**
 * Reusable component to render a Lucide React icon inside a premium pastel colored soft circle.
 * Conforms to guidelines: strokeWidth 1.5px, pastel backgrounds, high-contrast readable icon color.
 */
export default function PastelIcon({
  name,
  colorType = 'default',
  size = 18,
  strokeWidth = 1.5,
  className = '',
  circleSize = 'w-8 h-8',
}) {
  const LucideIcon = Icons[name] || Icons.HelpCircle;

  // Custom premium pastel color themes
  const themes = {
    dashboard: { bg: 'bg-[#F0F4FF]', text: 'text-[#1E293B]' },
    schedule:  { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]' },
    habits:    { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]' },
    timer:     { bg: 'bg-[#EEF2FF]', text: 'text-[#4F46E5]' },
    mood:      { bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]' },
    notes:     { bg: 'bg-[#FDF2F8]', text: 'text-[#DB2777]' },
    water:     { bg: 'bg-[#F0F9FF]', text: 'text-[#0284C7]' },
    settings:  { bg: 'bg-[#F0F4FF]', text: 'text-[#1E293B]' },
    danger:    { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]' },
    success:   { bg: 'bg-[#ECFDF5]', text: 'text-[#10B981]' },
    warning:   { bg: 'bg-[#FFFBEB]', text: 'text-[#F59E0B]' },
    info:      { bg: 'bg-[#F0F9FF]', text: 'text-[#06B6D4]' },
    default:   { bg: 'bg-[#F0F4FF]', text: 'text-[#1E293B]' }
  };

  const theme = themes[colorType] || themes.default;

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${circleSize} ${theme.bg} ${theme.text} ${className}`}
    >
      <LucideIcon size={size} strokeWidth={strokeWidth} />
    </div>
  );
}
