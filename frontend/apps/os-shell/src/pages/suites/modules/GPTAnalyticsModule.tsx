/**
 * GPT Analytics Module -- Usage Analytics & Cost Tracking
 * ===================================================================
 * Constitutional module of TerraGPT (Article V Section 5.1).
 * Owns: GPT usage metrics, cost analysis, performance monitoring.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, TrendingUp, DollarSign, MessageSquare, Clock, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface MetricCard {
  label: string;
  value: string;
  change: number;
  icon: typeof BarChart3;
}

interface GptUsageRow {
  name: string;
  conversations: number;
  messages: number;
  tokens: number;
  cost: number;
  avgRating: number;
  trend: 'up' | 'down' | 'flat';
}

interface DailyUsage {
  date: string;
  conversations: number;
  tokens: number;
  cost: number;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const METRICS: MetricCard[] = [
  { label: 'Total Conversations', value: '12,847', change: 8.3, icon: MessageSquare },
  { label: 'Total Tokens', value: '48.2M', change: 12.1, icon: Zap },
  { label: 'Total Cost', value: '$2,341.50', change: -3.2, icon: DollarSign },
  { label: 'Active Users', value: '156', change: 5.7, icon: Users },
];

const GPT_USAGE: GptUsageRow[] = [
  { name: 'Property Assistant', conversations: 4_521, messages: 18_432, tokens: 15_200_000, cost: 760.00, avgRating: 4.6, trend: 'up' },
  { name: 'Zoning Advisor', conversations: 2_834, messages: 11_220, tokens: 9_800_000, cost: 490.00, avgRating: 4.4, trend: 'up' },
  { name: 'Tax Calculator', conversations: 2_156, messages: 6_420, tokens: 8_400_000, cost: 420.00, avgRating: 4.8, trend: 'flat' },
  { name: 'Appeal Guide', conversations: 1_892, messages: 9_460, tokens: 7_200_000, cost: 360.00, avgRating: 4.3, trend: 'up' },
  { name: 'Data Analyst', conversations: 987, messages: 4_935, tokens: 5_100_000, cost: 204.00, avgRating: 4.1, trend: 'down' },
  { name: 'Compliance Checker', conversations: 457, messages: 1_371, tokens: 2_500_000, cost: 107.50, avgRating: 4.7, trend: 'flat' },
];

const DAILY_USAGE: DailyUsage[] = [
  { date: 'Mon 02/17', conversations: 1_842, tokens: 7_100_000, cost: 355.00 },
  { date: 'Tue 02/18', conversations: 2_010, tokens: 7_600_000, cost: 380.00 },
  { date: 'Wed 02/19', conversations: 1_956, tokens: 7_300_000, cost: 365.00 },
  { date: 'Thu 02/20', conversations: 2_145, tokens: 8_100_000, cost: 405.00 },
  { date: 'Fri 02/21', conversations: 1_678, tokens: 6_200_000, cost: 310.00 },
  { date: 'Sat 02/22', conversations: 412, tokens: 1_500_000, cost: 75.00 },
  { date: 'Sun 02/23', conversations: 204, tokens: 800_000, cost: 40.00 },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function GPTAnalyticsModule() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
            <BarChart3 style={{ color: 'hsl(var(--tf-suite-gpt))' }} size={28} />
            GPT Analytics
          </h2>
          <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
            Usage analytics &amp; cost tracking — Benton County TerraGPT
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className='w-36' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='24h'>Last 24 Hours</SelectItem>
            <SelectItem value='7d'>Last 7 Days</SelectItem>
            <SelectItem value='30d'>Last 30 Days</SelectItem>
            <SelectItem value='90d'>Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;
          return (
            <Card key={metric.label} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <Icon size={18} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                  <div className='flex items-center gap-1'>
                    {isPositive ? (
                      <ArrowUpRight size={14} style={{ color: 'hsl(142 71% 45%)' }} />
                    ) : (
                      <ArrowDownRight size={14} style={{ color: 'hsl(0 84% 60%)' }} />
                    )}
                    <span
                      className='text-xs font-medium'
                      style={{ color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)' }}
                    >
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <p className='text-2xl font-semibold font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{metric.value}</p>
                <p className='text-xs mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* GPT Usage Table */}
        <div className='lg:col-span-2'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>GPT Usage by Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>GPT Name</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Conversations</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Tokens</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }} className='text-right'>Cost</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Rating</TableHead>
                    <TableHead style={{ color: 'hsl(var(--tf-muted))' }}>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GPT_USAGE.map((row) => (
                    <TableRow key={row.name} style={{ borderColor: 'hsl(var(--tf-border))' }} className='hover:bg-white/5'>
                      <TableCell style={{ color: 'hsl(var(--tf-fg))' }} className='font-medium'>{row.name}</TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-muted))' }}>{row.conversations.toLocaleString()}</TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-muted))' }} className='font-mono'>{formatTokens(row.tokens)}</TableCell>
                      <TableCell style={{ color: 'hsl(var(--tf-fg))' }} className='text-right font-mono'>{formatCurrency(row.cost)}</TableCell>
                      <TableCell>
                        <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-gpt) / 0.1)', color: 'hsl(var(--tf-suite-gpt))', borderColor: 'hsl(var(--tf-suite-gpt) / 0.3)' }}>
                          {row.avgRating.toFixed(1)} ★
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.trend === 'up' && <ArrowUpRight size={16} style={{ color: 'hsl(142 71% 45%)' }} />}
                        {row.trend === 'down' && <ArrowDownRight size={16} style={{ color: 'hsl(0 84% 60%)' }} />}
                        {row.trend === 'flat' && <span style={{ color: 'hsl(var(--tf-muted))' }}>—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Daily Usage Breakdown */}
        <div className='space-y-4'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Clock size={16} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                Daily Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {DAILY_USAGE.map((day) => {
                const maxConv = Math.max(...DAILY_USAGE.map((d) => d.conversations));
                const widthPct = (day.conversations / maxConv) * 100;
                return (
                  <div key={day.date} className='space-y-1'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{day.date}</span>
                      <span className='text-xs font-mono' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {day.conversations.toLocaleString()} · {formatCurrency(day.cost)}
                      </span>
                    </div>
                    <div className='h-2 rounded-full overflow-hidden' style={{ background: 'hsl(var(--tf-border))' }}>
                      <div
                        className='h-full rounded-full transition-all'
                        style={{ width: `${widthPct}%`, background: 'hsl(var(--tf-suite-gpt))' }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {[
                ['Weekly Total', formatCurrency(DAILY_USAGE.reduce((s, d) => s + d.cost, 0))],
                ['Daily Average', formatCurrency(DAILY_USAGE.reduce((s, d) => s + d.cost, 0) / DAILY_USAGE.length)],
                ['Cost per Conversation', formatCurrency(DAILY_USAGE.reduce((s, d) => s + d.cost, 0) / DAILY_USAGE.reduce((s, d) => s + d.conversations, 0))],
                ['Avg Tokens/Conversation', formatTokens(Math.round(DAILY_USAGE.reduce((s, d) => s + d.tokens, 0) / DAILY_USAGE.reduce((s, d) => s + d.conversations, 0)))],
              ].map(([label, value]) => (
                <div key={label} className='flex justify-between py-1' style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.5)' }}>
                  <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{label}</span>
                  <span className='text-xs font-mono font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
