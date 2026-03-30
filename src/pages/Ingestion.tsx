import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getMeetings } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, getExtractionTypeVariant, getSourceVariant } from '@/components/ui/StatusBadge';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, MessageSquare, Calendar, Clock, Users, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Lightbulb, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { Meeting, Extraction } from '@/types';

const sourceIcon = {
  google_meet: Video,
  google_chat: MessageSquare,
  calendar: Calendar,
};

const moodConfig = {
  positive: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: TrendingUp, label: 'Positive' },
  neutral: { color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', icon: CheckCircle2, label: 'Neutral' },
  concerning: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: AlertTriangle, label: 'Needs Attention' },
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meeting Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-synced from Google Chat · Updated {meetingsQ.data?.length ? formatDistanceToNow(new Date(meetingsQ.data[0].date), { addSuffix: true }) : 'never'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          Live sync active
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
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, meetings], groupIdx) => (
            <motion.div
              key={date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: groupIdx * 0.1 }}
            >
              <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">{date}</h2>
              <div className="space-y-4">
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
  const [expanded, setExpanded] = useState(index === 0);
  const SourceIcon = sourceIcon[meeting.source];
  const mood = moodConfig[meeting.mood];
  const MoodIcon = mood.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`rounded-xl border ${mood.border} bg-card overflow-hidden transition-shadow hover:shadow-lg`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-5 flex items-start gap-4 group"
      >
        {/* Source icon */}
        <div className={`rounded-lg p-2.5 ${mood.bg} shrink-0 mt-0.5`}>
          <SourceIcon className={`h-5 w-5 ${mood.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{meeting.title}</h3>
            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${mood.bg} ${mood.color}`}>
              <MoodIcon className="h-3 w-3" />
              {mood.label}
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{meeting.summary}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(meeting.date), 'h:mm a')} · {meeting.duration_minutes}m
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {meeting.participants.length} participants
            </span>
            {meeting.blockers_identified.length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {meeting.blockers_identified.length} blocker{meeting.blockers_identified.length > 1 ? 's' : ''}
              </span>
            )}
            {meeting.action_items.length > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {meeting.action_items.length} action item{meeting.action_items.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Participant avatars */}
          <div className="flex items-center gap-1 mt-3">
            {meeting.participants.map((p, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white -ml-1 first:ml-0 ring-2 ring-card"
                style={{ backgroundColor: p.avatar_color }}
                title={`${p.name} — ${p.role}`}
              >
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
            <div className="px-5 pb-5 space-y-5 border-t border-border pt-4">
              {/* Key Points */}
              <Section icon={Lightbulb} title="Key Points" color="text-primary">
                <ul className="space-y-2">
                  {meeting.key_points.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-sm text-foreground flex items-start gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </Section>

              {/* Decisions */}
              {meeting.decisions.length > 0 && (
                <Section icon={CheckCircle2} title="Decisions" color="text-success">
                  <ul className="space-y-2">
                    {meeting.decisions.map((d, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-sm text-foreground flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {d}
                      </motion.li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Action Items */}
              {meeting.action_items.length > 0 && (
                <Section icon={Users} title="Action Items" color="text-primary">
                  <div className="space-y-2">
                    {meeting.action_items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 text-sm rounded-lg bg-secondary/50 p-3"
                      >
                        <div className="h-5 w-5 rounded border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-foreground">{item.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Assigned to <span className="font-medium text-foreground">{item.assignee}</span>
                            {item.due && <> · Due {format(new Date(item.due), 'MMM d')}</>}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Blockers */}
              {meeting.blockers_identified.length > 0 && (
                <Section icon={AlertTriangle} title="Blockers Identified" color="text-destructive">
                  <ul className="space-y-2">
                    {meeting.blockers_identified.map((b, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-sm text-foreground flex items-start gap-2 bg-destructive/5 rounded-lg p-3 border border-destructive/10"
                      >
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        {b}
                      </motion.li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Extractions */}
              {meeting.extractions.length > 0 && (
                <Section icon={TrendingUp} title="Brain Extractions" color="text-primary">
                  <div className="space-y-2">
                    {meeting.extractions.map(ext => (
                      <div key={ext.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
                          <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>{ext.extraction_type.replace('_', ' ')}</StatusBadge>
                        </div>
                        <p className="text-sm text-foreground">{ext.summary}</p>
                        {ext.source_quote && (
                          <blockquote className="border-l-2 border-muted pl-3 text-xs text-muted-foreground italic mt-2">{ext.source_quote}</blockquote>
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

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}
