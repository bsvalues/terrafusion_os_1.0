/**
 * Query Builder Component
 * Elite Power User - Visual SQL Construction
 */

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  ContentCopy,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useExecuteSqlQueryMutation, useExportQueryToExcelMutation } from '../../store/api/pacsApi';
import {
  setTables,
  addTable,
  removeTable,
  addColumn,
  addCondition,
  removeCondition,
  updateCondition,
  addAggregation,
  removeAggregation,
  updateAggregation,
  addOrderBy,
  removeOrderBy,
  updateOrderBy,
  setLimit,
} from '../../store/slices/queryBuilderSlice';
import type { RootState } from '../../store';
import type { TableSchema, ColumnSchema, QueryCondition } from '../../types/pacs';
import { generateSQL } from '../../utils/sqlGenerator';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const QueryBuilder: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const queryBuilder = useSelector((state: RootState) => state.queryBuilder);
  const [tabValue, setTabValue] = useState(0);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [executeQuery, { isLoading: isExecuting }] = useExecuteSqlQueryMutation();
  const [exportToExcel, { isLoading: isExporting }] = useExportQueryToExcelMutation();

  // Available tables schema (in production, this would come from API)
  const availableTables: TableSchema[] = [
    {
      name: 'account',
      alias: 'a',
      columns: [
        { table: 'account', name: 'acct_id', type: 'number', nullable: false },
        { table: 'account', name: 'first_name', type: 'string', nullable: true },
        { table: 'account', name: 'last_name', type: 'string', nullable: true },
        { table: 'account', name: 'file_as_name', type: 'string', nullable: true },
        { table: 'account', name: 'address_line1', type: 'string', nullable: true },
        { table: 'account', name: 'city', type: 'string', nullable: true },
        { table: 'account', name: 'state', type: 'string', nullable: true },
        { table: 'account', name: 'zip_code', type: 'string', nullable: true },
      ],
      relationships: [],
    },
    {
      name: 'property',
      alias: 'p',
      columns: [
        { table: 'property', name: 'prop_id', type: 'number', nullable: false },
        { table: 'property', name: 'prop_number', type: 'string', nullable: true },
        { table: 'property', name: 'tax_value', type: 'number', nullable: true },
        { table: 'property', name: 'assessed_value', type: 'number', nullable: true },
        { table: 'property', name: 'owner_name', type: 'string', nullable: true },
        { table: 'property', name: 'acct_id', type: 'number', nullable: true },
      ],
      relationships: [
        { fromTable: 'property', fromColumn: 'acct_id', toTable: 'account', toColumn: 'acct_id', type: 'left' },
      ],
    },
    {
      name: 'payment',
      alias: 'pay',
      columns: [
        { table: 'payment', name: 'payment_id', type: 'number', nullable: false },
        { table: 'payment', name: 'acct_id', type: 'number', nullable: true },
        { table: 'payment', name: 'amount', type: 'number', nullable: true },
        { table: 'payment', name: 'payment_date', type: 'date', nullable: true },
        { table: 'payment', name: 'payment_source_id', type: 'number', nullable: true },
      ],
      relationships: [
        { fromTable: 'payment', fromColumn: 'acct_id', toTable: 'account', toColumn: 'acct_id', type: 'left' },
      ],
    },
  ];

  React.useEffect(() => {
    dispatch(setTables(availableTables));
  }, [dispatch]);

  const handleGenerateSQL = useCallback(() => {
    const sql = generateSQL(queryBuilder);
    setGeneratedSQL(sql);
  }, [queryBuilder]);

  const handleExecuteQuery = async () => {
    try {
      const sql = generatedSQL || generateSQL(queryBuilder);
      const result = await executeQuery({ query: sql }).unwrap();
      setQueryResults(result.resultRows || []);
      setColumns(result.columnNames || []);
      setTabValue(2); // Switch to Results tab
    } catch (error) {
      console.error('Query execution error:', error);
      // In production, show error toast
    }
  };

  const handleExportToExcel = async () => {
    try {
      const sql = generatedSQL || generateSQL(queryBuilder);
      await exportToExcel({
        query: sql,
        filePath: `query_export_${Date.now()}.xlsx`,
        sheetName: 'Query Results',
      }).unwrap();
      // In production, show success toast
    } catch (error) {
      console.error('Export error:', error);
      // In production, show error toast
    }
  };

  const handleAddTable = (tableName: string) => {
    dispatch(addTable(tableName));
  };

  const handleRemoveTable = (tableName: string) => {
    dispatch(removeTable(tableName));
  };

  const handleAddColumn = (column: ColumnSchema) => {
    dispatch(addColumn(column));
  };

  // Column removal is handled by clicking chips in the UI - no separate handler needed

  const handleAddCondition = () => {
    dispatch(
      addCondition({
        column: '',
        operator: '=',
        value: '',
        logicalOperator: 'AND',
      })
    );
  };

  const handleUpdateCondition = (index: number, condition: QueryCondition) => {
    dispatch(updateCondition({ index, condition }));
  };

  const handleRemoveCondition = (index: number) => {
    dispatch(removeCondition(index));
  };

  const handleAddAggregation = () => {
    dispatch(
      addAggregation({
        column: '',
        function: 'SUM',
        alias: '',
        groupBy: false,
      })
    );
  };

  const handleRemoveAggregation = (index: number) => {
    dispatch(removeAggregation(index));
  };

  const handleAddOrderBy = () => {
    dispatch(
      addOrderBy({
        column: '',
        direction: 'ASC',
      })
    );
  };

  const handleRemoveOrderBy = (index: number) => {
    dispatch(removeOrderBy(index));
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Query Builder
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PlayIcon />}
            onClick={handleGenerateSQL}
            disabled={queryBuilder.selectedTables.length === 0}
          >
            Generate SQL
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleExecuteQuery}
            disabled={!generatedSQL || isExecuting}
          >
            Execute Query
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => {
              // Save query to saved queries
            }}
          >
            Save Query
          </Button>
          {generatedSQL && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportToExcel} disabled={isExporting}>
              Export Excel
            </Button>
          )}
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Tables & Columns" />
        <Tab label="Conditions & Filters" />
        <Tab label="Aggregations & Sorting" />
        <Tab label="SQL Preview" />
        <Tab label="Results" disabled={queryResults.length === 0} />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Tables
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {availableTables.map((table) => (
                  <Chip
                    key={table.name}
                    label={table.name}
                    onClick={() => handleAddTable(table.name)}
                    color={queryBuilder.selectedTables.includes(table.name) ? 'primary' : 'default'}
                    variant={queryBuilder.selectedTables.includes(table.name) ? 'filled' : 'outlined'}
                    onDelete={
                      queryBuilder.selectedTables.includes(table.name)
                        ? () => handleRemoveTable(table.name)
                        : undefined
                    }
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Selected Columns
              </Typography>
              {queryBuilder.selectedTables.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Select tables first to see available columns
                </Typography>
              ) : (
                <Box>
                  {queryBuilder.selectedTables.map((tableName) => {
                    const table = availableTables.find((t) => t.name === tableName);
                    if (!table) return null;
                    return (
                      <Accordion key={tableName} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle1">{tableName}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {table.columns.map((column) => {
                              const isSelected = queryBuilder.columns.some(
                                (c) => c.table === column.table && c.name === column.name
                              );
                              return (
                                <Chip
                                  key={`${column.table}.${column.name}`}
                                  label={`${column.name} (${column.type})`}
                                  onClick={() => handleAddColumn(column)}
                                  color={isSelected ? 'primary' : 'default'}
                                  variant={isSelected ? 'filled' : 'outlined'}
                                  size="small"
                                />
                              );
                            })}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Query Conditions</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddCondition} size="small">
              Add Condition
            </Button>
          </Box>
          {queryBuilder.conditions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No conditions added yet. Click "Add Condition" to start filtering.
            </Typography>
          ) : (
            <Box>
              {queryBuilder.conditions.map((condition, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Autocomplete
                          freeSolo
                          options={queryBuilder.columns.map((c) => `${c.table}.${c.name}`)}
                          value={condition.column}
                          onChange={(_, value) =>
                            handleUpdateCondition(index, { ...condition, column: value || '' })
                          }
                          renderInput={(params) => <TextField {...params} label="Column" size="small" />}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={condition.operator}
                            label="Operator"
                            onChange={(e) =>
                              handleUpdateCondition(index, { ...condition, operator: e.target.value as any })
                            }
                          >
                            <MenuItem value="=">=</MenuItem>
                            <MenuItem value="!=">!=</MenuItem>
                            <MenuItem value=">">&gt;</MenuItem>
                            <MenuItem value="<">&lt;</MenuItem>
                            <MenuItem value=">=">&gt;=</MenuItem>
                            <MenuItem value="<=">&lt;=</MenuItem>
                            <MenuItem value="LIKE">LIKE</MenuItem>
                            <MenuItem value="IN">IN</MenuItem>
                            <MenuItem value="BETWEEN">BETWEEN</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Value"
                          value={condition.value}
                          onChange={(e) => handleUpdateCondition(index, { ...condition, value: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={condition.logicalOperator || 'AND'}
                            onChange={(e) =>
                              handleUpdateCondition(index, { ...condition, logicalOperator: e.target.value as any })
                            }
                          >
                            <MenuItem value="AND">AND</MenuItem>
                            <MenuItem value="OR">OR</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCondition(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Aggregations</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddAggregation} size="small">
                  Add Aggregation
                </Button>
              </Box>
              {queryBuilder.aggregations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No aggregations added
                </Typography>
              ) : (
                <Box>
                  {queryBuilder.aggregations.map((agg, index) => (
                    <Card key={index} sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Function</InputLabel>
                              <Select
                                value={agg.function}
                                label="Function"
                                onChange={(e) =>
                                  dispatch(
                                    updateAggregation({
                                      index,
                                      aggregation: { ...agg, function: e.target.value as any },
                                    })
                                  )
                                }
                              >
                                <MenuItem value="SUM">SUM</MenuItem>
                                <MenuItem value="COUNT">COUNT</MenuItem>
                                <MenuItem value="AVG">AVG</MenuItem>
                                <MenuItem value="MIN">MIN</MenuItem>
                                <MenuItem value="MAX">MAX</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={5}>
                            <Autocomplete
                              freeSolo
                              options={queryBuilder.columns.map((c) => `${c.table}.${c.name}`)}
                              value={agg.column}
                              onChange={(_, value) =>
                                dispatch(
                                  updateAggregation({
                                    index,
                                    aggregation: { ...agg, column: value || '' },
                                  })
                                )
                              }
                              renderInput={(params) => <TextField {...params} label="Column" size="small" />}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveAggregation(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Order By</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddOrderBy} size="small">
                  Add Order By
                </Button>
              </Box>
              {queryBuilder.orderBy.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No ordering specified
                </Typography>
              ) : (
                <Box>
                  {queryBuilder.orderBy.map((orderBy, index) => (
                    <Card key={index} sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={7}>
                            <Autocomplete
                              freeSolo
                              options={queryBuilder.columns.map((c) => `${c.table}.${c.name}`)}
                              value={orderBy.column}
                              onChange={(_, value) => {
                                const newOrderBy = { ...orderBy, column: value || '' };
                                dispatch(
                                  updateOrderBy({
                                    index,
                                    orderBy: newOrderBy,
                                  })
                                );
                              }}
                              renderInput={(params) => <TextField {...params} label="Column" size="small" />}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                              <Select
                                value={orderBy.direction}
                                onChange={(e) => {
                                  const newOrderBy = { ...orderBy, direction: e.target.value as 'ASC' | 'DESC' };
                                  dispatch(
                                    updateOrderBy({
                                      index,
                                      orderBy: newOrderBy,
                                    })
                                  );
                                }}
                              >
                                <MenuItem value="ASC">ASC</MenuItem>
                                <MenuItem value="DESC">DESC</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={1}>
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveOrderBy(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Limit"
                  type="number"
                  size="small"
                  value={queryBuilder.limit || ''}
                  onChange={(e) => dispatch(setLimit(e.target.value ? parseInt(e.target.value) : undefined))}
                  sx={{ width: 200 }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Generated SQL</Typography>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={() => navigator.clipboard.writeText(generatedSQL)}
              size="small"
            >
              Copy SQL
            </Button>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={generatedSQL || generateSQL(queryBuilder)}
            onChange={(e) => setGeneratedSQL(e.target.value)}
            placeholder="Click 'Generate SQL' to see the generated query, or edit directly here..."
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {queryResults.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No results to display. Execute a query to see results here.
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Query Results ({queryResults.length} rows)
              </Typography>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportToExcel} disabled={isExporting}>
                Export Excel
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell key={col} sx={{ fontWeight: 'bold', backgroundColor: theme.palette.background.paper }}>
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryResults.slice(0, 1000).map((row, index) => (
                    <TableRow key={index} hover>
                      {columns.map((col, colIndex) => (
                        <TableCell key={col}>{row[colIndex]?.toString() || ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {queryResults.length > 1000 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 1,000 rows of {queryResults.length} total rows
              </Typography>
            )}
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
};
