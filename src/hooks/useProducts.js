import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import { getProducts } from '../api/products'

export function useProducts(page = 1, limit = 20, search = '') {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProducts(page, limit, search)
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
      toast.error('Məhsullar yüklənərkən xəta baş verdi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, pagination, refetch: fetchProducts }
}
