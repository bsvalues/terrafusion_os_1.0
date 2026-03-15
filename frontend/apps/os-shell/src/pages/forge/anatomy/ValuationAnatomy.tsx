/**
 * ValuationAnatomy.tsx (TFR-064)
 *
 * Tree/waterfall visualization showing how final value was derived.
 * Cost, sales, income breakdown. No domain math in component.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

interface ValuationComponent {
  id: string;
  label: string;
  value: number;
  type: 'add' | 'subtract' | 'subtotal' | 'total';
  approach: 'cost' | 'sales' | 'income' | 'reconciled';
  children?: ValuationComponent[];
}

interface WaterfallItem {
  name: string;
  value: number;
  cumulative: number;
  type: 'add' | 'subtract' | 'subtotal' | 'total';
}

const VALUATION_TREE: ValuationComponent[] = [
  {
    id: 'cost', label: 'Cost Approach', value: 385000, type: 'subtotal', approach: 'cost',
    children: [
      { id: 'rcn', label: 'Replacement Cost New (RCN)', value: 420000, type: 'add', approach: 'cost' },
      { id: 'phys-dep', label: 'Physical Depreciation', value: -42000, type: 'subtract', approach: 'cost' },
      { id: 'func-dep', label: 'Functional Depreciation', value: -8400, type: 'subtract', approach: 'cost' },
      { id: 'ext-dep', label: 'External Depreciation', value: -4600, type: 'subtract', approach: 'cost' },
      { id: 'land', label: 'Land Value', value: 20000, type: 'add', approach: 'cost' },
    ],
  },
  {
    id: 'sales', label: 'Sales Comparison', value: 392000, type: 'subtotal', approach: 'sales',
    children: [
      { id: 'comp1', label: 'Comp 1 (Adjusted)', value: 388000, type: 'add', approach: 'sales' },
      { id: 'comp2', label: 'Comp 2 (Adjusted)', value: 395000, type: 'add', approach: 'sales' },
      { id: 'comp3', label: 'Comp 3 (Adjusted)', value: 393000, type: 'add', approach: 'sales' },
    ],
  },
  {
    id: 'income', label: 'Income Approach', value: 378000, type: 'subtotal', approach: 'income',
    children: [
      { id: 'noi', label: 'Net Operating Income', value: 26460, type: 'add', approach: 'income' },
      { id: 'cap-rate', label: 'Cap Rate Applied (7.0%)', value: 378000, type: 'subtotal', approach: 'income' },
    ],
  },
];

const RECONCILED_VALUE = 389000;

const WATERFALL_DATA: WaterfallItem[] = [
  { name: 'RCN', value: 420000, cumulative: 420000, type: 'add' },
  { name: 'Phys Dep', value: -42000, cumulative: 378000, type: 'subtract' },
  { name: 'Func Dep', value: -8400, cumulative: 369600, type: 'subtract' },
  { name: 'Ext Dep', value: -4600, cumulative: 365000, type: 'subtract' },
  { name: 'Land', value: 20000, cumulative: 385000, type: 'add' },
  { name: 'Cost Total', value: 385000, cumulative: 385000, type: 'total' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function ValuationAnatomy() {
  const [loading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['cost', 'sales', 'income']));

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTreeNode = (node: ValuationComponent, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center justify-between py-2 px-3 rounded cursor-pointer hover:bg-gray-50 ${depth === 0 ? 'font-semibold' : ''}`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <span className="text-xs text-muted-foreground w-4">
                {isExpanded ? 'v' : '>'}
              </span>
            )}
            {!hasChildren && <span className="w-4" />}
            <span>{node.label}</span>
          </div>
          <span className={`font-mono ${node.value < 0 ? 'text-red-600' : node.type === 'total' || node.type === 'subtotal' ? 'font-bold' : ''}`}>
            {formatCurrency(node.value)}
          </span>
        </div>
        {hasChildren && isExpanded && node.children!.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Valuation Anatomy</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-muted-foreground">Loading valuation data...</span>
        </div>
      ) : (
        <>
          {/* Reconciled Value */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Reconciled Market Value</div>
                  <div className="text-4xl font-bold">{formatCurrency(RECONCILED_VALUE)}</div>
                </div>
                <div className="flex gap-3">
                  {VALUATION_TREE.map(approach => (
                    <div key={approach.id} className="text-center p-3 rounded bg-gray-50">
                      <div className="text-xs text-muted-foreground">{approach.label}</div>
                      <div className="text-lg font-bold">{formatCurrency(approach.value)}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {approach.approach === 'cost' ? '35%' : approach.approach === 'sales' ? '50%' : '15%'} weight
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tree View */}
            <Card>
              <CardHeader>
                <CardTitle>Value Breakdown Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {VALUATION_TREE.map(node => renderTreeNode(node))}
                </div>
                <div className="mt-4 pt-4 border-t-2 flex items-center justify-between px-3">
                  <span className="font-bold text-lg">Reconciled Value</span>
                  <span className="font-bold text-lg">{formatCurrency(RECONCILED_VALUE)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Waterfall Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Approach Waterfall</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={WATERFALL_DATA} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {WATERFALL_DATA.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.type === 'total' ? '#1e293b' : entry.type === 'subtract' ? '#ef4444' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Approach Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Approach Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { approach: 'Cost', value: 385000, weight: 35 },
                    { approach: 'Sales', value: 392000, weight: 50 },
                    { approach: 'Income', value: 378000, weight: 15 },
                    { approach: 'Reconciled', value: 389000, weight: 100 },
                  ]}
                  layout="vertical"
                  margin={{ top: 10, right: 30, bottom: 10, left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="approach" width={70} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <ReferenceLine x={RECONCILED_VALUE} stroke="#6366f1" strokeDasharray="3 3" />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ValuationAnatomy;
