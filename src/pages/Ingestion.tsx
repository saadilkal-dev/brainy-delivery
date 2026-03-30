import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { processTranscript, getExtractions } from '@/api/ingestion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, getExtractionTypeVariant, getSourceVariant } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { Brain } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import type { Extraction } from '@/types';

const SAMPLE = `[Standup — March 12, 10:00 AM]
PM: Quick update on Daikin — where are we on the product catalog module?
Dev A: I'm blocked. Still waiting on the database schema from the client.
PM: Okay, I'll follow up. Client said last week they'd have it by Wednesday.
Dev B: Also, the design team confirmed we're going with the card-based layout, not the table view. That changes my component structure.
PM: Noted. Let's also deprioritize the reporting dashboard — client said they want onboarding flow first.
Dev A: Got it. But if the schema doesn't come by Friday, I'll have to assume PostgreSQL and start building.`;

function groupByDate(items: Extraction[]) {
  const groups: Record<string, Extraction[]> = {};
  items.forEach(item => {
    const d = new Date(item.created_at);
    const key = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy');
    (groups[key] ??= []).push(item);
  });
  return groups;
}

export default function Ingestion() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [sourceName, setSourceName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<Extraction[] | null>(null);

  const extQ = useQuery({ queryKey: ['extractions', projectId], queryFn: () => getExtractions(projectId!), enabled: !!projectId });

  const processMut = useMutation({
    mutationFn: () => processTranscript(projectId!, transcript, sourceName),
    onSuccess: (data) => {
      setResults(data.extractions);
      toast.success(`✅ Brain extracted ${data.extractions.length} items from the meeting`);
      qc.invalidateQueries({ queryKey: ['extractions', projectId] });
      qc.invalidateQueries({ queryKey: ['dashboard', projectId] });
      qc.invalidateQueries({ queryKey: ['modules', projectId] });
      setTranscript('');
      setSourceName('');
    },
    onError: (e: any) => toast.error(`❌ ${e.message}`),
  });

  const grouped = extQ.data ? groupByDate(extQ.data) : {};

  return (
    <div className="space-y-6">
      {/* Transcript Input */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Process New Meeting Transcript</h2>
        <Input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="Meeting name / source (e.g., Standup — March 12)" className="bg-secondary" />
        <Textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste meeting transcript here..." className="bg-secondary min-h-[200px]" />
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setTranscript(SAMPLE); setSourceName('Standup — March 12'); }}>Load Sample Transcript</Button>
          <Button onClick={() => processMut.mutate()} disabled={processMut.isPending || !sourceName || !transcript}>
            {processMut.isPending ? (
              <span className="flex items-center gap-2"><Brain className="h-4 w-4 animate-pulse-brain" /> Brain is processing...</span>
            ) : 'Process Transcript'}
          </Button>
        </div>
      </div>

      {/* Inline Results */}
      {results && results.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-primary">Just Extracted</h3>
          {results.map(ext => (
            <ExtractionCard key={ext.id} ext={ext} />
          ))}
        </div>
      )}

      {/* Feed */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Extraction Feed</h2>
        {extQ.isLoading ? <LoadingSpinner /> : extQ.isError ? <ErrorMessage message={extQ.error.message} onRetry={() => extQ.refetch()} /> :
          Object.keys(grouped).length === 0 ? (
            <EmptyState title="No extractions yet" description="Paste a transcript above and hit Process to get started." />
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{date}</h3>
                <div className="space-y-3">
                  {items.map(ext => <ExtractionCard key={ext.id} ext={ext} />)}
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
}

function ExtractionCard({ ext }: { ext: Extraction }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <StatusBadge variant={getSourceVariant(ext.source_type)}>{ext.source_type}</StatusBadge>
        <StatusBadge variant={getExtractionTypeVariant(ext.extraction_type)}>{ext.extraction_type.replace('_', ' ')}</StatusBadge>
        <span className="text-xs text-muted-foreground">{ext.source_name}</span>
      </div>
      <p className="text-sm text-foreground mb-2">{ext.summary}</p>
      {ext.source_quote && (
        <blockquote className="border-l-2 border-muted pl-3 text-xs text-muted-foreground italic">{ext.source_quote}</blockquote>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        {ext.affected_module_name && <span>→ {ext.affected_module_name}</span>}
        {ext.action_taken && <span className="text-muted-foreground">{ext.action_taken}</span>}
      </div>
    </div>
  );
}
