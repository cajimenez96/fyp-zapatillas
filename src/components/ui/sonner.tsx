'use client';

import React from 'react';
import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster: React.FC<ToasterProps> = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            'group toast font-sans rounded-none border text-xs shadow-xl',
          title: 'font-extrabold uppercase tracking-wider text-xs',
          description: 'text-xs font-medium text-[#707072] mt-0.5',
          actionButton: 'bg-[#111111] text-white font-bold text-xs',
          cancelButton: 'bg-[#f5f5f5] text-[#707072] font-bold text-xs',
          closeButton: 'bg-white border-[#e5e5e5] text-[#111111] hover:bg-[#f5f5f5]',
        },
      }}
      {...props}
    />
  );
};

export { toast };
