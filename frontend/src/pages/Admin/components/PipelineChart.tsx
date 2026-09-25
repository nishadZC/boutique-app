import React, { memo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { BRAND } from '../../../constants/colors';
import styles from './charts.module.css';

interface Stage { key: string; label: string; count: number; onClick?: () => void }

/** Orders at each fulfilment stage: one hue (magnitude), thin bars, direct value labels. */
const PipelineChart = memo(({ stages }: { stages: Stage[] }) => {
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <Box className={styles.pipeline} role="list" aria-label="Orders by stage">
      {stages.map(stage => (
        <Tooltip key={stage.key} title={`${stage.count} order${stage.count === 1 ? '' : 's'} ${stage.label.toLowerCase()}`} placement="top-start">
          <Box
            role="listitem"
            className={`${styles.pipelineRow} ${stage.onClick ? styles.pipelineClickable : ''}`}
            onClick={stage.onClick}
            tabIndex={stage.onClick ? 0 : undefined}
            onKeyDown={e => { if (stage.onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stage.onClick(); } }}
          >
            <span className={styles.pipelineLabel}>{stage.label}</span>
            <span className={styles.pipelineTrack}>
              <span className={styles.pipelineBar} style={{ width: `${(stage.count / max) * 100}%`, background: BRAND.CHART_GOLD, minWidth: stage.count ? 4 : 0 }} />
            </span>
            <span className={styles.pipelineValue}>{stage.count}</span>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
});

export default PipelineChart;
