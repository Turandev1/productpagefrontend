import axios from 'axios';

// 1. Axios Instance Yaradılması
// Vite proxy parametrlərinizlə uyğun işləməsi üçün baseURL '/api' olaraq təyin edildi.
const api = axios.create({
  // Çevre değişkenini oku, bulamazsan fallback olarak lokal `/api` kullan
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Request Interceptor (Sorğu Göndərilməzdən Əvvəl İşləyən Təbəqə)
// Hər sorğuda localStorage yoxlanılır və token varsa Header-ə avtomatik əlavə edilir.
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

// 3. Response Interceptor (Cavab Gəldikdən Sonra İşləyən Mərkəzi Xəta İdarəetməsi)
api.interceptors.response.use(
  (response) => {
    // Axios cavabı uğurludursa (2xx) birbaşa backend-dən dönən data-nı qaytarırıq.
    const data = response.data;
    
    // Backend öz içində "success: false" strukturu qurubsa bunu tutaq
    if (data && data.success === false) {
      return Promise.reject(new Error(data.message || 'Əməliyyat uğursuz oldu.'));
    }
    
    return data;
  },
  (error) => {
    // Server bir xəta kodu ilə (4xx, 5xx) cavab döndübsə və ya heç qoşulmadısa:
    if (error.response) {
      const { status, data } = error.response;

      const errorMessages = {
        400: () => {
          const baseMsg = data?.message || 'Yanlış sorğu. Zəhmət olmasa məlumatlarınızı yoxlayın.';
          return data?.errors && Array.isArray(data.errors)
            ? `${baseMsg}\n${data.errors.join('\n')}`
            : baseMsg;
        },
        401: () => data?.message || 'Yetkiləndirmə uğursuz. Zəhmət olmasa yenidən giriş edin.',
        403: () => data?.message || 'Bu əməliyyat üçün səlahiyyətiniz yoxdur.',
        404: () => {
          const pathInfo = data?.path ? ` (${error.config.method.toUpperCase()} ${data.path})` : '';
          return data?.message || `Endpoint tapılmadı${pathInfo}. Serverin işlədiyindən əmin olun.`;
        },
        409: () => data?.message || 'Bu məlumatlar artıq istifadə olunur.',
        503: () => data?.message || 'Server hazırda xidmət verə bilmir. Zəhmət olmasa daha sonra yenidən cəhd edin.',
      };

      // Status koduna görə mesajı seç, yoxdursa susmaya görə xəta mesajı
      const getMessage = errorMessages[status] || (() => data?.message || `Sorğu uğursuz oldu (${status} - ${error.response.statusText})`);
      
      // Xəta obyektini yeni mesajla əvəz edirik
      error.message = getMessage();
    } else if (error.request) {
      // Sorğu edildi amma serverdən cavab alına bilmədi (Network Error qarşılığı)
      error.message = 'Serverə qoşulmaq mümkün olmadı. Zəhmət olmasa backend serverinin işlədiyindən əmin olun.';
    } else {
      // Sorğu qurularkən bir xəta baş verdi
      error.message = error.message || 'Bir xəta baş verdi.';
    }

    return Promise.reject(error);
  }
);

// --- Auth API Sorğuları ---

/**
 * Admin Giriş Sorğusu
 * @param {string} email 
 * @param {string} password 
 */
export const login = async (email, password) => {
  // Axios-da url təmizliyinə ehtiyac qalmaz, '/api' sonrasını yazmaq yetərlidir
  return api.post('auth/login', { email, password });
};

/**
 * Yeni Admin Qeydiyyat Sorğusu
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 */
export const register = async (name, email, password) => {
  console.log('name:', name, email, password);
  return api.post('auth/register', { name, email, password });
};

/**
 * Mövcud Sessiyanı Şifrə ilə Yenidən Təsdiqləmə
 * @param {string} password - İstifadəçinin təsdiq şifrəsi
 */
export const verifySession = async (password) => {
  return api.post('auth/verify-session', { password });
};

// Gələcəkdə digər fayllar üçün ümumi HTTP metodlarını istifadə etmək istəsəniz instance-ı ixrac edə bilərsiniz
export default api;
