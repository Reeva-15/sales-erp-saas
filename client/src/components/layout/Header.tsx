import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Building2, ChevronRight, X, Users, Package, FileText, ShoppingCart, Receipt } from 'lucide-react';
import { ApiService } from '../../services/api';

interface HeaderProps {
  user: any;
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ user, collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const getBreadcrumb = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'Home';
    return parts
      .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))
      .join(' / ');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform backend search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await ApiService.get(`/app/global-search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults =
    results &&
    ((results.customers && results.customers.length > 0) ||
      (results.products && results.products.length > 0) ||
      (results.quotations && results.quotations.length > 0) ||
      (results.salesOrders && results.salesOrders.length > 0) ||
      (results.invoices && results.invoices.length > 0) ||
      (results.tenants && results.tenants.length > 0));

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-warm-200 transition-all duration-300 flex items-center justify-between px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
        <span className="text-marron-800 font-semibold">MARRONEX</span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-gray-700">{getBreadcrumb()}</span>
      </div>

      {/* Right: Search + Notifications + Context */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Search"
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-warm-50 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-marron-800/20 focus:border-marron-800 transition"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Search Dropdown Popup */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-11 bg-white rounded-2xl shadow-2xl border border-warm-200 max-h-96 overflow-y-auto z-50 p-2 text-xs divide-y divide-warm-100">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-marron-800 border-r-transparent mr-2" />
                  Searching...
                </div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-gray-400 font-medium">
                  No matching records found for "{query}".
                </div>
              ) : (
                <>
                  {/* Customers */}
                  {results.customers && results.customers.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Users className="h-3 w-3" /> Customers
                      </div>
                      {results.customers.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectResult('/app/customers')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-semibold text-gray-800">{c.customerName}</span>
                          <span className="font-mono text-[10px] text-gray-400 bg-warm-100 px-1 rounded">{c.customerCode}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {results.products && results.products.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Package className="h-3 w-3" /> Products
                      </div>
                      {results.products.map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectResult('/app/products')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-semibold text-gray-800">{p.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 bg-warm-100 px-1 rounded">₹{p.sellingPrice}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quotations */}
                  {results.quotations && results.quotations.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <FileText className="h-3 w-3" /> Quotations
                      </div>
                      {results.quotations.map((q: any) => (
                        <div
                          key={q.id}
                          onClick={() => handleSelectResult('/app/quotations')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold text-marron-800">{q.quotationNumber}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">₹{q.grandTotal}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sales Orders */}
                  {results.salesOrders && results.salesOrders.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <ShoppingCart className="h-3 w-3" /> Sales Orders
                      </div>
                      {results.salesOrders.map((so: any) => (
                        <div
                          key={so.id}
                          onClick={() => handleSelectResult('/app/sales-orders')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold text-marron-800">{so.orderNumber}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">₹{so.grandTotal}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Invoices */}
                  {results.invoices && results.invoices.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Receipt className="h-3 w-3" /> Tax Invoices
                      </div>
                      {results.invoices.map((inv: any) => (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectResult('/app/invoices')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold text-marron-800">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-emerald-700 font-bold">₹{inv.grandTotal}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tenants / Clients (SaaS Main Admin) */}
                  {results.tenants && results.tenants.length > 0 && (
                    <div className="py-2">
                      <div className="px-2 mb-1 font-bold text-marron-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <Building2 className="h-3 w-3" /> Client Tenants
                      </div>
                      {results.tenants.map((t: any) => (
                        <div
                          key={t.id}
                          onClick={() => handleSelectResult('/admin/clients')}
                          className="px-2 py-1.5 hover:bg-marron-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold text-gray-800">{t.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 bg-warm-100 px-1 rounded">{t.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-500 hover:text-marron-800 hover:bg-warm-100 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-marron-600 ring-2 ring-white" />
        </button>

        {/* Company / Role Context Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warm-100/80 border border-warm-200 text-xs">
          <Building2 className="h-3.5 w-3.5 text-marron-700" />
          <span className="font-semibold text-gray-700">{user?.tenantName || 'System Admin'}</span>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-warm-200">
          <div className="w-8 h-8 rounded-full bg-marron-800 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
