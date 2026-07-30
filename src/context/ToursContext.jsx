import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = 'https://backend.travellab-point.az/site-backend/v1';

const ToursContext = createContext(null);

export function ToursProvider({ children }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(API_BASE + '/tours')
      .then((res) => {
        if (!res.ok) throw new Error('tours request failed: ' + res.status);
        return res.json();
      })
      .then((data) => {
        setTours(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('ActionLog.tours.fetchFailed', err);
        setLoading(false);
        setFailed(true);
      });
  }, []);

  return (
    <ToursContext.Provider value={{ tours, loading, empty: !loading && (failed || tours.length === 0) }}>
      {children}
    </ToursContext.Provider>
  );
}

export function useTours() {
  const ctx = useContext(ToursContext);
  if (!ctx) throw new Error('useTours must be used within ToursProvider');
  return ctx;
}
