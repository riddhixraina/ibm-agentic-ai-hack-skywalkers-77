import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';

export function useHealthCheck(interval = 5000) {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthAPI.check();
        setIsHealthy(response.data?.status === 'ok');
        setLastCheck(new Date());
        setIsChecking(false);
      } catch (error) {
        console.warn('Health check failed:', error);
        setIsHealthy(false);
        setLastCheck(new Date());
        setIsChecking(false);
      }
    };

    // Initial check
    checkHealth();

    // Poll periodically
    const healthInterval = setInterval(checkHealth, interval);

    return () => clearInterval(healthInterval);
  }, [interval]);

  return { isHealthy, isChecking, lastCheck };
}

