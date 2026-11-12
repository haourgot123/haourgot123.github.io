export const navigation = [
  { label: 'Bài viết', href: '/blog/' },
  { label: 'Chủ đề', href: '/chu-de/' },
  { label: 'Giới thiệu', href: '/gioi-thieu/' },
];

export function currentNavigation(href: string, pathname: string): 'page' | 'true' | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (path === href) return 'page';
  if (href === '/blog/' && path.startsWith('/blog/')) return 'true';
  return undefined;
}
