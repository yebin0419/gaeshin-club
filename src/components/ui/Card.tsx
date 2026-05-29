interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#C0392B]/30 transition-all' : ''}
        ${className}`}
    >
      {children}
    </div>
  )
}
