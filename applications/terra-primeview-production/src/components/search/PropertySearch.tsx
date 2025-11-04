
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { SavedSearches } from "./SavedSearches";
import { Search, Filter, Save, X  } from '@mui/icons-material';
import { useCounties } from "@/hooks/useCounties";

export interface SearchCriteria {
  address?: string;
  parcelId?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  assessmentStatus?: string;
  countyId?: string;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  zoning?: string;
  neighborhoodId?: string;
}

export function PropertySearch() {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { data: counties } = useCounties();

  const handleSearch = async () => {
    setIsSearching(true);
    // Update active filters for display
    const filters = Object.entries(searchCriteria)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}: ${value}`);
    setActiveFilters(filters);
    
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 1000);
  };

  const clearFilters = () => {
    setSearchCriteria({});
    setActiveFilters([]);
  };

  const removeFilter = (filterToRemove: string) => {
    const key = filterToRemove.split(":")[0];
    const newCriteria = { ...searchCriteria };
    delete newCriteria[key as keyof SearchCriteria];
    setSearchCriteria(newCriteria);
    setActiveFilters(prev => prev.filter(filter => filter !== filterToRemove));
  };

  const saveCurrentSearch = () => {
    const searchName = prompt("Enter a name for this search:");
    if (searchName && Object.keys(searchCriteria).length > 0) {
      // Save to localStorage for now
      const savedSearches = JSON.parse(localStorage.getItem('terraFusionSavedSearches') || '[]');
      savedSearches.push({
        id: Date.now().toString(),
        name: searchName,
        criteria: searchCriteria,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('terraFusionSavedSearches', JSON.stringify(savedSearches));
      alert('Search saved successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Search Bar */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Search className="w-5 h-5 mr-2 text-cyan-400" />
            Property Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1"><>

              <Label htmlFor="address" className="text-slate-300">Address or Parcel ID</Label>
              <Input
</>
                id="address"
                placeholder="Enter address or parcel ID..."
                value={searchCriteria.address || ""}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, address: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="w-48"><>

              <Label htmlFor="county" className="text-slate-300">County</Label>
              <Select
</> value={searchCriteria.countyId || "all"} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, countyId: value === "all" ? undefined : value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white"><>

                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent
</> className="bg-slate-800 border-white/20">
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties?.map((county) => (
                    <SelectItem key={county.id} value={county.id} className="text-white">
                      {county.name}, {county.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            ><>

              <Search className="w-4 h-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button
</>
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/20 text-white hover:bg-white/10"
            ><>

              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
            <Button
</>
              variant="outline"
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Saved Searches
            </Button>
            {Object.keys(searchCriteria).length > 0 && (
              <Button
                variant="outline"
                onClick={saveCurrentSearch}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-slate-300 text-sm">Active Filters:</span>
                <Button
</>
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter /* , index */) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 flex items-center gap-1"
                  >
                    {filter}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-white"
                      onClick={() => removeFilter(filter)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <SearchFilters
          criteria={searchCriteria}
          onCriteriaChange={setSearchCriteria}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Saved Searches Panel */}
      {showSavedSearches && (
        <SavedSearches
          onSearchLoad={setSearchCriteria}
          onClose={() => setShowSavedSearches(false)}
        />
      )}

      {/* Search Results */}
      <SearchResults criteria={searchCriteria} isSearching={isSearching} />
    </div>
  );
}
