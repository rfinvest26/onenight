import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useReferral() {
  const [searchParams] = useSearchParams();
  const [refId, setRefId] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params first
    const urlRef = searchParams.get('ref');
    const urlCountry = searchParams.get('country');

    if (urlRef) {
      localStorage.setItem('escort_ref', urlRef);
      setRefId(urlRef);
    } else {
      setRefId(localStorage.getItem('escort_ref'));
    }

    if (urlCountry) {
      localStorage.setItem('escort_country', urlCountry);
      setCountry(urlCountry.toLowerCase());
    } else {
      setCountry(localStorage.getItem('escort_country')?.toLowerCase() || null);
    }
  }, [searchParams]);

  return { refId, country };
}
