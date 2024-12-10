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
