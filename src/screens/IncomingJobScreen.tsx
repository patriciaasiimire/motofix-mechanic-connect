import React from 'react';
import { useJob } from '@/contexts/JobContext';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import AttachmentList from '@/components/attachments/AttachmentList';

const IncomingJobScreen: React.FC = () => {
  const { incomingJob, acceptJob, rejectJob, isProcessing } = useJob();
  const navigate = useNavigate();

  // Redirect if no incoming job
  React.useEffect(() => {
    if (!incomingJob) {
      navigate('/', { replace: true });
    }
  }, [incomingJob, navigate]);

  const handleAccept = async () => {
    await acceptJob();
    navigate('/job', { replace: true });
  };

  const handleReject = async () => {
    await rejectJob();
    navigate('/', { replace: true });
  };

  if (!incomingJob) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      {/* Urgent Header */}
      <header className="px-4 py-4 bg-accent animate-urgent">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent-foreground" />
          <span className="font-bold text-accent-foreground uppercase tracking-wide">
            New Job Request
          </span>
        </div>
      </header>

      {/* Job Details */}
      <main className="flex-1 flex flex-col p-4">
        <div className="flex-1 space-y-4">
          {/* Vehicle Info */}
          <div className="card-industrial p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                <h2 className="text-lg font-bold text-foreground">
                  {incomingJob.vehicle_type}
                </h2>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="card-industrial p-5">
            <p className="text-sm text-muted-foreground mb-2">Problem</p>
            <p className="text-foreground font-medium leading-relaxed">
              {incomingJob.problem_description}
            </p>
            
            {/* Customer Attachments */}
            {incomingJob.attachments && incomingJob.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <AttachmentList attachments={incomingJob.attachments} />
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
                <p className="text-sm text-muted-foreground mb-1">Customer Location</p>
                <p className="text-foreground font-medium">
                  {incomingJob.customer_location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="btn-reject flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <X className="w-6 h-6" />
                Reject
              </>
            )}
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="btn-accept flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6" />
                Accept
              </>
            )}
          </button>
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Respond quickly - customer is waiting
        </p>
      </main>
    </div>
  );
};

export default IncomingJobScreen;
