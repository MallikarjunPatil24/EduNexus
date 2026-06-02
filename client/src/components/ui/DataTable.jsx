import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ headers, data = [], searchPlaceholder = 'Search...', searchKey = 'name', itemsPerPage = 8 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    const valueToSearch = item[searchKey];
    if (valueToSearch === undefined || valueToSearch === null) return false;
    return String(valueToSearch).toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination math
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-4 bg-cream/30 border-b border-gold/10 flex items-center">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-navy/40">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="w-full pl-10 pr-4 py-2 border border-gold/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold bg-cream/20 text-navy"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-cream uppercase text-xs tracking-wider">
              {headers.map((h, index) => (
                <th key={index} className="px-6 py-4 font-semibold">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/10 text-navy">
            {currentItems.length > 0 ? (
              currentItems.map((item, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-cream/40 transition-colors">
                  {headers.map((h, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm font-medium">
                      {h.render ? h.render(item) : item[h.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-navy/55 text-sm">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-cream/30 border-t border-gold/10 flex items-center justify-between">
          <span className="text-xs text-navy/60 font-medium">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-gold/20 rounded hover:bg-cream/50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1 text-xs rounded border ${
                  currentPage === p
                    ? 'bg-navy border-navy text-cream'
                    : 'border-gold/20 hover:bg-cream/50'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gold/20 rounded hover:bg-cream/50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
