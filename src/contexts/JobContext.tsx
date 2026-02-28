import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Job, JobStatus } from '@/types/mechanic';
import { acceptJob as apiAcceptJob, rejectJob as apiRejectJob, updateJobStatus as apiUpdateJobStatus, getMechanicProfile } from '@/services/api';
import { connectJobsWebSocket, type JobEvent } from '@/services/ws';
import { useToast } from '@/hooks/use-toast';

interface JobContextType {
  currentJob: Job | null;
  incomingJob: Job | null;
  isProcessing: boolean;
  setIncomingJob: (job: Job | null) => void;
  acceptJob: () => Promise<void>;
  rejectJob: () => Promise<void>;
  updateStatus: (status: JobStatus) => Promise<void>;
  clearJob: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [incomingJob, setIncomingJob] = useState<Job | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const rejectJob = useCallback(async () => {
    if (!incomingJob) return;
    setIsProcessing(true);
    try {
      await apiRejectJob(incomingJob.id);
      setIncomingJob(null);
    } finally {
      setIsProcessing(false);
    }
  }, [incomingJob]);

  const updateStatus = useCallback(async (status: JobStatus) => {
    if (!currentJob) return;
    setIsProcessing(true);
    try {
      const updated = await apiUpdateJobStatus(currentJob.id, status);
      if (status === 'completed') {
        setCurrentJob(null);
      } else {
        setCurrentJob(updated);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentJob]);

  const clearJob = useCallback(() => {
    setCurrentJob(null);
    setIncomingJob(null);
  }, []);

  useEffect(() => {
    const ws = connectJobsWebSocket((evt: JobEvent) => {
      if (evt.type === 'new_job') {
        if (!currentJob && !incomingJob) {
          setIncomingJob(evt.job as Job);
          try { window.navigator.vibrate?.(200); } catch (e) {}
          try { new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg').play().catch(() => {}); } catch (e) {}
          toast.toast({ title: 'New job!', description: 'A job request is available', duration: 5000 });
        }
      }

      if (evt.type === 'job_taken') {
        const { job_id, mechanic } = evt;
        if (incomingJob && incomingJob.id === job_id) {
          getMechanicProfile().then((mech) => {
            if (mech && mech.id === mechanic.id) {
              setCurrentJob(incomingJob);
              setIncomingJob(null);
              toast.toast({ title: 'Job accepted', description: `ETA ${evt.eta_minutes || 'TBD'} mins`, duration: 5000 });
            } else {
              setIncomingJob(null);
              toast.toast({ title: 'Job taken', description: `${mechanic.name} took this job`, duration: 4000 });
            }
          }).catch(() => {
            setIncomingJob(null);
            toast.toast({ title: 'Job taken', description: `${mechanic.name} took this job`, duration: 4000 });
          });
        }

        if (currentJob && currentJob.id === job_id) {
          setCurrentJob(null);
          toast.toast({ title: 'Job updated', description: `Job marked taken by ${mechanic.name}`, duration: 4000 });
        }
      }
    });

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJob, incomingJob]);

  const acceptJob = useCallback(async () => {
    if (!incomingJob) return;
    setIsProcessing(true);
    try {
      const job = await apiAcceptJob(incomingJob.id);
      setCurrentJob(job);
      setIncomingJob(null);
      toast.toast({ title: 'Accepted', description: 'Job accepted — good luck!', duration: 4000 });
    } catch (err: any) {
      setIncomingJob(null);
      toast.toast({ title: 'Could not accept', description: err?.message || 'Job was taken by someone else', duration: 4000 });
    } finally {
      setIsProcessing(false);
    }
  }, [incomingJob, toast]);

  return (
    <JobContext.Provider
      value={{
        currentJob,
        incomingJob,
        isProcessing,
        setIncomingJob,
        acceptJob,
        rejectJob,
        updateStatus,
        clearJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJob = (): JobContextType => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};
