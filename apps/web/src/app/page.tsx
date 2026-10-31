import { GlobalDashboard } from '@/components/dashboard/global-dashboard';
import { getGlobalDashboard } from '@/lib/projects-api';

export default async function Home() {
  return <GlobalDashboard dashboard={await getGlobalDashboard()} />;
}
