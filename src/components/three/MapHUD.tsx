import type { CameraMode } from '@/types/three';
import { Eye, Navigation, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapHUDProps {
  completedModules: number;
  totalModules: number;
  driftDays?: number;
  targetDate?: string;
  cameraMode: CameraMode;
  onCameraMode: (mode: CameraMode) => void;
}

/**
 * HTML overlay on top of the 3D canvas.
 * Frosted-glass panels with project metrics.
 */
export function MapHUD({
  completedModules,
  totalModules,
  driftDays,
  targetDate,
  cameraMode,
  onCameraMode,
}: MapHUDProps) {
  const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top-right metrics panel */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-white/85 backdrop-blur-xl border border-black/8 rounded-lg p-4 min-w-[200px] shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-mono mb-3">
            Project Status
          </div>

          {/* Progress */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-lg font-mono font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="h-1 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-violet-600/80 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Modules */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-gray-500">Modules</span>
            <span className="font-mono text-sm text-gray-800">
              {completedModules}<span className="text-gray-400">/{totalModules}</span>
            </span>
          </div>

          {/* Drift */}
          {driftDays !== undefined && (
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-gray-500">Drift</span>
              <span className={cn(
                'font-mono text-sm',
                driftDays <= 0 ? 'text-gray-700' : 'text-gray-500',
              )}>
                {driftDays > 0 ? '+' : ''}{driftDays}d
              </span>
            </div>
          )}

          {/* Target date */}
          {targetDate && (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">Target</span>
              <span className="font-mono text-xs text-gray-400">{targetDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-left camera controls */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-white/85 backdrop-blur-xl border border-black/8 rounded-lg p-1 flex gap-0.5 shadow-sm">
          {([
            { mode: 'overview' as CameraMode, icon: Eye, label: 'Overview' },
            { mode: 'follow' as CameraMode, icon: Navigation, label: 'Follow' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onCameraMode(mode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all',
                cameraMode === mode
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="font-mono">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top-left title */}
      <div className="absolute top-4 left-4">
        <div className="bg-white/70 backdrop-blur-xl border border-black/8 rounded-lg px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-violet-600" />
            <span className="text-sm font-medium text-gray-800">Immersive Journey</span>
          </div>
        </div>
      </div>
    </div>
  );
}
