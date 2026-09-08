import Dashboard from './dashboard';
import baseline from '@/lib/baseline.json';
import type { Snapshot } from '@/lib/portfolio';
export default function Home() {
  return <Dashboard initial={baseline as Snapshot} />;
}
