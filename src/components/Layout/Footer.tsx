// src/components/layout/Footer.tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              About FundsWatch
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Your comprehensive mutual fund analysis and comparison platform.
              Make informed investment decisions with our advanced tools and
              insights.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/create-basket"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                >
                  Create Fund Basket
                </Link>
              </li>
              <li>
                <Link
                  href="/compare-funds"
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                >
                  Compare Funds
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <p className="text-gray-400 leading-relaxed">
              Have questions? Reach out to us at{" "}
              <a
                href="mailto:support@fundswatch.com"
                className="text-blue-400 hover:text-blue-300"
              >
                support@fundswatch.com
              </a>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
          <p>© {new Date().getFullYear()} FundsWatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
