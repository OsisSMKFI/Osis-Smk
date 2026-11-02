import { redirect } from 'next/navigation';

export default function LegacyPiketRosterPage() {
  redirect('/admin/attendance/roster');
}
