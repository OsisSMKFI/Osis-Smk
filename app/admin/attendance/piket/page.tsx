import { redirect } from 'next/navigation';

export default function LegacyPiketPage() {
  redirect('/admin/attendance?tab=piket');
}
