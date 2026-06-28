import React, { useState } from 'react'
import { RiStarFill, RiStarLine } from 'react-icons/ri'

const RatingStars = ({ contentId, onRate, currentRating }) => {
  const [rating, setRating] = useState(currentRating || 0)
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async (star) => {
    setRating(star)
    setSubmitting(true)
    try {
      await onRate(star)
    } catch (err) {
      // Revert if error occurs
      setRating(currentRating || 0)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-0.5 select-none">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => handleRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          disabled={submitting}
          className="p-0.5 text-sm transition-colors hover:scale-110 cursor-pointer disabled:opacity-50"
        >
          {star <= (hover || rating) ? (
            <RiStarFill className="text-yellow-400 text-sm" />
          ) : (
            <RiStarLine className="text-slate-600 text-sm hover:text-yellow-400" />
          )}
        </button>
      ))}
    </div>
  )
}

export default RatingStars
