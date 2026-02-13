import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-lg text-sm font-bold ring-offset-[#0F1419] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 glow-hover',
	{
		variants: {
			variant: {
				default: 'bg-[#00D9FF] text-[#0F1419] hover:bg-[#00B8E0] shadow-glow-cyan',
				destructive: 'bg-[#FF3B30] text-white hover:bg-[#E6342B] shadow-glow-orange',
				outline: 'border-2 border-custom bg-transparent hover:bg-[#1A1F26] text-white',
				secondary: 'bg-[#9D4EDD] text-white hover:bg-[#8B3FCC] shadow-glow-purple',
				ghost: 'hover:bg-[#1A1F26] text-white',
				link: 'text-[#00D9FF] underline-offset-4 hover:underline',
        success: 'bg-[#00FF41] text-[#0F1419] hover:bg-[#00E039] shadow-glow-green',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-lg px-3',
				lg: 'h-12 rounded-lg px-8 text-base',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };