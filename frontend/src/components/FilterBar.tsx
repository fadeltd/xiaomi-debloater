interface FilterBarProps {
  searchText: string
  activeCategory: string
  onSearchChange: (text: string) => void
  onCategoryChange: (category: string) => void
}

const CATEGORIES = ['All', 'Bloatware', 'OEM', 'System', 'User', 'Disabled', 'Removed']

function FilterBar({ searchText, activeCategory, onSearchChange, onCategoryChange }: FilterBarProps) {
  return (
    <div className="space-y-2">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search packages..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
      />

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FilterBar
