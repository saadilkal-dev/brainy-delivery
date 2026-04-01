import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '@/api/projects';
import { getMeetings } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Plus, ArrowRight, FolderOpen, Sparkles, MessageSquare, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
})();

const QUICK_ACTIONS = [
  { label: 'Start a new plan', icon: Sparkles, action: 'create' },
  { label: 'Review blockers', icon: AlertTriangle, action: 'blockers' },
  { label: 'Check project health', icon: ArrowUpRight, action: 'health' },
];

export default function ConsultantHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const meetingsQ = useQuery({
    queryKey: ['meetings', 'proj-1'],
    queryFn: () => getMeetings('proj-1'),
  });

  const createMut = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
      navigate(`/consultant/${project.id}/cocreate`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (projectsQ.isLoading) return <LoadingSpinner />;

  const projects = projectsQ.data ?? [];
  const meetings = meetingsQ.data ?? [];
  const recentMeetings = meetings.slice(0, 3);

  const handleQuickAction = (action: string) => {
    if (action === 'create') setShowCreate(true);
    else if (action === 'blockers' && projects[0]) navigate(`/consultant/${projects[0].id}/tracking`);
    else if (action === 'health' && projects[0]) navigate(`/consultant/${projects[0].id}/map`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12">
        {/* AI Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full scale-150 animate-breathe" />
              <div className="relative p-3 rounded-2xl bg-white border border-primary/10 violet-glow">
                <Brain className="h-6 w-6 text-primary" />
              </div>
            </motion.div>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {GREETING}
              </h1>
              <p className="text-muted-foreground mt-0.5">
                What would you like to work on today?
              </p>
            </div>
          </div>

          {/* Quick action chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((qa, i) => (
              <motion.button
                key={qa.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                onClick={() => handleQuickAction(qa.action)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/15 bg-white hover:bg-primary/5 hover:border-primary/25 transition-all text-sm font-medium text-foreground/80 hover:text-foreground group"
              >
                <qa.icon className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                {qa.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects section */}
            {projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Projects</h2>
                  <span className="text-xs text-muted-foreground/50">{projects.length} active</span>
                </div>
                <div className="space-y-2">
                  {projects.map((p, i) => (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
                      onClick={() => navigate(`/consultant/${p.id}/cocreate`)}
                      className="card-interactive p-4 w-full text-left group flex items-center gap-4"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/6 group-hover:bg-primary/10 transition-colors">
                        <FolderOpen className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-0.5 truncate">{p.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{p.client_name}</span>
                          {p.target_date && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {p.target_date}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Create project */}
            <AnimatePresence mode="wait">
              {!showCreate ? (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowCreate(true)}
                  className="card-interactive p-5 w-full text-left group border border-dashed border-border hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/6 border border-primary/8 group-hover:bg-primary/10 transition-colors">
                      <Plus className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">New Project</h3>
                      <p className="text-sm text-muted-foreground">Start co-creating a delivery plan with AI</p>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="card-elevated p-6 ring-1 ring-primary/10"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-heading font-semibold text-foreground">Create Project</h3>
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
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input name="name" placeholder="Project name" required className="bg-muted/30" />
                      <Input name="client_name" placeholder="Client name" required className="bg-muted/30" />
                    </div>
                    <Input name="target_date" type="date" required className="bg-muted/30 max-w-xs" />
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" disabled={createMut.isPending} className="gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        {createMut.isPending ? 'Creating...' : 'Create & Co-Create'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column — Recent signals */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="space-y-6"
          >
            {/* Recent meeting signals */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase mb-3">Recent Signals</h2>
              {recentMeetings.length === 0 ? (
                <div className="card-elevated p-6 text-center">
                  <Brain className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No signals yet. Process meeting notes to see AI-extracted insights here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMeetings.map((m, i) => {
                    const moodColor = m.mood === 'positive' ? 'bg-success' : m.mood === 'concerning' ? 'bg-destructive' : 'bg-muted-foreground';
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        className="card-elevated p-3.5 group cursor-pointer hover:ring-1 hover:ring-primary/10 transition-all"
                        onClick={() => navigate(`/consultant/${m.project_id}/tracking`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/6 shrink-0 mt-0.5">
                            <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground truncate">{m.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.summary}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn('w-1.5 h-1.5 rounded-full', moodColor)} />
                              <span className="text-xs text-muted-foreground/60">
                                {formatDistanceToNow(new Date(m.date), { addSuffix: true })}
                              </span>
                              {m.blockers_identified.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/8 text-destructive font-medium">
                                  {m.blockers_identified.length} blocker{m.blockers_identified.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI insight card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card-elevated p-4 ring-1 ring-primary/8 bg-gradient-to-br from-white to-primary/[0.02]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-md bg-primary/8">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary">AI Insight</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                The Daikin Service Portal has a database schema dependency that's 20 days overdue. 
                This is blocking 2 downstream modules. Consider escalating or starting with an assumed schema.
              </p>
              {projects[0] && (
                <button
                  onClick={() => navigate(`/consultant/${projects[0].id}/map`)}
                  className="flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View roadmap
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground/30 mt-16"
        >
          HumAIn PDLC · Softway
        </motion.p>
      </div>
    </div>
  );
}
