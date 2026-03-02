import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Car, MapPin, Clock, Home } from 'lucide-react';
import type { Job } from '@/types/mechanic';

interface CompletionState {
  job: Job;
  completedAt: string;
}

const CompletionScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompletionState | null;

  // If arrived without state (direct navigation), go home
  useEffect(() => {
    if (!state?.job) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.job) return null;

  const { job, completedAt } = state;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      {/* Success Header */}
      <div className="bg-success px-4 py-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Job Complete!</h1>
        <p className="text-white/80 mt-1 text-sm">Great work — the customer has been helped.</p>
      </div>

      {/* Summary */}
      <main className="flex-1 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Summary
        </h2>

        <div className="card-industrial p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="font-semibold text-foreground">{job.vehicle_type}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground">{job.customer_location}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Completed at</p>
              <p className="font-medium text-foreground">{formatTime(completedAt)}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <p className="text-xs text-muted-foreground mb-1">Problem</p>
          <p className="text-foreground leading-relaxed">{job.problem_description}</p>
        </div>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="w-full btn-touch bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 mt-4"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </main>
    </div>
  );
};

export default CompletionScreen;
