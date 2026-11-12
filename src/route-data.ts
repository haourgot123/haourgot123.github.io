import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { currentNavigation, navigation } from './lib/navigation';

export const onRequest = defineRouteMiddleware(async (context, next) => {
  // Run the blog plugin first, then preserve the main navigation above its topic tree.
  await next();
  const route = context.locals.starlightRoute;
  const primary = navigation.map(({ label, href }) => ({
    type: 'link' as const,
    label,
    href,
    badge: undefined,
    isCurrent: currentNavigation(href, context.url.pathname) !== undefined,
    attrs: { 'data-primary-nav': '', 'aria-current': currentNavigation(href, context.url.pathname) },
  }));
  const blogItems = currentNavigation('/blog/', context.url.pathname) !== undefined
    ? route.sidebar.filter((entry) => entry.type === 'group' ? entry.entries.length > 0 : entry.href !== '/blog/')
    : [];
  route.sidebar = [...primary, ...blogItems];
  if (currentNavigation('/blog/', context.url.pathname) &&
      !context.locals.starlightBlog.posts.some((post) => post.entry.id === route.id)) {
    route.toc = undefined;
  }
});
