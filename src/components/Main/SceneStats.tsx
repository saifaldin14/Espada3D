import React from 'react';
import { Box } from '@mui/material';
import { Memory, Polyline, ViewInAr, Speed } from '@mui/icons-material';
import { useAppSelector } from '../../hooks/useRedux';
import { useFPS } from './PerformanceMonitor';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

const BYTES_PER_VERTEX = 32;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFPSColor(fps: number): string {
  if (fps > 50) return '#43e97b';
  if (fps >= 30) return '#f5c842';
  return '#f54242';
}

const iconSx = { fontSize: 12, mr: 0.5, opacity: 0.6 } as const;

const dividerSx = {
  width: '1px',
  height: '12px',
  background: 'rgba(255, 255, 255, 0.12)',
} as const;

const itemSx = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.7rem',
  whiteSpace: 'nowrap',
} as const;

const SceneStats: React.FC = () => {
  const models = useAppSelector((state) => state.models.models);
  const geometryCache = useAppSelector((state) => state.mesh.geometryCache);
  const fps = useFPS();

  const objectCount = models.length;

  let totalVertices = 0;
  let totalFaces = 0;
  for (const key of Object.keys(geometryCache)) {
    const geo = geometryCache[key];
    if (geo) {
      totalVertices += geo.vertexCount || 0;
      totalFaces += geo.faceCount || 0;
    }
  }

  const memoryEstimate = totalVertices * BYTES_PER_VERTEX;

  return (
    <>
      <Box sx={dividerSx} />
      <Box sx={{ ...itemSx, color: getFPSColor(fps) }}>
        <Speed sx={{ ...iconSx, opacity: 1, color: 'inherit' }} />
        {fps} FPS
      </Box>
      <Box sx={dividerSx} />
      <Box sx={itemSx}>
        <ViewInAr sx={iconSx} />
        {formatNumber(objectCount)} obj
      </Box>
      <Box sx={dividerSx} />
      <Box sx={itemSx}>
        <Polyline sx={iconSx} />
        {formatNumber(totalVertices)} verts
      </Box>
      <Box sx={dividerSx} />
      <Box sx={itemSx}>
        <Polyline sx={{ ...iconSx, transform: 'rotate(180deg)' }} />
        {formatNumber(totalFaces)} faces
      </Box>
      <Box sx={dividerSx} />
      <Box sx={itemSx}>
        <Memory sx={iconSx} />
        {formatBytes(memoryEstimate)}
      </Box>
    </>
  );
};

export default SceneStats;
