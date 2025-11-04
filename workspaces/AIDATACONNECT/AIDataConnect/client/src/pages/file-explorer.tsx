import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/file-upload";
import { FilePreview } from "@/components/file-preview";
import { FileFilterBar, FileFilters } from "@/components/file-filter-bar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Loader2, 
  FileX, 
  ChevronUp, 
  ChevronDown, 
  Grid, 
  List, 
  SlidersHorizontal,
  FileIcon,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

export default function FileExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [queryResults, setQueryResults] = useState<number[]>([]);
  const [filters, setFilters] = useState<FileFilters>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const { toast } = useToast();
  
  const filesQuery = useQuery<File[]>({
    queryKey: ["/api/files"]
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search", { data: { query } });
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResults(data.map((result: any) => result.id));
      if (data.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term"
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Extract unique categories and file types for filter options
  const categories = useMemo(() => {
    if (!filesQuery.data) return [];
    const allCategories = filesQuery.data
      .map(file => file.category)
      .filter(Boolean) as string[];
    return Array.from(new Set(allCategories));
  }, [filesQuery.data]);

  const fileTypes = useMemo(() => {
    if (!filesQuery.data) return [];
    const allTypes = filesQuery.data.map(file => file.type);
    return Array.from(new Set(allTypes));
  }, [filesQuery.data]);

  // Filter files based on search results and filter criteria
  const filteredFiles = useMemo(() => {
    let results = filesQuery.data || [];
    
    // Apply search query filter
    if (searchQuery && queryResults.length > 0) {
      results = results.filter(file => queryResults.includes(file.id));
    }
    
    // Apply additional filters
    if (filters.type) {
      results = results.filter(file => file.type === filters.type);
    }
    
    if (filters.category) {
      results = results.filter(file => file.category === filters.category);
    }
    
    if (filters.sizeRange) {
      results = results.filter(file => {
        const size = file.size;
        switch (filters.sizeRange) {
          case 'small':
            return size < 1024 * 1024; // Less than 1MB
          case 'medium':
            return size >= 1024 * 1024 && size < 10 * 1024 * 1024; // 1-10MB
          case 'large':
            return size >= 10 * 1024 * 1024 && size < 100 * 1024 * 1024; // 10-100MB
          case 'xlarge':
            return size >= 100 * 1024 * 1024; // More than 100MB
          default:
            return true;
        }
      });
    }
    
    if (filters.dateFrom || filters.dateTo) {
      results = results.filter(file => {
        if (!file.createdAt) return false;
        
        const createdDate = new Date(file.createdAt);
        
        if (filters.dateFrom && createdDate < filters.dateFrom) {
          return false;
        }
        
        if (filters.dateTo) {
          // Set time to end of day for the "to" date
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          if (createdDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Apply sorting
    return results.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'size_asc':
          return a.size - b.size;
        case 'size_desc':
          return b.size - a.size;
        default:
          return 0;
      }
    });
  }, [filesQuery.data, searchQuery, queryResults, filters, sortBy]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setQueryResults([]);
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (newFilters: FileFilters) => {
    setFilters(newFilters);
  };

  const toggleFilterBar = () => {
    setShowFilterBar(!showFilterBar);
  };

  const renderFileGrid = () => {
    if (filesQuery.isLoading) {
      return Array(6).fill(0).map((_, index) => (
        <div key={index} className="rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      ));
    }

    if (filesQuery.error) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Error loading files</h3>
          <p className="text-muted-foreground">
            There was a problem loading your files. Please try again.
          </p>
        </div>
      );
    }

    if (!filteredFiles?.length) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No files found</h3>
          <p className="text-muted-foreground">
            {(searchQuery || Object.keys(filters).length > 0) 
              ? "No files match your search criteria" 
              : "Upload files to get started"}
          </p>
        </div>
      );
    }

    return filteredFiles.map((file) => (
      <FilePreview key={file.id} file={file} />
    ));
  };
  
  // Render files in a list view with more metadata columns
  const renderFileList = () => {
    if (filesQuery.isLoading) {
      return Array(5).fill(0).map((_, index) => (
        <div key={index} className="flex items-center p-3 border-b">
          <Skeleton className="h-8 w-8 rounded mr-3" />
          <div className="flex-1 flex gap-4">
            <Skeleton className="h-4 w-[30%]" />
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-4 w-[15%]" />
            <Skeleton className="h-4 w-[20%]" />
          </div>
        </div>
      ));
    }

    if (filesQuery.error) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Error loading files</h3>
          <p className="text-muted-foreground">
            There was a problem loading your files. Please try again.
          </p>
        </div>
      );
    }

    if (!filteredFiles?.length) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
          <FileX className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No files found</h3>
          <p className="text-muted-foreground">
            {(searchQuery || Object.keys(filters).length > 0) 
              ? "No files match your search criteria" 
              : "Upload files to get started"}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted/50 p-3 grid grid-cols-12 text-sm font-medium">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {filteredFiles.map((file) => (
            <div key={file.id} className="p-3 grid grid-cols-12 items-center hover:bg-muted/20">
              <div className="col-span-5 flex items-center gap-2 truncate">
                {file.type.includes('image') ? (
                  <img 
                    src={`/uploads/${file.path}`} 
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
              <div className="col-span-2">
                <span className="px-2 py-1 rounded-full bg-muted/20 text-xs">
                  {file.type}
                </span>
              </div>
              <div className="col-span-2 text-muted-foreground text-sm">
                {formatBytes(file.size)}
              </div>
              <div className="col-span-2 text-muted-foreground text-sm">
                {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="col-span-1 text-right">
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Format bytes utility function from FilePreview component
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">File Explorer</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : "Search"}
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <FileUpload />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFilterBar}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilterBar ? "Hide Filters" : "Show Filters"}
            {showFilterBar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {filteredFiles?.length || 0} files found
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="size_asc">Size (Smallest)</SelectItem>
              <SelectItem value="size_desc">Size (Largest)</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs defaultValue="grid" className="w-[100px]">
            <TabsList>
              <TabsTrigger 
                value="grid" 
                onClick={() => setViewMode("grid")}
                className="w-10 h-10 p-0"
              >
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                onClick={() => setViewMode("list")}
                className="w-10 h-10 p-0"
              >
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {showFilterBar && (
        <FileFilterBar 
          onFilterChange={handleFilterChange} 
          categories={categories} 
          fileTypes={fileTypes} 
        />
      )}

      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderFileGrid()}
        </div>
      ) : (
        <div className="w-full">
          {renderFileList()}
        </div>
      )}
    </div>
  );
}
