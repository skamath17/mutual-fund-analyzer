// src/components/layout/Header.tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            FundsWatch
          </Link>

          <nav className="flex gap-4">
            <Link href="/create-basket">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Create Fund Basket
              </button>
            </Link>
            <Link href="/compare-funds">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Compare Funds
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-4">About FundsWatch</h3>
            <p className="text-gray-600">
              Your comprehensive mutual fund analysis and comparison platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/create-basket"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Create Fund Basket
                </Link>
              </li>
              <li>
                <Link
                  href="/compare-funds"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Compare Funds
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">Contact</h3>
            <p className="text-gray-600">
              Have questions? Reach out to us at support@fundswatch.com
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} FundsWatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
