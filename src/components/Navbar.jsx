import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
export default function Navbar() {
  return (
    <nav className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 shadow-lg shadow-gray-900/20 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
          >
            <span className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            Ürün Galerisi
          </Link>

          <Link
            to="/advanced/admin"
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <LogIn size={22} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
