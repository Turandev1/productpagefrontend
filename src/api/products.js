// Base URL — Vite proxy üzerinden backend'e yönlendirme
// Geliştirmede Vite proxy (vite.config.js) /api'yi localhost:5000'e yönlendirir
// Production'da backend aynı domain üzerinden servis edilmelidir
const API_BASE = "/api";

// 2. Güvenli URL oluşturucu (Modern URL API'si kullanımı)
const apiUrl = (path) => {
  // Eğer path '/' ile başlamıyorsa başına ekler, çift '/' oluşmasını da engeller
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
};

async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    // 400 — Validasyon hataları
    if (response.status === 400) {
      const message = data.message || "Geçersiz istek. Lütfen bilgilerinizi kontrol edin.";
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(`${message}\n${data.errors.join("\n")}`);
      }
      throw new Error(message);
    }

    // 401 — Yetkilendirme hatası
    if (response.status === 401) {
      throw new Error(data.message || "Yetkilendirme başarısız. Lütfen tekrar giriş yapın.");
    }

    // 404 — Bulunamadı
    if (response.status === 404) {
      const pathInfo = data.path ? ` (${data.method} ${data.path})` : "";
      throw new Error(data.message || `Endpoint bulunamadı${pathInfo}. Sunucunun çalıştığından emin olun.`);
    }

    // 409 — Çakışma
    if (response.status === 409) {
      throw new Error(data.message || "Bu bilgiler zaten kullanılıyor.");
    }

    // 503 — Servis kullanılamıyor
    if (response.status === 503) {
      throw new Error(data.message || "Sunucu şu anda hizmet veremiyor. Lütfen daha sonra tekrar deneyin.");
    }

    throw new Error(data.message || `İstek başarısız (${response.status} - ${response.statusText})`);
  }

  // Backend'den başarılı HTTP koduyla gelen hataları da yakala
  if (data.success === false) {
    throw new Error(data.message || "İşlem başarısız oldu.");
  }

  return data;
}

async function handleFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("Sunucuya bağlanılamadı. Lütfen backend sunucusunun çalıştığından emin olun.", { cause: err });
    }
    throw err;
  }
}

// --- API İstek Fonksiyonları ---

export const getProducts = async (page = 1, limit = 20, search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search.trim()) {
    params.append('search', search.trim());
  }
  return handleFetch(`${apiUrl("/products")}?${params}`);
};

export const getProductById = async (id) => {
  return handleFetch(apiUrl(`/products/${id}`)); // Gereksiz şablon string (`${}`) kaldırıldı
};

export const createProduct = async (formData, token) => {
  return handleFetch(apiUrl("/products"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
};

export const updateProduct = async (id, formData, token) => {
  return handleFetch(apiUrl(`/products/${id}`), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
};

export const deleteProduct = async (id, token) => {
  return handleFetch(apiUrl(`/products/${id}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
