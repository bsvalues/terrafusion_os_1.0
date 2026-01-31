#!/usr/bin/env node
// Fixture: File with shebang, should insert "use client" after
import { useRouter } from 'next/navigation';

export function NavigationButton() {
  const router = useRouter();
  return <button onClick={() => router.push('/home')}>Go Home</button>;
}
