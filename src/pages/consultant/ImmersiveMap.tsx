import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModules } from '@/api/modules';
import { getDashboard } from '@/api/dashboard';
import { ImmersiveScene } from '@/components/three/ImmersiveScene';
import { buildMapGeometry } from '@/lib/mapAdapter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMemo } from 'react';

export default function ImmersiveMap() {
  const { id } = useParams();

  const modsQ = useQuery({
    queryKey: ['modules', id],
    queryFn: () => getModules(id!),
    enabled: !!id,
  });

  const dashQ = useQuery({
    queryKey: ['dashboard', id],
    queryFn: () => getDashboard(id!),
    enabled: !!id,
  });

  const modules = modsQ.data ?? [];
  const dash = dashQ.data;

  const geometry = useMemo(() => {
    if (modules.length === 0) return null;
    const completed = modules.filter((m) => m.status === 'complete').length;
    return buildMapGeometry(modules, completed, modules.length);
  }, [modules]);

  if (modsQ.isLoading || dashQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#0a0a0b]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!geometry) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#0a0a0b]">
        <div className="text-zinc-500 text-sm font-mono">No modules to visualize</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      <ImmersiveScene
        geometry={geometry}
        driftDays={dash?.predicted_delivery?.drift_days}
        targetDate={dash?.predicted_delivery?.original_target
          ? new Date(dash.predicted_delivery.original_target).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })
          : undefined
        }
      />
    </div>
  );
}
