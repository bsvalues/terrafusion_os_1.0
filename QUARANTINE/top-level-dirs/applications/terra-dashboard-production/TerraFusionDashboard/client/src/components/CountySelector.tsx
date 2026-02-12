import { useState } from 'react';
import { useCounty } from '@/hooks/useCounty';
import { ChevronDown, MapPin, Phone, Mail, Globe  } from '@mui/icons-material';

export function CountySelector() {
  const { currentCounty, availableCounties, switchCounty, isLoading } = useCounty();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentCounty) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--county-primary)] hover:bg-[var(--county-secondary)] text-white rounded-lg transition-colors border border-[var(--county-accent)]/20"
        disabled={isLoading}
      >
        <MapPin className="w-4 h-4 text-[var(--county-accent)]" />
<>
        <span className="font-medium">{currentCounty.name}</span>
        <span
</> className="text-gray-300 text-sm">{currentCounty.state}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-[var(--county-primary)] border border-[var(--county-accent)]/20 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-[var(--county-accent)]/20">
<>
            <h3 className="text-white font-semibold mb-2">Select County</h3>
            <p
</> className="text-gray-300 text-sm">Switch to a different county assessment office</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {availableCounties.map((county) => (
              <button
                key={county.id}
                onClick={() => {
                  switchCounty(county.id);
                  setIsOpen(false);
                }}
                className={`w-full p-4 text-left hover:bg-[var(--county-secondary)] transition-colors border-b border-[var(--county-accent)]/10 last:border-b-0 ${
                  currentCounty.id === county.id ? 'bg-[var(--county-accent)]/10' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-[var(--county-accent)]" />
<>
                      <span className="text-white font-medium">{county.name}</span>
                      <span
</> className="text-gray-300 text-sm">{county.state}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{county.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span>{county.contact.email}</span>
                      </div>
                      {county.contact.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span className="text-[var(--county-accent)]">Visit Website</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {currentCounty.id === county.id && (
                    <div className="w-2 h-2 bg-[var(--county-accent)] rounded-full mt-1"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-[var(--county-accent)]/20">
            <p className="text-xs text-gray-400">
              County configurations are automatically loaded and cached for optimal performance.
            </p>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export function CountyInfo() {
  const { currentCounty } = useCounty();
  
  if (!currentCounty) return null;

  return (
    <div className="bg-[var(--county-primary)] border border-[var(--county-accent)]/20 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
<>
        <MapPin className="w-4 h-4 text-[var(--county-accent)]" />
        {currentCounty.name} Assessor's Office
      </h3>
      
      <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Phone className="w-3 h-3" />
            <span>{currentCounty.contact.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Mail className="w-3 h-3" />
            <span>{currentCounty.contact.email}</span>
          </div>
          {currentCounty.contact.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <a 
                href={currentCounty.contact.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[var(--county-accent)] hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>
        
        <div className="text-gray-300">
<>
          <div className="text-xs text-gray-400 mb-1">Office Address</div>
          <div
</>>{currentCounty.contact.address}</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--county-accent)]/20">
        <div className="flex flex-wrap gap-2">
          {Object.entries(currentCounty.features).map(([feature, enabled]) => (
            <span
              key={feature}
              className={`px-2 py-1 rounded text-xs ${
                enabled 
                  ? 'bg-[var(--county-accent)]/20 text-[var(--county-accent)]' 
                  : 'bg-gray-600 text-gray-400'
              }`}
            >
              {feature.charAt(0).toUpperCase() + feature.slice(1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}