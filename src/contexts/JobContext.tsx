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
  // Demo function to simulate incoming job
  simulateIncomingJob: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [incomingJob, setIncomingJob] = useState<Job | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const simulateIncomingJob = useCallback(() => {
    const demoJob: Job = {
      id: Date.now(),
      vehicle_type: 'Toyota Corolla 2019',
      problem_description: 'Car won\'t start — engine cranks but doesn\'t turn over. Tried jump-starting with no luck. Possible fuel pump or ignition issue.',
      customer_location: 'Nasr City, Cairo — near City Stars Mall',
      customer_latitude: 30.0726,
      customer_longitude: 31.3456,
      status: 'pending' as JobStatus,
      created_at: new Date().toISOString(),
      attachments: [
        { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800', filename: 'engine_photo.jpg' },
        { id: '2', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', filename: 'voice_note.mp3' },
        { id: '3', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', filename: 'insurance_doc.pdf' },
      ],
    };
    setIncomingJob(demoJob);
  }, []);

  // Demo: simulate an incoming job request with attachments
  const toast = useToast();

  useEffect(() => {
    // Connect to job WebSocket for live events
    const ws = connectJobsWebSocket((evt: JobEvent) => {
      if (evt.type === 'new_job') {
        // If mechanic is not currently handling a job, set incoming job
        if (!currentJob && !incomingJob) {
          setIncomingJob(evt.job as Job);

          // Mobile vibration + sound to alert
          try { window.navigator.vibrate?.(200); } catch (e) {}
          try { new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg').play().catch(()=>{}); } catch(e){}

          toast.toast({ title: 'Hot job!', description: 'A new job is available — first click wins!', duration: 5000 });
        }
      }

      if (evt.type === 'job_taken') {
        const { job_id, mechanic } = evt;
        // If this job was our incoming job and someone else took it, notify and clear
        if (incomingJob && incomingJob.id === job_id) {
          // If the taken mechanic is the current mechanic, promote job to currentJob
          getMechanicProfile().then((mech) => {
            if (mech && mech.id === mechanic.id) {
              // we won it!
              setCurrentJob(incomingJob);
              setIncomingJob(null);
              toast.toast({ title: 'You won!', description: `You accepted the job — ETA ${evt.eta_minutes || 'TBD'} mins`, duration: 5000 });
            } else {
              setIncomingJob(null);
              toast.toast({ title: 'Job taken', description: `Mechanic ${mechanic.name} took the job`, duration: 4000 });
            }
          }).catch(() => {
            setIncomingJob(null);
            toast.toast({ title: 'Job taken', description: `Mechanic ${mechanic.name} took the job`, duration: 4000 });
          });
        }

        // If this was our current job and someone (shouldn't happen) took it, clear
        if (currentJob && currentJob.id === job_id) {
          setCurrentJob(null);
          toast.toast({ title: 'Job updated', description: `Job was marked taken by ${mechanic.name}`, duration: 4000 });
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
      toast.toast({ title: 'Accepted', description: 'You accepted the job — good luck!', duration: 4000 });
    } catch (err: any) {
      // Show a friendly message if someone else beat us
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
        simulateIncomingJob,
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
