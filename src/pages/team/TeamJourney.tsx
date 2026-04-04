import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getModules } from '@/api/modules';
import { ImmersiveScene } from '@/components/three/ImmersiveScene';
import { buildMapGeometry } from '@/lib/mapAdapter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { mockMeetingNotes } from '@/api/mockMeetingNotes';
import { useMemo } from 'react';

/**
 * Read-only 3D journey view for the delivery team.
 * Reuses ImmersiveScene — same light-mode road visualization.
 */
export default function TeamJourney() {
  const { projectId } = useParams<{ projectId: string }>();

  const modsQ = useQuery({
    queryKey: ['modules', projectId],
    queryFn: () => getModules(projectId!),
    enabled: !!projectId,
  });

  const modules = modsQ.data ?? [];

  const geometry = useMemo(() => {
    if (modules.length === 0) return null;
    const completed = modules.filter((m) => m.status === 'complete').length;
    return buildMapGeometry(modules, completed, modules.length, mockMeetingNotes);
  }, [modules]);

  if (modsQ.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!geometry) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-[#f4f3f0]">
        <div className="text-gray-400 text-sm font-mono">No modules to visualize</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
      <ImmersiveScene geometry={geometry} />
    </div>
  );
}
