import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import LoginForm from '../components/LoginForm'
import ProductForm from '../components/ProductForm'
import SessionPasswordForm from '../components/SessionPasswordForm'
import PasswordChangeForm from '../components/PasswordChangeForm'
import { getProducts, deleteProduct, updateProduct } from '../api/products'

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const [sessionVerified, setSessionVerified] = useState(
    () => sessionStorage.getItem('adminSessionVerified') === 'true'
  )
  // ejorghj
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editFiles, setEditFiles] = useState([])
  const [editSaving, setEditSaving] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  const fetchProducts = async () => {
    try {
      const data = await getProducts(1, 50)
      setProducts(data.products)
    } catch (err) {
      toast.error('Məhsullar yüklənə bilmədi: ' + err.message)
    }
  }

  useEffect(() => {
    if (!token || !sessionVerified) return

    let cancelled = false
    const load = async () => {
      try {
        const data = await getProducts(1, 50)
        if (!cancelled) setProducts(data.products)
      } catch (err) {
        if (!cancelled) toast.error('Məhsullar yüklənə bilmədi: ' + err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [token, sessionVerified])

  const handleLoginSuccess = (newToken) => {
    setToken(newToken)
    setSessionVerified(true)
    localStorage.setItem('adminToken', newToken)
    sessionStorage.setItem('adminSessionVerified', 'true')
    toast.success('Giriş uğurlu, admin panelinə yönləndirilirsiniz.')
  }

  const handleSessionVerified = () => {
    setSessionVerified(true)
  }

  const handleLogout = () => {
    setToken('')
    setSessionVerified(false)
    localStorage.removeItem('adminToken')
    sessionStorage.removeItem('adminSessionVerified')
    setProducts([])
    toast.info('Çıxış edildi')
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" məhsulunu silmək istədiyinizə əminsiniz?`)) return

    try {
      await deleteProduct(id, token)
      toast.success(`"${name}" uğurla silindi`)
      fetchProducts()
    } catch (err) {
      // Token xətası halında sessiyanı təmizlə
      if (err.message.includes('token') || err.message.includes('Yetkiləndirmə')) {
        handleLogout()
        return
      }
      toast.error(`Silmə xətası: ${err.message}`)
    }
  }

  const handleEditStart = (product) => {
    setEditingProduct(product)
    setEditName(product.name)
    setEditDescription(product.description)
    setEditPhone(product.phoneNumber || '')
    setEditFiles([])
  }

  const handleEditCancel = () => {
    setEditingProduct(null)
    setEditName('')
    setEditDescription('')
    setEditPhone('')
    setEditFiles([])
  }

  const handleEditSave = async () => {
    if (!editName.trim() || !editDescription.trim()) {
      toast.error('Məhsul adı və açıqlaması məcburidir')
      return
    }

    try {
      setEditSaving(true)
      const formData = new FormData()
      formData.append('name', editName.trim())
      formData.append('description', editDescription.trim())
      formData.append('phoneNumber', editPhone.trim())
      editFiles.forEach((file) => formData.append('images', file))

      await updateProduct(editingProduct._id, formData, token)
      toast.success('Məhsul uğurla yeniləndi!')
      handleEditCancel()
      fetchProducts()
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('Yetkiləndirmə')) {
        handleLogout()
        return
      }
      toast.error('Yeniləmə xətası: ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  // Giriş edilməmişsə login formu göstər
  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // Token var amma sessiya təsdiqlənməmişsə şifrə formu göstər
  if (!sessionVerified) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SessionPasswordForm
          token={token}
          onSessionVerified={handleSessionVerified}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Paneli</h1>
          <p className="text-sm text-gray-500 mt-1">Məhsulları idarə edin və yeni məhsullar əlavə edin</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          >
            Saytı Göstər
          </Link>
          <button
            onClick={() => setShowPasswordChange((prev) => !prev)}
            className="px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200 cursor-pointer"
          >
            {showPasswordChange ? 'Ləğv Et' : 'Şifrəni Dəyiş'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-red-600 transition-all duration-200 cursor-pointer"
          >
            Çıxış Et
          </button>
        </div>
      </div>
      {/* mehsul hissesi - yalnız şifrə dəyişmə aktiv deyilsə göstər */}
      {!showPasswordChange && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sol: Məhsul Əlavəetmə Formu */}
          <div className="lg:col-span-1">
            <ProductForm token={token} onProductCreated={fetchProducts} />
          </div>

          {/* Sağ: Məhsul Siyahısı */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Mövcud Məhsullar
                {!loading && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({products.length})
                  </span>
                )}
              </h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">Hələ məhsul əlavə edilməmişdir</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    >
                      <img
                        src={product.images?.[0]?.url || product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {product.description?.substring(0, 60)}...
                        </p>
                        {product.images?.length > 1 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {product.images.length} şəkil
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          to={`/product/${product._id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                          Göstər
                        </Link>
                        <button
                          onClick={() => handleEditStart(product)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Redaktə Et"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Şifrə Dəyişmə Bölməsi - yalnız aktivdirsə göstər */}
      {showPasswordChange && (
        <div>
          <PasswordChangeForm
            onPasswordChanged={() => setShowPasswordChange(false)}
          />
        </div>
      )}

      {/* Redaktə Modalı */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Məhsulu Redaktə Et</h2>
              <button
                onClick={handleEditCancel}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Məhsul Adı</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Nömrəsi <span className="text-xs text-gray-400 font-normal">(istəyə bağlı)</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="+905551234567"
                />
                <p className="mt-1 text-xs text-gray-400">Beynəlxalq format ilə daxil edin (örn: +905551234567)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıqlama</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white resize-vertical"
                  maxLength={5000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şəkillər (istəyə bağlı)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => setEditFiles(Array.from(e.target.files))}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {editFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">{editFiles.length} yeni şəkil seçildi</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditCancel}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {editSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Yadda saxlanılır...
                    </span>
                  ) : (
                    'Yadda Saxla'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
