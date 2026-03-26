import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import NavActions from '@/components/NavActions';
import LandingPage from '@/app/_landing';

export default async function Page() {
  const session = await auth();

  // Already logged in — skip the landing page entirely
  if (session?.user) redirect('/dashboard');

  return <LandingPage navActions={<NavActions />} />;
}
