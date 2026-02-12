
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchCriteria } from "./PropertySearch";
import { Bookmark, Play, Trash2, X  } from '@mui/icons-material';

interface SavedSearch {
  id: string;
  name: string;
  criteria: SearchCriteria;
  createdAt: string;
}

interface SavedSearchesProps {
  onSearchLoad: (criteria: SearchCriteria) => void;
  onClose: () => void;
}

export function SavedSearches({ onSearchLoad, onClose }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    const searches = JSON.parse(localStorage.getItem('terraFusionSavedSearches') || '[]');
    setSavedSearches(searches);
  }, []);

  const deleteSavedSearch = (id: string) => {
    const updatedSearches = savedSearches.filter(search => search.id !== id);
    setSavedSearches(updatedSearches);
    localStorage.setItem('terraFusionSavedSearches', JSON.stringify(updatedSearches));
  };

  const loadSearch = (criteria: SearchCriteria) => {
    onSearchLoad(criteria);
    onClose();
  };

  const formatCriteria = (criteria: SearchCriteria) => {
    const filters = [];
    if (criteria.address) filters.push(`Address: ${criteria.address}`);
    if (criteria.propertyType) filters.push(`Type: ${criteria.propertyType}`);
    if (criteria.minValue || criteria.maxValue) {
      const min = criteria.minValue ? `$${criteria.minValue.toLocaleString()}` : '0';
      const max = criteria.maxValue ? `$${criteria.maxValue.toLocaleString()}` : '∞';
      filters.push(`Value: ${min} - ${max}`);
    }
    if (criteria.yearBuiltMin || criteria.yearBuiltMax) {
      const min = criteria.yearBuiltMin || '—';
      const max = criteria.yearBuiltMax || 'present';
      filters.push(`Built: ${min} - ${max}`);
    }
    return filters.slice(0, 3); // Show first 3 filters
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center"><>

            <Bookmark className="w-5 h-5 mr-2 text-cyan-400" />
            Saved Searches
          </CardTitle>
          <Button
</>
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" /><>

            <p className="text-slate-400">No saved searches yet</p>
            <p
</> className="text-slate-500 text-sm">Save your frequently used searches for quick access</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedSearches.map((search) => (
              <div key={search.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1"><>

                    <h3 className="text-white font-medium mb-2">{search.name}</h3>
                    <div
</> className="flex flex-wrap gap-1 mb-2">
                      {formatCriteria(search.criteria).map((filter /* , index */) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs border-white/20 text-slate-300"
                        >
                          {filter}
                        </Badge>
                      ))}
                      {Object.keys(search.criteria).length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-white/20 text-slate-400"
                        >
                          +{Object.keys(search.criteria).length - 3} more
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">
                      Created: {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSearch(search.criteria)}
                      className="border-white/20 text-white hover:bg-white/10"
                    ><>

                      <Play className="w-3 h-3 mr-1" />
                      Load
                    </Button>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSavedSearch(search.id)}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
