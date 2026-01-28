import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Job, JobStatus } from '@/types/mechanic';
import { acceptJob as apiAcceptJob, rejectJob as apiRejectJob, updateJobStatus as apiUpdateJobStatus } from '@/services/api';

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

  const acceptJob = useCallback(async () => {
    if (!incomingJob) return;
    setIsProcessing(true);
    try {
      const job = await apiAcceptJob(incomingJob.id);
      setCurrentJob(job);
      setIncomingJob(null);
    } finally {
      setIsProcessing(false);
    }
  }, [incomingJob]);

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

  // Demo: simulate an incoming job request with attachments
  const simulateIncomingJob = useCallback(() => {
    const demoJob: Job = {
      id: Math.floor(Math.random() * 10000),
      vehicle_type: 'Honda Accord 2019',
      problem_description: 'Engine won\'t start - possible battery issue. The car was working fine yesterday but this morning it just clicks when I turn the key.',
      attachments: [
        {
          id: 'demo-img-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
          filename: 'engine_bay.jpg',
          mime_type: 'image/jpeg',
        },
        {
          id: 'demo-img-2',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
          filename: 'battery.jpg',
          mime_type: 'image/jpeg',
        },
        {
          id: 'demo-audio-1',
          type: 'audio',
          url: 'https://www.soundjay.com/transportation/sounds/car-engine-start-1.mp3',
          filename: 'engine_sound.mp3',
          mime_type: 'audio/mpeg',
        },
        {
          id: 'demo-doc-1',
          type: 'document',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          filename: 'service_history.pdf',
          mime_type: 'application/pdf',
        },
      ],
      customer_location: 'Victoria Island, Lagos - Near Eko Hotel',
      customer_latitude: 6.4281,
      customer_longitude: 3.4219,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setIncomingJob(demoJob);
  }, []);

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
