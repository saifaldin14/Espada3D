import React from 'react';
import { Environment } from '@react-three/drei';
import { useAppSelector } from '../../hooks/useRedux';

const DREI_PRESETS = ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'] as const;
type DreiPreset = typeof DREI_PRESETS[number];

const EnvironmentPresets: React.FC = () => {
  const preset = useAppSelector((state) => state.ui.environmentPreset);

  if (preset === 'default' || preset === 'none') return null;

  if (DREI_PRESETS.includes(preset as DreiPreset)) {
    return <Environment preset={preset as DreiPreset} background={false} />;
  }

  return null;
};

export default EnvironmentPresets;
