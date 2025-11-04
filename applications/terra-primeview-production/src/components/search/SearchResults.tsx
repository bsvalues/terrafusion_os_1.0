
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SearchCriteria } from "./PropertySearch";
import { Building, MapPin, DollarSign, Calendar, ArrowUpDown, Eye  } from '@mui/icons-material';
import type { Tables } from "@/integrations/supabase/types";

interface SearchResultsProps {
  criteria: SearchCriteria;
  isSearching: boolean;
}

type PropertyWithRelations = Tables<"properties"> & {
  counties: {
    name: string;
    state: string;
  } | null;
  neighborhoods: {
    id: string;
    name: string;
  } | null;
  property_owners: Tables<"property_owners">[] | null;
};

export function SearchResults({ criteria, isSearching }: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("address");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["property-search", criteria, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select(`
          *,
          counties (
            name,
            state
          ),
          neighborhoods (
            id,
            name
          ),
          property_owners (
            id,
            owner_name,
            primary_owner
          )
        `)
        .eq("active", true);

      // Apply search criteria
      if (criteria.address) {
        query = query.or(`address.ilike.%${criteria.address}%,parcel_id.ilike.%${criteria.address}%`);
      }
      
      if (criteria.parcelId) {
        query = query.ilike("parcel_id", `%${criteria.parcelId}%`);
      }

      if (criteria.propertyType) {
        query = query.eq("property_type", criteria.propertyType as Tables<"properties">["property_type"]);
      }

      if (criteria.countyId) {
        query = query.eq("county_id", criteria.countyId);
      }

      if (criteria.neighborhoodId) {
        query = query.eq("neighborhood_id", criteria.neighborhoodId);
      }

      if (criteria.minValue) {
        query = query.gte("assessed_value", criteria.minValue);
      }

      if (criteria.maxValue) {
        query = query.lte("assessed_value", criteria.maxValue);
      }

      if (criteria.yearBuiltMin) {
        query = query.gte("year_built", criteria.yearBuiltMin);
      }

      if (criteria.yearBuiltMax) {
        query = query.lte("year_built", criteria.yearBuiltMax);
      }

      if (criteria.minSquareFeet) {
        query = query.gte("square_feet", criteria.minSquareFeet);
      }

      if (criteria.maxSquareFeet) {
        query = query.lte("square_feet", criteria.maxSquareFeet);
      }

      if (criteria.zoning) {
        query = query.ilike("zoning", `%${criteria.zoning}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        properties: data || [],
        totalCount: count || 0
      };
    },
    enabled: Object.keys(criteria).length > 0,
    staleTime: 30 * 1000,
  });

  const totalPages = Math.ceil((searchResults?.totalCount || 0) / pageSize);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const getStatusBadge = (property: any) => {
    const now = new Date();
    const assessmentDate = new Date(property.last_assessment_date);
    const daysSinceAssessment = Math.floor((now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceAssessment < 30) {
      return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">Current</Badge>;
    } else if (daysSinceAssessment < 365) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Good</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">Needs Update</Badge>;
    }
  };

  if (!Object.keys(criteria).length) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="text-center py-12">
          <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Enter search criteria to find properties</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || isSearching) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between"><>

          <CardTitle className="text-white">
            Search Results ({searchResults?.totalCount || 0} properties found)
          </CardTitle>
          <div
</> className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white"><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</> className="bg-slate-800 border-white/20"><>

                <SelectItem value="address" className="text-white">Address</SelectItem>
                <SelectItem
</> value="assessed_value" className="text-white">Assessed Value</SelectItem><>

                <SelectItem value="last_assessment_date" className="text-white">Assessment Date</SelectItem>
                <SelectItem
</> value="year_built" className="text-white">Year Built</SelectItem>
                <SelectItem value="square_feet" className="text-white">Square Feet</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort(sortBy)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchResults?.properties?.map((property: any) => (
          <div key={property.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-medium">{property.address}</h3>
                  {getStatusBadge(property)}
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300">
                      {property.parcel_id} • {property.property_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300">
                      {property.counties?.name || "Unknown"}, {property.counties?.state || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300">
                      {formatCurrency(property.assessed_value)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-300">
                      {property.year_built || "N/A"} • {property.square_feet ? `${property.square_feet.toLocaleString()} sq ft` : "N/A"}
                    </span>
                  </div>
                </div>

                {property.property_owners?.find((o: any) => o.primary_owner) && (
                  <p className="text-slate-400 text-sm mt-2">
                    Owner: {property.property_owners.find((o: any) => o.primary_owner)?.owner_name}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        ))}

        {searchResults?.properties?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No properties found matching your search criteria.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10"><>

            <p className="text-slate-400 text-sm">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, searchResults?.totalCount || 0)} of {searchResults?.totalCount || 0} results
            </p>
            <div
</> className="flex gap-2"><>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
</>
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
