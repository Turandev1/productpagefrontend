// Base URL — Vite proxy üzərindən backend-ə yönləndirmə
// İnkişafda Vite proxy (vite.config.js) /api-ni localhost:5000-ə yönləndirir
// Production-da backend eyni domain üzərindən xidmət edilməlidir
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // URL sonundaki ve başındaki eğik çizgileri (/) güvenli birleştirme
  if (API_BASE.endsWith('/') && cleanPath.startsWith('/')) {
    return `${API_BASE}${cleanPath.substring(1)}`;
  }
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
    // 400 — Validasiya xətaları
    if (response.status === 400) {
      const message = data.message || "Yanlış sorğu. Zəhmət olmasa məlumatlarınızı yoxlayın.";
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(`${message}\n${data.errors.join("\n")}`);
      }
      throw new Error(message);
    }

    // 401 — Yetkiləndirmə xətası
    if (response.status === 401) {
      throw new Error(data.message || "Yetkiləndirmə uğursuz. Zəhmət olmasa yenidən giriş edin.");
    }

    // 404 — Tapılmadı
    if (response.status === 404) {
      const pathInfo = data.path ? ` (${data.method} ${data.path})` : "";
      throw new Error(data.message || `Endpoint tapılmadı${pathInfo}. Serverin işlədiyindən əmin olun.`);
    }

    // 409 — Çatışmazlıq
    if (response.status === 409) {
      throw new Error(data.message || "Bu məlumatlar artıq istifadə olunur.");
    }

    // 503 — Xidmət əlçatan deyil
    if (response.status === 503) {
      throw new Error(data.message || "Server hazırda xidmət verə bilmir. Zəhmət olmasa daha sonra yenidən cəhd edin.");
    }

    throw new Error(data.message || `Sorğu uğursuz oldu (${response.status} - ${response.statusText})`);
  }

  // Backend-dən uğurlu HTTP kodu ilə gələn xətaları da tut
  if (data.success === false) {
    throw new Error(data.message || "Əməliyyat uğursuz oldu.");
  }

  return data;
}

async function handleFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("Serverə qoşulmaq mümkün olmadı. Zəhmət olmasa backend serverinin işlədiyindən əmin olun.", { cause: err });
    }
    throw err;
  }
}

// --- API Sorğu Funksiyaları ---

export const getProducts = async (page = 1, limit = 20, search = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search.trim()) {
    params.append('search', search.trim());
  }
  return handleFetch(`${apiUrl("/products")}?${params}`);
};

export const getProductById = async (id) => {
  return handleFetch(apiUrl(`/products/${id}`));
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
