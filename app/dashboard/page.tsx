import UserAvatar from '@/components/UserAvatar';
import DashboardPage from '@/app/dashboard/_dashboard';

export default function Page() {
  return <DashboardPage avatar={<UserAvatar />} />;
}
