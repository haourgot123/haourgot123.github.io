import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { currentNavigation, navigation } from './lib/navigation';

export const onRequest = defineRouteMiddleware(async (context, next) => {
  // Keep the same primary navigation after the blog plugin prepares its route data.
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
  route.sidebar = primary;
  if (currentNavigation('/blog/', context.url.pathname) &&
      !context.locals.starlightBlog.posts.some((post) => post.entry.id === route.id)) {
    route.toc = undefined;
  }
});
