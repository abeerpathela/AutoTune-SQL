import type { User } from '../types';

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function isNewUser(user: User | null | undefined): boolean {
  if (!user?.createdAt) return false;
  return Date.now() - new Date(user.createdAt).getTime() < TEN_MINUTES_MS;
}

function displayName(user: User): string {
  if (user.firstName) return user.firstName;
  return user.email.split('@')[0];
}

type UserGreetingProps = {
  user: User | null;
  variant?: 'heading' | 'inline';
  className?: string;
};

export function UserGreeting({ user, variant = 'heading', className = '' }: UserGreetingProps) {
  if (!user) return null;

  const name = displayName(user);
  const greeting = isNewUser(user)
    ? `Welcome to AutoTune-SQL, ${name}!`
    : `Welcome back, ${name}!`;

  if (variant === 'inline') {
    return <span className={className}>{greeting}</span>;
  }

  return (
    <span className={className}>
      {isNewUser(user) ? (
        <>
          Welcome to AutoTune-SQL, <span className="text-primary">{name}</span>!
        </>
      ) : (
        <>
          Welcome back, <span className="text-primary">{name}</span>!
        </>
      )}
    </span>
  );
}
