import { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { createProduct } from '../api/products'

export default function ProductForm({ token, onProductCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
    const maxSize = 10 * 1024 * 1024 // 10 MB

    const validFiles = []
    const validPreviews = []

    for (const file of files) {
      // Dosya tipi kontrolü
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" desteklenmiyor. Sadece JPEG, PNG, WebP ve AVIF formatları kabul edilir`)
        continue
      }

      // Dosya boyutu kontrolü
      if (file.size > maxSize) {
        toast.error(`"${file.name}" çok büyük (max 10MB)`)
        continue
      }

      validFiles.push(file)
      validPreviews.push(URL.createObjectURL(file))
    }

    if (validFiles.length === 0) return

    setImageFiles(prev => [...prev, ...validFiles])
    setImagePreviews(prev => [...prev, ...validPreviews])

    // Input'u temizle (aynı dosyayı tekrar seçebilmek için)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !description.trim()) {
      toast.error('Ürün adı ve açıklaması zorunludur')
      return
    }

    if (imageFiles.length === 0) {
      toast.error('En az bir ürün görseli zorunludur')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('description', description.trim())
      formData.append('phoneNumber', phoneNumber.trim())

      // Tüm görselleri FormData'ya ekle
      imageFiles.forEach((file) => {
        formData.append('images', file)
      })

      await createProduct(formData, token)

      toast.success('Ürün başarıyla eklendi!')
      setName('')
      setDescription('')
      setPhoneNumber('')

      // Preview URL'lerini temizle
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setImageFiles([])
      setImagePreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ''

      if (onProductCreated) onProductCreated()
    } catch (err) {
      toast.error(err.message || 'Ürün eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Yeni Ürün Ekle</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Ürün Adı */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Adı
          </label>
          <input
            id="productName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
            placeholder="Ürün adını girin"
            maxLength={200}
          />
        </div>

        {/* Telefon Numarası */}
        <div>
          <label htmlFor="productPhone" className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Numarası <span className="text-xs text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <input
            id="productPhone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
            placeholder="+905551234567"
          />
          <p className="mt-1 text-xs text-gray-400">Uluslararası format ile girin (örn: +905551234567)</p>
        </div>

        {/* Açıklama */}
        <div>
          <label htmlFor="productDesc" className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            id="productDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-gray-50 focus:bg-white resize-vertical"
            placeholder="Ürün açıklamasını girin"
            maxLength={5000}
          />
          <p className="mt-1 text-xs text-gray-400">{description.length}/5000 karakter</p>
        </div>

        {/* Görsel Yükleme — Çoklu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ürün Görselleri
            {imageFiles.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({imageFiles.length} seçildi)
              </span>
            )}
          </label>

          {/* Preview Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Görsel ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] text-gray-400">Ekle</span>
              </button>
            </div>
          )}

          {/* Dropzone — sadece hiç görsel yoksa göster */}
          {imagePreviews.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                Görsel seçmek için tıklayın
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP veya AVIF • Her biri max 10MB • Birden fazla seçebilirsiniz
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Yükleniyor...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Ürünü Ekle
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
