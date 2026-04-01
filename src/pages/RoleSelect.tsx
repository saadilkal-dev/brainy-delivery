import { motion } from 'framer-motion';
import { Brain, Compass, Code2, ArrowRight } from 'lucide-react';

interface Props {
  onSelect: (role: 'consultant' | 'team') => void;
}

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Ambient violet glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.05] blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl"
      >
        {/* Logo + Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-[2]" />
              <div className="relative p-4 rounded-2xl bg-white border border-primary/15 violet-glow">
                <Brain className="h-10 w-10 text-primary" />
              </div>
            </div>
          </motion.div>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-3">
            Delivery Brain
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your AI companion for planning, visibility, and delivery
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Consultant */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onClick={() => onSelect('consultant')}
            className="card-interactive p-6 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/8 border border-primary/10">
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-1.5">Consultant</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Co-create delivery plans with AI, visualize roadmaps, and track project health
            </p>
            <div className="flex gap-2 mt-4">
              {['Planning', 'Visibility', 'Tracking'].map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>

          {/* Delivery Team */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={() => onSelect('team')}
            className="card-interactive p-6 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-[hsl(152_60%_36%/0.08)] border border-[hsl(152_60%_36%/0.1)]">
                <Code2 className="h-5 w-5 text-success" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-success group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-1.5">Delivery Team</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              View requirements, simulate system design, and stay aligned with real-time progress
            </p>
            <div className="flex gap-2 mt-4">
              {['Requirements', 'Design', 'Progress'].map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-success/8 text-success/80 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground/30 mt-10"
        >
          HumAIn PDLC · Softway
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[10px] text-muted-foreground/20 mt-2"
        >
          Press ⌘K anytime for quick navigation
        </motion.p>
      </motion.div>
    </div>
  );
}
