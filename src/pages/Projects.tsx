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
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (projectsQ.data && projectsQ.data.length > 0) {
      navigate(`/projects/${projectsQ.data[0].id}/dashboard`, { replace: true });
    }
  }, [projectsQ.data, navigate]);

  if (projectsQ.isLoading) return <LoadingSpinner />;
  if (projectsQ.isError) return <ErrorMessage message={projectsQ.error.message} onRetry={() => projectsQ.refetch()} />;

  return (
    <div className="dark grain-overlay min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient radial gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-[hsl(195_100%_50%/0.04)] blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md px-4"
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-5"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full scale-150" />
              <div className="relative p-4 rounded-2xl bg-card border border-primary/20 amber-glow">
                <Brain className="h-10 w-10 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-2">
              Delivery Brain
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
              Mission control for software delivery
            </p>
          </motion.div>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card/80 backdrop-blur-sm border border-white/[0.07] rounded-lg p-7 space-y-5"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
              New Project
            </p>
            <h2 className="font-heading text-lg font-semibold text-foreground">Create your first project</h2>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMut.mutate({
                name: fd.get('name') as string,
                client_name: fd.get('client_name') as string,
                target_date: fd.get('target_date') as string,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Project Name
              </label>
              <Input
                name="name"
                required
                placeholder="Daikin Selection Tool"
                className="bg-secondary/60 border-white/[0.08] font-mono text-sm placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Client Name
              </label>
              <Input
                name="client_name"
                required
                placeholder="Daikin"
                className="bg-secondary/60 border-white/[0.08] font-mono text-sm placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Target Delivery Date
              </label>
              <Input
                name="target_date"
                type="date"
                required
                className="bg-secondary/60 border-white/[0.08] font-mono text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-heading font-semibold tracking-wide amber-glow mt-2"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? 'Initialising...' : 'Launch Project →'}
            </Button>
          </form>
        </motion.div>

        <p className="text-center font-mono text-[10px] text-muted-foreground/30 mt-6 uppercase tracking-widest">
          HumAIn PDLC · Softway
        </p>
      </motion.div>
    </div>
  );
}
