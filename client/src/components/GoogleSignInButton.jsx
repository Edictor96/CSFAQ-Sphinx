import { useEffect, useRef } from 'react';

const CLIENT_ID = '411209099641-5vc33p4ukqnmoo4h1tuvduc323hhc7jl.apps.googleusercontent.com';

export default function GoogleSignInButton({ onSuccess, onError, text = 'Sign in with Google' }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.('Google sign-in failed');
            }
          },
          auto_select: false,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: text.includes('Sign up') ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          width: buttonRef.current.offsetWidth || 360,
        });
      }
    };

    script.onerror = () => {
      onError?.('Failed to load Google Sign-In');
    };

    return () => {
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existing && document.body.contains(existing)) {
        document.body.removeChild(existing);
      }
    };
  }, [onSuccess, onError, text]);

  return (
    <div ref={buttonRef} className="google-btn-wrapper" />
  );
}
