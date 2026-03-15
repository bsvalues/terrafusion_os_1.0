/**
 * TFR-068: Step-by-step data import wizard.
 * Steps: 1) Select source, 2) Map fields, 3) Preview data, 4) Validate, 5) Import.
 * Handles CSV, Excel, ODBC sources.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ConnectorStatus,
  ConnectorSchema,
  ConnectorColumn,
  FieldMapping,
  ImportConfig,
  ValidationResult,
  SyncJob,
} from '../../types/sync';
import { listConnectors, getConnectorSchema } from '../../services/canon/connectorService';
import { startImport } from '../../services/canon/syncService';
import { validatePropertyData, validateSaleRecord } from '../../services/canon/validationService';

// --- Constants ---

const STEPS = ['Select Source', 'Map Fields', 'Preview', 'Validate', 'Import'] as const;
type Step = (typeof STEPS)[number];

const TARGET_FIELDS = [
  'parcelId',
  'ownerName',
  'situsAddress',
  'legalDescription',
  'countyCode',
  'propertyClass',
  'acreage',
  'latitude',
  'longitude',
  'saleDate',
  'salePrice',
  'buyerName',
  'sellerName',
  'instrumentNumber',
  'saleType',
] as const;

// --- Component ---

export default function ImportWizard() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Step 1: Source selection
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schema, setSchema] = useState<ConnectorSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Step 2: Field mapping
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Step 3: Preview
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);

  // Step 4: Validation
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);

  // Step 5: Import
  const [importJob, setImportJob] = useState<SyncJob | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];

  // Load connectors on mount
  useEffect(() => {
    listConnectors()
      .then((res) => setConnectors(res.data))
      .catch(() => setConnectors([]));
  }, []);

  // Load schema when source selected
  useEffect(() => {
    if (!selectedSource) {
      setSchema(null);
      return;
    }
    setLoadingSchema(true);
    getConnectorSchema(selectedSource)
      .then((res) => setSchema(res.data))
      .catch(() => setSchema(null))
      .finally(() => setLoadingSchema(false));
  }, [selectedSource]);

  // Auto-generate mappings when table selected
  useEffect(() => {
    if (!schema || !selectedTable) return;
    const table = schema.tables.find((t) => t.tableName === selectedTable);
    if (!table) return;

    const auto: FieldMapping[] = table.columns.map((col) => {
      const match = TARGET_FIELDS.find(
        (tf) => tf.toLowerCase() === col.name.toLowerCase().replace(/_/g, ''),
      );
      return {
        id: crypto.randomUUID?.() ?? `${col.name}-${Date.now()}`,
        sourceField: col.name,
        targetField: match ?? '',
        transformExpression: null,
        required: col.isPrimaryKey,
        defaultValue: null,
      };
    });
    setMappings(auto);
  }, [schema, selectedTable]);

  // Generate fake preview from mappings (in a real app, this calls the backend)
  useEffect(() => {
    if (stepIndex !== 2 || mappings.length === 0) return;
    // Placeholder preview rows; real implementation fetches sample data from the connector
    const sample: Record<string, string>[] = Array.from({ length: 5 }, (_, i) => {
      const row: Record<string, string> = {};
      mappings.forEach((m) => {
        row[m.sourceField] = `sample-${m.sourceField}-${i + 1}`;
      });
      return row;
    });
    setPreviewRows(sample);
  }, [stepIndex, mappings]);

  // Run validation on step 4
  useEffect(() => {
    if (stepIndex !== 3) return;
    setValidating(true);
    // Validate preview rows against mapped target fields
    const results: ValidationResult[] = [];
    previewRows.forEach((row) => {
      const mapped: Record<string, unknown> = {};
      mappings.forEach((m) => {
        if (m.targetField) mapped[m.targetField] = row[m.sourceField];
      });
      results.push(...validatePropertyData(mapped));
      if (mapped.saleDate || mapped.salePrice) {
        results.push(...validateSaleRecord(mapped));
      }
    });
    setValidationResults(results);
    setValidating(false);
  }, [stepIndex, previewRows, mappings]);

  function updateMapping(id: string, targetField: string) {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, targetField } : m)),
    );
  }

  async function executeImport() {
    if (!selectedSource || !selectedTable) return;
    setImporting(true);
    setImportError(null);
    try {
      const connector = connectors.find((c) => c.name === selectedSource);
      const config: ImportConfig = {
        sourceId: selectedSource,
        sourceName: connector?.displayName ?? selectedSource,
        sourceType: connector?.type ?? 'csv',
        tableName: selectedTable,
        fieldMappings: mappings.filter((m) => m.targetField),
        mode: 'full',
        validateOnly: false,
        skipErrors: false,
        batchSize: 1000,
      };
      const res = await startImport(config);
      setImportJob(res.data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStepIndex(0);
    setSelectedSource(null);
    setSelectedTable(null);
    setSchema(null);
    setMappings([]);
    setPreviewRows([]);
    setValidationResults([]);
    setImportJob(null);
    setImportError(null);
  }

  const canNext = (): boolean => {
    switch (stepIndex) {
      case 0:
        return !!selectedSource && !!selectedTable;
      case 1:
        return mappings.some((m) => m.targetField);
      case 2:
        return previewRows.length > 0;
      case 3:
        return validationResults.filter((v) => v.severity === 'error').length === 0;
      default:
        return false;
    }
  };

  // --- Source columns for preview ---
  const sourceColumns: ConnectorColumn[] =
    schema?.tables.find((t) => t.tableName === selectedTable)?.columns ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Import Wizard</h1>
        <Button onClick={() => { reset(); setOpen(true); }}>
          New Import
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Data &mdash; {currentStep}</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-2 border-b pb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    i === stepIndex
                      ? 'bg-primary text-primary-foreground'
                      : i < stepIndex
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${i === stepIndex ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
              </div>
            ))}
          </div>

          <div className="min-h-[300px] py-4">
            {/* Step 1: Select Source */}
            {stepIndex === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a data source and table to import from.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {connectors.map((c) => (
                    <Card
                      key={c.name}
                      className={`cursor-pointer transition-colors ${
                        selectedSource === c.name ? 'border-primary ring-1 ring-primary' : ''
                      }`}
                      onClick={() => { setSelectedSource(c.name); setSelectedTable(null); }}
                    >
                      <CardHeader className="pb-1">
                        <CardTitle className="text-sm">{c.displayName || c.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex items-center gap-2 text-xs">
                        <Badge variant="outline">{c.type}</Badge>
                        <span className={c.connected ? 'text-green-600' : 'text-red-500'}>
                          {c.connected ? 'Connected' : 'Offline'}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {loadingSchema && <p className="text-sm">Loading schema...</p>}

                {schema && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select table:</p>
                    <div className="flex flex-wrap gap-2">
                      {schema.tables.map((t) => (
                        <Button
                          key={t.tableName}
                          variant={selectedTable === t.tableName ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTable(t.tableName)}
                        >
                          {t.tableName}
                          {t.rowCount !== null && (
                            <span className="ml-1 text-xs opacity-70">
                              ({t.rowCount.toLocaleString()})
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Map Fields */}
            {stepIndex === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Map source columns to target fields. Leave blank to skip a column.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Column</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target Field</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((m) => {
                      const col = sourceColumns.find((c) => c.name === m.sourceField);
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs">{m.sourceField}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {col?.dataType ?? '--'}
                          </TableCell>
                          <TableCell>
                            <select
                              className="rounded border bg-background px-2 py-1 text-sm"
                              value={m.targetField}
                              onChange={(e) => updateMapping(m.id, e.target.value)}
                            >
                              <option value="">-- skip --</option>
                              {TARGET_FIELDS.map((tf) => (
                                <option key={tf} value={tf}>
                                  {tf}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Step 3: Preview */}
            {stepIndex === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Preview of sample data (first 5 rows).
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {mappings
                          .filter((m) => m.targetField)
                          .map((m) => (
                            <TableHead key={m.id}>{m.targetField}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, i) => (
                        <TableRow key={i}>
                          {mappings
                            .filter((m) => m.targetField)
                            .map((m) => (
                              <TableCell key={m.id} className="text-xs">
                                {row[m.sourceField] ?? ''}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Step 4: Validate */}
            {stepIndex === 3 && (
              <div className="space-y-3">
                {validating ? (
                  <p className="text-sm">Validating...</p>
                ) : validationResults.length === 0 ? (
                  <p className="text-sm text-green-600">All records passed validation.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {validationResults.filter((v) => v.severity === 'error').length} errors,{' '}
                      {validationResults.filter((v) => v.severity === 'warning').length} warnings
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Severity</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Rule</TableHead>
                            <TableHead>Message</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResults.map((v, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Badge
                                  variant={
                                    v.severity === 'error'
                                      ? 'destructive'
                                      : v.severity === 'warning'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                >
                                  {v.severity}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{v.field}</TableCell>
                              <TableCell className="text-xs">{v.rule}</TableCell>
                              <TableCell className="text-xs">{v.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Import */}
            {stepIndex === 4 && (
              <div className="space-y-4">
                {!importJob && !importing && (
                  <div className="space-y-3">
                    <p className="text-sm">
                      Ready to import from{' '}
                      <span className="font-semibold">{selectedSource}</span> /{' '}
                      <span className="font-semibold">{selectedTable}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mappings.filter((m) => m.targetField).length} field mappings configured.
                    </p>
                    <Button onClick={executeImport}>Start Import</Button>
                  </div>
                )}

                {importing && <p className="text-sm">Starting import...</p>}

                {importError && (
                  <Card className="border-red-500">
                    <CardContent className="py-3 text-red-600">{importError}</CardContent>
                  </Card>
                )}

                {importJob && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Import Job Created</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Job ID</span>
                        <span className="font-mono text-xs">{importJob.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge>{importJob.status}</Badge>
                      </div>
                      <p className="pt-2 text-xs text-muted-foreground">
                        Monitor progress on the Sync Dashboard.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { reset(); setOpen(false); }}
              >
                Cancel
              </Button>
              {stepIndex > 0 && (
                <Button variant="outline" onClick={() => setStepIndex((s) => s - 1)}>
                  Back
                </Button>
              )}
            </div>
            {stepIndex < STEPS.length - 1 && (
              <Button onClick={() => setStepIndex((s) => s + 1)} disabled={!canNext()}>
                Next
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
