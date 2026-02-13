import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-lg border border-custom bg-[#1A1A1A] px-3 py-2 text-sm text-white placeholder:text-[#A0A9B8] focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-[#00D9FF] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
      className
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = 'Input';

export { Input };