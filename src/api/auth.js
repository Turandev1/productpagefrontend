import axios from 'axios';

// 1. Axios Instance Oluşturma
// Vite proxy ayarlarınızla uyumlu çalışması için baseURL '/api' olarak ayarlandı.
const api = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10 saniye zaman aşımı süresi
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (İstek Gönderilmeden Önce Çalışan Katman)
// Her istekte localStorage kontrol edilir ve token varsa Header'a otomatik eklenir.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (Yanıt Geldikten Sonra Çalışan Merkezi Hata Yönetimi)
api.interceptors.response.use(
  (response) => {
    // Axios yanıtı başarılıysa (2xx) doğrudan backend'den dönen data'yı dönüyoruz.
    const data = response.data;
    
    // Backend kendi içinde "success: false" yapısı kurduysa bunu yakalayalım
    if (data && data.success === false) {
      return Promise.reject(new Error(data.message || 'İşlem başarısız oldu.'));
    }
    
    return data;
  },
  (error) => {
    // Sunucu bir hata koduyla (4xx, 5xx) yanıt döndüyse veya hiç bağlanılamadıysa:
    if (error.response) {
      const { status, data } = error.response;

      const errorMessages = {
        400: () => {
          const baseMsg = data?.message || 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
          return data?.errors && Array.isArray(data.errors)
            ? `${baseMsg}\n${data.errors.join('\n')}`
            : baseMsg;
        },
        401: () => data?.message || 'Yetkilendirme başarısız. Lütfen tekrar giriş yapın.',
        403: () => data?.message || 'Bu işlem için yetkiniz bulunmuyor.',
        404: () => {
          const pathInfo = data?.path ? ` (${error.config.method.toUpperCase()} ${data.path})` : '';
          return data?.message || `Endpoint bulunamadı${pathInfo}. Sunucunun çalıştığından emin olun.`;
        },
        409: () => data?.message || 'Bu bilgiler zaten kullanılıyor.',
        503: () => data?.message || 'Sunucu şu anda hizmet veremiyor. Lütfen daha sonra tekrar deneyin.',
      };

      // Durum koduna göre mesajı seç, yoksa varsayılan hata mesajına düş
      const getMessage = errorMessages[status] || (() => data?.message || `İstek başarısız (${status} - ${error.response.statusText})`);
      
      // Hata nesnesini yeni mesajla eziyoruz
      error.message = getMessage();
    } else if (error.request) {
      // İstek yapıldı ama sunucudan yanıt alınamadı (Network Error / Failed to fetch karşılığı)
      error.message = 'Sunucuya bağlanılamadı. Lütfen backend sunucusunun çalıştığından emin olun.';
    } else {
      // İstek kurulurken bir hata oluştu
      error.message = error.message || 'Bir hata oluştu.';
    }

    return Promise.reject(error);
  }
);

// --- Auth API İstekleri ---

/**
 * Admin Giriş İsteği
 * @param {string} email 
 * @param {string} password 
 */
export const login = async (email, password) => {
  // Axios'ta url temizliğine gerek kalmaz, '/api' sonrasını yazmak yeterlidir
  return api.post('auth/login', { email, password });
};

/**
 * Yeni Admin Kayıt İsteği
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 */
export const register = async (name, email, password) => {
  console.log('name:', name, email, password);
  return api.post('auth/register', { name, email, password });
};

/**
 * Mevcut Oturumu Şifre ile Yeniden Doğrulama
 * @param {string} password - Kullanıcının teyit şifresi
 */
export const verifySession = async (password) => {
  return api.post('auth/verify-session', { password });
};

// İleride diğer dosyalar için genel HTTP metotlarını kullanmak isterseniz instance'ı dışa aktarabilirsiniz
export default api;