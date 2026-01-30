import { useAxiomFsStore } from '../../fs/store/axiomFsStore';

export const AxiomFSToolbar = () => {
  const { searchQuery, setSearchQuery } = useAxiomFsStore();

  return (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-10 w-96 max-w-full px-4'>
      <div className='relative group'>
        {/* Glass Container */}
        <div className='absolute inset-0 bg-[var(--tf-void-black)]/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg transition-all duration-300 group-focus-within:border-[var(--tf-transcend-highlight)]/50 group-focus-within:shadow-[var(--tf-transcend-highlight)]/20' />

        {/* Search Input */}
        <div className='relative flex items-center px-4 h-10'>
          <svg
            className='w-4 h-4 text-white/50 mr-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
          <input
            type='text'
            placeholder='Search sovereign data...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full bg-transparent border-none text-white placeholder-white/40 focus:outline-none text-sm'
            aria-label='Filter Files'
            data-testid='axiomfs-search-input'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='ml-2 text-white/50 hover:text-white transition-colors'
              aria-label='Clear search'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
