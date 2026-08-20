import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; defaultTitle: string }> = {
  default: {
    container: 'bg-[#f5f5f5] border-[#e5e5e5] text-[#111111]',
    icon: 'text-[#111111]',
    defaultTitle: 'Aviso',
  },
  success: {
    container: 'bg-[#007d48]/10 border-[#007d48]/30 text-[#007d48]',
    icon: 'text-[#007d48]',
    defaultTitle: 'Éxito',
  },
  destructive: {
    container: 'bg-[#d30005]/10 border-[#d30005]/30 text-[#d30005]',
    icon: 'text-[#d30005]',
    defaultTitle: 'Error',
  },
  warning: {
    container: 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#b45309]',
    icon: 'text-[#f59e0b]',
    defaultTitle: 'Advertencia',
  },
  info: {
    container: 'bg-[#2563eb]/10 border-[#2563eb]/30 text-[#1d4ed8]',
    icon: 'text-[#2563eb]',
    defaultTitle: 'Información',
  },
};

const variantIcons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  title,
  children,
  onClose,
  className = '',
  ...props
}) => {
  const Icon = variantIcons[variant];
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`relative w-full border p-4 rounded-none text-xs flex items-start gap-3 transition-all animate-in fade-in-50 duration-200 ${styles.container} ${className}`}
      {...props}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.icon}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-extrabold uppercase tracking-wide text-xs mb-0.5">
            {title}
          </h5>
        )}
        <div className="font-semibold text-xs leading-relaxed">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
          aria-label="Cerrar alerta"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
