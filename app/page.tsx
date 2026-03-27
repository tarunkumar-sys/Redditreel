import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import NavActions from '@/components/NavActions';
import LandingPage from '@/app/_landing';

export default async function Page() {
  const session = await auth();

  if (session?.user) {
    // Role-based redirect — admin goes straight to admin panel
    const role = (session.user as any).role;
    redirect(role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  return <LandingPage navActions={<NavActions />} />;
}
