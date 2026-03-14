'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/app/i18n/navigation';

const navClass =
  'min-h-[44px] inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:outline-none';

export function AuthNavItem() {
  const { status } = useSession();
  const tc = useTranslations('common');

  if (status === 'loading') {
    return (
      <li>
        <span className={`${navClass} opacity-50 cursor-default`}>…</span>
      </li>
    );
  }

  if (status === 'authenticated') {
    return (
      <li>
        <button onClick={() => signOut({ callbackUrl: '/' })} className={`${navClass} cursor-pointer`}>
          {tc('actions.signOut')}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href="/login" className={navClass}>
        {tc('actions.signIn')}
      </Link>
    </li>
  );
}
