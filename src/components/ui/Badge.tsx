type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const variantClass: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-[#FADBD8] text-[#C0392B]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  outline: 'border border-gray-300 text-gray-600',
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  )
}
