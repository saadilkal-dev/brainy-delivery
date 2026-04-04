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
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-4 min-w-[200px]">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-mono mb-3">
            Project Status
          </div>

          {/* Progress */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-zinc-400">Progress</span>
            <span className="text-lg font-mono font-semibold text-zinc-100">{progress}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-violet-500/70 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Modules */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-zinc-400">Modules</span>
            <span className="font-mono text-sm text-zinc-200">
              {completedModules}<span className="text-zinc-600">/{totalModules}</span>
            </span>
          </div>

          {/* Drift */}
          {driftDays !== undefined && (
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-zinc-400">Drift</span>
              <span className={cn(
                'font-mono text-sm',
                driftDays <= 0 ? 'text-zinc-300' : 'text-zinc-400',
              )}>
                {driftDays > 0 ? '+' : ''}{driftDays}d
              </span>
            </div>
          )}

          {/* Target date */}
          {targetDate && (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-400">Target</span>
              <span className="font-mono text-xs text-zinc-500">{targetDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-left camera controls */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-lg p-1 flex gap-0.5">
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
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300',
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
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-sm font-medium text-zinc-200">Immersive Journey</span>
          </div>
        </div>
      </div>
    </div>
  );
}
