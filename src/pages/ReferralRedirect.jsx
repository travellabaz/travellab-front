import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { setReferralId } from '../utils/referral';

// /r/:code — referral links point here. Stores the code and bounces to home;
// it's picked up later at actual signup time (register() / googleLogin()),
// not here, since a visitor might browse for a while before signing up.
export default function ReferralRedirect() {
  const { code } = useParams();

  useEffect(() => {
    setReferralId(code);
  }, [code]);

  return <Navigate to="/" replace />;
}
