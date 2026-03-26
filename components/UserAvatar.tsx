import { auth } from '@/auth';
import UserAvatarPill from './UserAvatarPill';

export default async function UserAvatar() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  return (
    <UserAvatarPill
      name={user.name ?? ''}
      email={user.email ?? ''}
      image={user.image ?? null}
      role={(user as any).role ?? 'USER'}
    />
  );
}
