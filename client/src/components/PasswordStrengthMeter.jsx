import { useMemo } from 'react';

export default function PasswordStrengthMeter({ password, confirmPassword }) {
  const rules = useMemo(() => {
    return [
      { label: 'Min 8 characters', pass: password.length >= 8 },
      { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
      { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
      { label: 'Number', pass: /\d/.test(password) },
      { label: 'Special character', pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
    ];
  }, [password]);

  const passedCount = rules.filter((r) => r.pass).length;
  const strength = passedCount <= 1 ? 0 : passedCount <= 2 ? 1 : passedCount <= 3 ? 2 : passedCount <= 4 ? 3 : 4;

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColor = [
    'var(--error)',
    'var(--warning)',
    '#ca8a04',
    'var(--success)',
    '#059669',
  ];

  const match = confirmPassword ? password === confirmPassword : null;

  return (
    <div className="password-strength">
      {password && (
        <>
          <div className="strength-bars">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="strength-bar"
                style={{
                  width: `${20}%`,
                  background: i <= strength ? strengthColor[strength] : 'var(--border)',
                }}
              />
            ))}
          </div>
          <span className="strength-label" style={{ color: strengthColor[strength] }}>
            {strengthLabel[strength]}
          </span>
          <div className="strength-rules">
            {rules.map((rule, i) => (
              <span key={i} className={rule.pass ? 'rule-pass' : 'rule-fail'}>
                {rule.pass ? '✓' : '○'} {rule.label}
              </span>
            ))}
          </div>
        </>
      )}
      {confirmPassword && (
        <span className={match ? 'match-ok' : 'match-bad'} style={{ marginTop: '4px', display: 'block', fontSize: '12px' }}>
          {match ? '✓ Passwords match' : '✗ Passwords do not match'}
        </span>
      )}
    </div>
  );
}
