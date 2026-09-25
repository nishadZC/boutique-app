import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { BRAND } from '../../../constants/colors';
import { formatCurrency, formatCompactCurrency, formatDay } from '../format';
import styles from './charts.module.css';

interface Point { date: string; revenue: number; orders: number }

const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

/** Paid revenue per day: a single series (no legend), with crosshair tooltip and a table view. */
const RevenueChart = memo(({ data }: { data: Point[] }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const max = Math.max(...data.map(d => d.revenue), 1);
    // A "nice" rounded maximum so the gridlines land on readable values.
    const magnitude = 10 ** Math.floor(Math.log10(max));
    const niceMax = Math.ceil(max / magnitude) * magnitude;
    const x = (i: number) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(' ');
    const area = data.length ? `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : '';
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => niceMax * f);
    const labelEvery = Math.max(1, Math.ceil(data.length / 6));
    return { innerW, x, y, line, area, ticks, labelEvery };
  }, [data, width]);

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  };

  const total = data.reduce((s, d) => s + d.revenue, 0);
  const hovered = hover != null ? data[hover] : null;

  return (
    <Box>
      <Box className={styles.chartTools}>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="Chart or table view">
          <ToggleButton value="chart">Chart</ToggleButton>
          <ToggleButton value="table">Table</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'table' ? (
        <Box className={styles.tableScroll}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Day</TableCell><TableCell align="right">Paid orders</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
            <TableBody>
              {[...data].reverse().map(d => (
                <TableRow key={d.date}><TableCell>{formatDay(d.date)}</TableCell><TableCell align="right">{d.orders}</TableCell><TableCell align="right">{formatCurrency(d.revenue)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Box ref={wrapRef} className={styles.chartWrap}>
          <svg width={width} height={HEIGHT} role="img" aria-label={`Paid revenue per day, ${formatCurrency(total)} in total. Switch to table view for exact values.`}>
            {geometry.ticks.map(t => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={geometry.y(t)} y2={geometry.y(t)} className={styles.grid} />
                <text x={PAD.left - 8} y={geometry.y(t)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">{formatCompactCurrency(t)}</text>
              </g>
            ))}
            {data.map((d, i) => (i % geometry.labelEvery === 0 || i === data.length - 1) && (
              <text key={d.date} x={geometry.x(i)} y={HEIGHT - 8} className={styles.axisLabel} textAnchor="middle">{formatDay(d.date, true)}</text>
            ))}
            <path d={geometry.area} fill={BRAND.CHART_GOLD} opacity={0.1} />
            <path d={geometry.line} fill="none" stroke={BRAND.CHART_GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hovered && hover != null && (
              <g pointerEvents="none">
                <line x1={geometry.x(hover)} x2={geometry.x(hover)} y1={PAD.top} y2={geometry.y(0)} className={styles.crosshair} />
                <circle cx={geometry.x(hover)} cy={geometry.y(hovered.revenue)} r={5} fill={BRAND.CHART_GOLD} stroke="#fff" strokeWidth={2} />
              </g>
            )}
            <rect x={PAD.left} y={PAD.top} width={geometry.innerW} height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setHover(null)} />
          </svg>
          {hovered && hover != null && (
            <Box className={styles.tooltip} style={{ left: Math.min(geometry.x(hover) + 12, width - 170), top: 8 }}>
              <div className={styles.tooltipTitle}>{formatDay(hovered.date)}</div>
              <div className={styles.tooltipRow}><span>Revenue</span><strong>{formatCurrency(hovered.revenue)}</strong></div>
              <div className={styles.tooltipRow}><span>Paid orders</span><strong>{hovered.orders}</strong></div>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

export default RevenueChart;
