import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJob } from '@/contexts/JobContext';
import { updateAvailability, updateLocation } from '@/services/api';
import { User, MapPin, Bell, BellOff, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeScreen: React.FC = () => {
  const { mechanic } = useAuth();
  const { currentJob, incomingJob, simulateIncomingJob } = useJob();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(mechanic?.is_available ?? false);
  const [isToggling, setIsToggling] = useState(false);

  // Navigate to active job if exists
  useEffect(() => {
    if (currentJob) {
      navigate('/job');
    }
  }, [currentJob, navigate]);

  // Navigate to incoming job modal
  useEffect(() => {
    if (incomingJob) {
      navigate('/incoming');
    }
  }, [incomingJob, navigate]);

  // Location tracking when online
  useEffect(() => {
    if (!isOnline) return;

    const updateLocationPeriodically = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn('Location error:', error.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    };

    // Initial update
    updateLocationPeriodically();

    // Update every 30 seconds
    const interval = setInterval(updateLocationPeriodically, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const handleToggleAvailability = async () => {
    setIsToggling(true);
    try {
      const newStatus = !isOnline;
      await updateAvailability(newStatus);
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Failed to update availability:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{mechanic?.name}</h1>
              <p className="text-sm text-muted-foreground">{mechanic?.specialty}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="View profile"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4">
        {/* Status Card */}
        <div className="card-industrial p-6">
          <div className="flex flex-col items-center text-center">
            {/* Status Indicator */}
            <div className="relative mb-4">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                  isOnline ? 'bg-success/15' : 'bg-muted'
                }`}
              >
                {isOnline ? (
                  <div className="relative">
                    <Bell className="w-10 h-10 text-success" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full status-pulse" />
                  </div>
                ) : (
                  <BellOff className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Status Text */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {isOnline ? 'Online' : 'Offline'}
              </h2>
              <p className="text-muted-foreground">
                {isOnline
                  ? 'Waiting for job requests...'
                  : 'Go online to receive jobs'}
              </p>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`w-full btn-touch flex items-center justify-center gap-2 ${
                isOnline
                  ? 'bg-muted text-foreground hover:bg-muted/80'
                  : 'bg-success text-success-foreground hover:bg-success/90'
              }`}
            >
              {isToggling ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isOnline ? (
                <>
                  <BellOff className="w-5 h-5" />
                  Go Offline
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Go Online
                </>
              )}
            </button>
          </div>
        </div>

        {/* Location Card */}
        {isOnline && (
          <div className="card-industrial p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Location Active</p>
                <p className="text-xs text-muted-foreground">
                  Sharing your location with the system
                </p>
              </div>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Demo Button - Simulate Incoming Job */}
        {isOnline && (
          <button
            onClick={simulateIncomingJob}
            className="mt-auto flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-accent/30 text-accent hover:bg-accent/5 transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span className="font-medium">Demo: Simulate Job Request</span>
          </button>
        )}
      </main>
    </div>
  );
};

export default HomeScreen;
