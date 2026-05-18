import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = product.images?.[0]?.url || product.imageUrl
  const imageCount = product.images?.length || 1

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100 hover:border-gray-200 cursor-pointer"
    >
      {/* Şəkil Konteyneri — sabit en-boy nisbəti */}
      <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        ) : (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        )}

        {/* Çoxlu şəkil badge */}
        {imageCount > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2.25 2.25 0 012.828 0L16 16m-2-2l1.586-1.586a2.25 2.25 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {imageCount}
          </div>
        )}
      </div>

      {/* Məhsul Məlumatları */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
          {product.description}
        </p>
      </div>
    </Link>
  )
}
