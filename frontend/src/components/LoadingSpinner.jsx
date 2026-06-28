import React from 'react'

const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }

  const currentSize = sizes[size] || sizes.md

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${currentSize} animate-spin rounded-full border-[#7c3aed]/20 border-t-[#7c3aed]`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}

export default LoadingSpinner
