import React from 'react';
import { useJob } from '@/contexts/JobContext';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, ArrowRight, Check, Loader2 } from 'lucide-react';
import type { JobStatus } from '@/types/mechanic';
import AttachmentList from '@/components/attachments/AttachmentList';

const STATUS_FLOW: { status: JobStatus; label: string; nextLabel: string }[] = [
  { status: 'accepted', label: 'Job Accepted', nextLabel: 'Start Driving' },
  { status: 'on_the_way', label: 'On the Way', nextLabel: 'I\'ve Arrived' },
  { status: 'arrived', label: 'At Location', nextLabel: 'Mark Complete' },
  { status: 'completed', label: 'Completed', nextLabel: '' },
];

const ActiveJobScreen: React.FC = () => {
  const { currentJob, updateStatus, isProcessing } = useJob();
  const navigate = useNavigate();

  // Redirect if no current job
  React.useEffect(() => {
    if (!currentJob) {
      navigate('/', { replace: true });
    }
  }, [currentJob, navigate]);

  if (!currentJob) {
    return null;
  }

  const currentStatusIndex = STATUS_FLOW.findIndex(s => s.status === currentJob.status);
  const currentStatusInfo = STATUS_FLOW[currentStatusIndex];
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1]?.status;

  const handleNextStatus = async () => {
    if (nextStatus) {
      await updateStatus(nextStatus);
      if (nextStatus === 'completed') {
        navigate('/', { replace: true });
      }
    }
  };

  const getStatusClass = (status: JobStatus) => {
    switch (status) {
      case 'accepted':
        return 'job-status-accepted';
      case 'on_the_way':
        return 'job-status-onway';
      case 'arrived':
        return 'job-status-arrived';
      case 'completed':
        return 'job-status-completed';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Active Job</h1>
          <span className={getStatusClass(currentJob.status)}>
            {currentStatusInfo?.label}
          </span>
        </div>
      </header>

      {/* Job Info */}
      <main className="flex-1 flex flex-col p-4">
        <div className="flex-1 space-y-4">
          {/* Vehicle Card */}
          <div className="card-industrial p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                <h2 className="text-lg font-bold text-foreground">
                  {currentJob.vehicle_type}
                </h2>
              </div>
            </div>
          </div>

          {/* Problem */}
          <div className="card-industrial p-5">
            <p className="text-sm text-muted-foreground mb-2">Problem</p>
            <p className="text-foreground font-medium">
              {currentJob.problem_description}
            </p>
            
            {/* Customer Attachments */}
            {currentJob.attachments && currentJob.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <AttachmentList attachments={currentJob.attachments} />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="card-industrial p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="text-foreground font-medium">
                  {currentJob.customer_location}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="card-industrial p-5">
            <p className="text-sm text-muted-foreground mb-4">Progress</p>
            <div className="flex items-center justify-between">
              {STATUS_FLOW.slice(0, -1).map((step, index) => {
                const isCompleted = currentStatusIndex > index;
                const isCurrent = currentStatusIndex === index;

                return (
                  <React.Fragment key={step.status}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-success text-success-foreground'
                            : isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center max-w-[60px]">
                        {step.label}
                      </span>
                    </div>
                    {index < STATUS_FLOW.length - 2 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 ${
                          isCompleted ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {nextStatus && (
          <button
            onClick={handleNextStatus}
            disabled={isProcessing}
            className={`mt-6 btn-touch flex items-center justify-center gap-2 disabled:opacity-50 ${
              nextStatus === 'completed'
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {nextStatus === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                {currentStatusInfo?.nextLabel}
              </>
            )}
          </button>
        )}
      </main>
    </div>
  );
};

export default ActiveJobScreen;
