import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getMeetings } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, getExtractionTypeVariant, getSourceVariant } from '@/components/ui/StatusBadge';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, MessageSquare, Calendar, Clock, Users, ChevronDown, AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, Brain } from 'lucide-react';
import { useState } from 'react';
import type { Meeting } from '@/types';

const sourceIcon: Record<string, any> = {
  meet: Video,
  chat: MessageSquare,
  calendar: Calendar,
};

const moodConfig = {
  positive:   { borderColor: 'border-l-success',  label: 'Positive',      icon: TrendingUp,  iconColor: 'text-success' },
  neutral:    { borderColor: 'border-l-muted-foreground/20', label: 'Neutral', icon: CheckCircle2, iconColor: 'text-muted-foreground' },
  concerning: { borderColor: 'border-l-primary',  label: 'Needs Attention', icon: AlertTriangle, iconColor: 'text-primary' },
};

function groupByDate(items: Meeting[]) {
  const groups: Record<string, Meeting[]> = {};
  items.forEach(item => {
    const d = new Date(item.date);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d');
    (groups[key] ??= []).push(item);
  });
  return groups;
}

export default function Ingestion() {
  const { id: projectId } = useParams<{ id: string }>();

  const meetingsQ = useQuery({
    queryKey: ['meetings', projectId],
    queryFn: () => getMeetings(projectId!),
    enabled: !!projectId,
  });

  const grouped = meetingsQ.data ? groupByDate(meetingsQ.data) : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Meeting Intelligence</h1>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 mt-1">
            Auto-synced from Google Chat ·{' '}
            {meetingsQ.data?.length
              ? `Updated ${formatDistanceToNow(new Date(meetingsQ.data[0].date), { addSuffix: true })}`
              : 'No meetings yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">Live</span>
        </div>
      </motion.div>

      {/* Content */}
      {meetingsQ.isLoading ? (
        <LoadingSpinner />
      ) : meetingsQ.isError ? (
        <ErrorMessage message={meetingsQ.error.message} onRetry={() => meetingsQ.refetch()} />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          title="No meetings yet"
          description="Meeting notes will appear here automatically once the Google Chat bot captures them."
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([date, meetings], groupIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: groupIdx * 0.1 }}
            >
              {/* Date group header */}
              <div className="flex items-center gap-4 mb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 shrink-0">{date}</p>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              <div className="space-y-3">
                {meetings.map((meeting, idx) => (
                  <MeetingCard key={meeting.id} meeting={meeting} index={idx} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, index }: { meeting: Meeting; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const SourceIcon = sourceIcon[meeting.source] || MessageSquare;
  const mood = moodConfig[meeting.mood] || moodConfig.neutral;
  const MoodIcon = mood.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-sm border border-white/[0.07] bg-card overflow-hidden border-l-2 ${mood.borderColor}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 flex items-start gap-4 group hover:bg-white/[0.02] transition-colors"
      >
        {/* Source icon */}
        <div className="rounded-sm bg-white/[0.04] border border-white/[0.06] p-2 shrink-0 mt-0.5">
          <SourceIcon className={`h-4 w-4 ${mood.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-heading font-semibold text-foreground text-sm truncate">{meeting.title}</h3>
            <div className="flex items-center gap-1">
              <MoodIcon className={`h-3 w-3 ${mood.iconColor}`} />
              <span className={`font-mono text-[10px] uppercase tracking-wider ${mood.iconColor}`}>{mood.label}</span>
            </div>
          </div>

          <p className="font-mono text-xs text-muted-foreground/60 line-clamp-2 mb-3">{meeting.summary}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground/40 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(meeting.date), 'h:mm a')} · {meeting.duration_minutes}m
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {meeting.participants.length} participants
            </span>
            {meeting.blockers_identified.length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {meeting.blockers_identified.length} blocker{meeting.blockers_identified.length > 1 ? 's' : ''}
              </span>
            )}
            {meeting.action_items.length > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {meeting.action_items.length} action item{meeting.action_items.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Participant avatars */}
          <div className="flex items-center gap-0.5 mt-3">
            {meeting.participants.map((p, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white -ml-1 first:ml-0 ring-2 ring-card"
                style={{ backgroundColor: p.avatar_color }}
                title={`${p.name} — ${p.role}`}
              >
                {p.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
        </motion.div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-white/[0.06] pt-4">
              {/* Key Points */}
              <Section icon={Lightbulb} title="Key Points" iconColor="text-primary">
                <ul className="space-y-2">
                  {meeting.key_points.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="font-mono text-xs text-foreground/80 flex items-start gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </Section>

              {/* Decisions */}
              {meeting.decisions.length > 0 && (
                <Section icon={CheckCircle2} title="Decisions" iconColor="text-success">
                  <ul className="space-y-2">
                    {meeting.decisions.map((d, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="font-mono text-xs text-foreground/80 flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        {d}
                      </motion.li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Action Items */}
              {meeting.action_items.length > 0 && (
                <Section icon={Users} title="Action Items" iconColor="text-primary">
                  <div className="space-y-2">
                    {meeting.action_items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 font-mono text-xs rounded-sm bg-white/[0.03] border border-white/[0.05] p-3"
                      >
                        <div className="h-4 w-4 rounded-sm border border-muted-foreground/20 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-foreground/80">{item.text}</p>
                          <p className="text-[10px] text-muted-foreground/40 mt-1">
                            → <span className="text-foreground/60">{item.assignee}</span>
                            {item.due && <> · {format(new Date(item.due), 'MMM d')}</>}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Blockers */}
              {meeting.blockers_identified.length > 0 && (
                <Section icon={AlertTriangle} title="Blockers Identified" iconColor="text-destructive">
                  <ul className="space-y-2">
                    {meeting.blockers_identified.map((b, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="font-mono text-xs text-foreground/80 flex items-start gap-2 bg-destructive/5 rounded-sm p-3 border-l-2 border-l-destructive"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                        {b}
                      </motion.li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Extractions */}
              {meeting.extractions.length > 0 && (
                <Section icon={Brain} title="Brain Extractions" iconColor="text-[hsl(195_100%_50%)]">
                  <div className="space-y-2">
                    {meeting.extractions.map(ext => (
                      <div
                        key={ext.id}
                        className="rounded-sm border border-[hsl(195_100%_50%/0.15)] bg-[hsl(195_100%_50%/0.03)] p-3 border-l-2 border-l-[hsl(195_100%_50%/0.4)]"
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                          <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>
                            {ext.extraction_type.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <p className="font-mono text-xs text-foreground/80">{ext.summary}</p>
                        {ext.source_quote && (
                          <blockquote className="border-l-2 border-white/[0.1] pl-3 font-mono text-[10px] text-muted-foreground/40 italic mt-2">
                            "{ext.source_quote}"
                          </blockquote>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({ icon: Icon, title, iconColor, children }: { icon: any; title: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">{title}</h4>
      </div>
      {children}
    </div>
  );
}
