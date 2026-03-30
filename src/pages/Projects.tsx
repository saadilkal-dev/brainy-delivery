import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '@/api/projects';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function Projects() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!');
      navigate(`/projects/${project.id}/dashboard`);
    },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  // Auto-redirect if projects exist
  useEffect(() => {
    if (projectsQ.data && projectsQ.data.length > 0) {
      navigate(`/projects/${projectsQ.data[0].id}/dashboard`, { replace: true });
    }
  }, [projectsQ.data, navigate]);

  if (projectsQ.isLoading) return <LoadingSpinner />;
  if (projectsQ.isError) return <ErrorMessage message={projectsQ.error.message} onRetry={() => projectsQ.refetch()} />;

  // Welcome screen for first-run
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <Brain className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Welcome to Delivery Brain</h1>
        <p className="text-muted-foreground">Start by creating your first project</p>
        <form onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          createMut.mutate({
            name: fd.get('name') as string,
            client_name: fd.get('client_name') as string,
            target_date: fd.get('target_date') as string,
          });
        }} className="space-y-3 text-left">
          <div>
            <label className="text-sm text-muted-foreground">Project Name</label>
            <Input name="name" required className="bg-secondary mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Client Name</label>
            <Input name="client_name" required className="bg-secondary mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Target Delivery Date</label>
            <Input name="target_date" type="date" required className="bg-secondary mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={createMut.isPending}>Create Project</Button>
        </form>
      </div>
    </div>
  );
}
