// Tangkap error React yang gak ketangkep, biar app gak blank putih total.
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Tetap dicatat ke console supaya kelihatan di DevTools (F12) - detail
    // stack trace penting buat diagnosis, tidak semuanya perlu ditampilkan
    // ke user biasa di layar.
    console.error('NOKA crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 text-2xl flex items-center justify-center mx-auto mb-5">⚠️</div>
            <h1 className="text-lg font-bold mb-2">Ada yang salah</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Halaman ini mengalami error dan tidak bisa ditampilkan.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono break-words bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              {this.state.error?.message || 'Error tidak diketahui'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full px-6 py-2.5 text-sm transition"
            >
              Muat ulang halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
