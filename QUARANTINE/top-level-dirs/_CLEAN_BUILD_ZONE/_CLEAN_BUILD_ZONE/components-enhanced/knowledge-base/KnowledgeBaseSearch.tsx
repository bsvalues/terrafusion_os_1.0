import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Autocomplete,
  InputAdornment,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Article as ArticleIcon,
  Build as BuildIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon
} from '@mui/icons-material';

interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory: string;
  tags: string[];
  type: 'workflow' | 'troubleshooting' | 'best-practice' | 'api-doc' | 'tutorial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  author: string;
  rating: number;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedItems: string[];
}

interface SearchFilters {
  categories: string[];
  types: string[];
  difficulty: string[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const KnowledgeBaseSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeBaseItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    types: [],
    difficulty: [],
    tags: [],
    dateRange: { start: null, end: null }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeBaseItem | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);

  // Mock knowledge base data
  const knowledgeBaseItems: KnowledgeBaseItem[] = [
    {
      id: 'kb-001',
      title: 'Property Assessment Workflow Template',
      content: 'Comprehensive workflow for conducting property assessments using Terrafusion OS with Harris PACS integration...',
      category: 'Workflows',
      subcategory: 'Property Management',
      tags: ['property-assessment', 'harris-pacs', 'workflow', 'government'],
      type: 'workflow',
      difficulty: 'intermediate',
      lastUpdated: new Date('2024-08-18'),
      author: 'Terrafusion Team',
      rating: 4.8,
      views: 1250,
      helpful: 95,
      notHelpful: 5,
      relatedItems: ['kb-002', 'kb-003']
    },
    {
      id: 'kb-002',
      title: 'Tax Collection Workflow Template',
      content: 'Comprehensive workflow for property tax collection and management using Terrafusion OS with Harris PACS integration and AI-powered revenue optimization...',
      category: 'Workflows',
      subcategory: 'Revenue Management',
      tags: ['tax-collection', 'revenue-optimization', 'swarm-intelligence', 'harris-pacs'],
      type: 'workflow',
      difficulty: 'advanced',
      lastUpdated: new Date('2024-08-18'),
      author: 'Terrafusion Team',
      rating: 4.9,
      views: 980,
      helpful: 87,
      notHelpful: 3,
      relatedItems: ['kb-001', 'kb-004']
    },
    {
      id: 'kb-003',
      title: 'Harris PACS Integration Troubleshooting',
      content: 'Comprehensive troubleshooting guide for Harris PACS integration with Terrafusion OS, covering common issues, diagnostic procedures, and resolution strategies...',
      category: 'Troubleshooting',
      subcategory: 'System Integration',
      tags: ['harris-pacs', 'troubleshooting', 'integration', 'diagnostics'],
      type: 'troubleshooting',
      difficulty: 'advanced',
      lastUpdated: new Date('2024-08-18'),
      author: 'Terrafusion Team',
      rating: 4.7,
      views: 2100,
      helpful: 156,
      notHelpful: 12,
      relatedItems: ['kb-001', 'kb-005']
    },
    {
      id: 'kb-004',
      title: 'Government AI Operations Best Practices',
      content: 'Comprehensive best practices guide for operating AI systems in government environments, ensuring compliance, security, and optimal performance...',
      category: 'Best Practices',
      subcategory: 'AI Operations',
      tags: ['ai-operations', 'government', 'compliance', 'best-practices'],
      type: 'best-practice',
      difficulty: 'intermediate',
      lastUpdated: new Date('2024-08-18'),
      author: 'Terrafusion Team',
      rating: 4.6,
      views: 750,
      helpful: 68,
      notHelpful: 7,
      relatedItems: ['kb-005', 'kb-006']
    },
    {
      id: 'kb-005',
      title: 'System Performance Issues Troubleshooting',
      content: 'Comprehensive guide for diagnosing and resolving Terrafusion OS performance issues, including AI system optimization, database performance, and infrastructure scaling...',
      category: 'Troubleshooting',
      subcategory: 'Performance',
      tags: ['performance', 'troubleshooting', 'optimization', 'ai-systems'],
      type: 'troubleshooting',
      difficulty: 'advanced',
      lastUpdated: new Date('2024-08-18'),
      author: 'Terrafusion Team',
      rating: 4.5,
      views: 1800,
      helpful: 142,
      notHelpful: 18,
      relatedItems: ['kb-003', 'kb-004']
    }
  ];

  const categories = ['Workflows', 'Troubleshooting', 'Best Practices', 'API Documentation', 'Tutorials'];
  const types = ['workflow', 'troubleshooting', 'best-practice', 'api-doc', 'tutorial'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const allTags = Array.from(new Set(knowledgeBaseItems.flatMap(item => item.tags)));

  // Search functionality
  const performSearch = async (query: string, searchFilters: SearchFilters) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = knowledgeBaseItems;
    
    // Filter by search query
    if (query.trim()) {
      results = results.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.content.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply filters
    if (searchFilters.categories.length > 0) {
      results = results.filter(item => searchFilters.categories.includes(item.category));
    }
    
    if (searchFilters.types.length > 0) {
      results = results.filter(item => searchFilters.types.includes(item.type));
    }
    
    if (searchFilters.difficulty.length > 0) {
      results = results.filter(item => searchFilters.difficulty.includes(item.difficulty));
    }
    
    if (searchFilters.tags.length > 0) {
      results = results.filter(item =>
        searchFilters.tags.some(tag => item.tags.includes(tag))
      );
    }
    
    // Sort by relevance (rating and views)
    results.sort((a, b) => {
      const scoreA = a.rating * 0.7 + (a.views / 1000) * 0.3;
      const scoreB = b.rating * 0.7 + (b.views / 1000) * 0.3;
      return scoreB - scoreA;
    });
    
    setSearchResults(results);
    setIsLoading(false);
    
    // Add to search history
    if (query.trim() && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
  };

  useEffect(() => {
    performSearch(searchQuery, filters);
  }, [searchQuery, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return <AssessmentIcon />;
      case 'troubleshooting':
        return <BuildIcon />;
      case 'best-practice':
        return <SecurityIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleItemClick = (item: KnowledgeBaseItem) => {
    setSelectedItem(item);
    // Increment view count (in real implementation, this would be an API call)
    item.views += 1;
  };

  const handleBookmark = (itemId: string) => {
    setBookmarkedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleFeedback = (itemId: string, helpful: boolean) => {
    const item = knowledgeBaseItems.find(item => item.id === itemId);
    if (item) {
      if (helpful) {
        item.helpful += 1;
      } else {
        item.notHelpful += 1;
      }
      // In real implementation, this would be an API call
    }
  };

  return (
    <Box sx={{ p: 3 }}><>

      <Typography variant="h4" gutterBottom>
        Terrafusion OS Knowledge Base
      </Typography>
      
      <Typography
</>
variant="subtitle1" color="text.secondary" gutterBottom>
        Search workflows, troubleshooting guides, best practices, and documentation
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Box sx={{ mb: 2 }}><>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Recent searches:
          </Typography>
          <Box
</>
sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {searchHistory.slice(0, 5).map((query /* , index */) => (
              <Chip
                key={index}
                label={query}
                size="small"
                onClick={() => handleSearch(query)}
                icon={<HistoryIcon />}
              />
            ))}
          </Box>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              
              {/* Category Filter */}
              <Autocomplete
                multiple
                options={categories}
                value={filters.categories}
                onChange={(_, value) => handleFilterChange('categories', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Categories" margin="normal" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option /* , index */) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />

              {/* Type Filter */}
              <Autocomplete
                multiple
                options={types}
                value={filters.types}
                onChange={(_, value) => handleFilterChange('types', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Content Type" margin="normal" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option /* , index */) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />

              {/* Difficulty Filter */}
              <Autocomplete
                multiple
                options={difficulties}
                value={filters.difficulty}
                onChange={(_, value) => handleFilterChange('difficulty', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Difficulty" margin="normal" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option /* , index */) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      color={getDifficultyColor(option) as any}
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />

              {/* Tags Filter */}
              <Autocomplete
                multiple
                options={allTags}
                value={filters.tags}
                onChange={(_, value) => handleFilterChange('tags', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" margin="normal" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option /* , index */) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      key={index}
                    />
                  ))
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Search Results */}
        <Grid item xs={12} md={9}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {searchResults.length} results found
            </Typography>
          </Box>

          {isLoading ? (
            <Typography>Searching...</Typography>
          ) : (
            <List>
              {searchResults.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}><>

                      <Box sx={{ color: 'primary.main' }}>
                        {getTypeIcon(item.type)}
                      </Box>
                      
                      <Box
</>
sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><>

                          <Typography
                            variant="h6"
                            component="button"
                            onClick={() => handleItemClick(item)}
                            sx={{
                              cursor: 'pointer',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {item.title}
                          </Typography>
                          
                          <Chip
</>

                            label={item.difficulty}
                            size="small"
                            color={getDifficultyColor(item.difficulty) as any}
                          />
                        </Box>

                        <Breadcrumbs sx={{ mb: 1 }}><>

                          <Typography variant="body2" color="text.secondary">
                            {item.category}
                          </Typography>
                          <Typography
</>
variant="body2" color="text.secondary">
                            {item.subcategory}
                          </Typography>
                        </Breadcrumbs><>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {item.content.substring(0, 200)}...
                        </Typography>

                        <Box
</>
sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {item.tags.map((tag) => (<>

                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              onClick={() => handleFilterChange('tags', [...filters.tags, tag])}
                            />
                          ))}
                        </Box>

                        <Box
</>
sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Rating value={item.rating} precision={0.1} readOnly size="small" /><>

                            <Typography variant="body2" color="text.secondary">
                              {item.views} views
                            </Typography>
                            <Typography
</>
variant="body2" color="text.secondary">
                              Updated {item.lastUpdated.toLocaleDateString()}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleBookmark(item.id)}
                              color={bookmarkedItems.includes(item.id) ? 'primary' : 'default'}
                            ><>

                              <BookmarkIcon />
                            </IconButton>
                            <IconButton
</>
size="small">
                              <ShareIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Grid>
      </Grid>

      {/* Item Detail Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedItem && (
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getTypeIcon(selectedItem.type)}
                {selectedItem.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Breadcrumbs><>

                  <Typography variant="body2">
                    {selectedItem.category}
                  </Typography>
                  <Typography
</>
variant="body2">
                    {selectedItem.subcategory}
                  </Typography>
                </Breadcrumbs>
              </Box><>

              <Typography variant="body1" paragraph>
                {selectedItem.content}
              </Typography>

              <Box
</>
sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {selectedItem.tags.map((tag) => (<>

                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>

              <Divider
</>
sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box><>

                  <Typography variant="body2" color="text.secondary">
                    By {selectedItem.author} • Updated {selectedItem.lastUpdated.toLocaleDateString()}
                  </Typography>
                  <Rating
</>
value={selectedItem.rating} precision={0.1} readOnly size="small" />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}><>

                  <Button
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleFeedback(selectedItem.id, true)}
                    size="small"
                  >
                    Helpful ({selectedItem.helpful})
                  </Button>
                  <Button
</>

                    startIcon={<ThumbDownIcon />}
                    onClick={() => handleFeedback(selectedItem.id, false)}
                    size="small"
                  >
                    Not Helpful ({selectedItem.notHelpful})
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions><>

              <Button onClick={() => setSelectedItem(null)}>Close</Button>
              <Button
</>
variant="contained" onClick={() => {
                // In real implementation, this would navigate to the full article
                window.open(`/docs/knowledge-base/${selectedItem.id}`, '_blank');
              }}>
                View Full Article
              </Button>
            </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default KnowledgeBaseSearch;
