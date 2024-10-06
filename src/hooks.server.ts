import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_API_KEY,
} from "$env/static/public";
import { createServerClient } from "@supabase/ssr";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_API_KEY,
    {
      cookies: {
        getAll() {
          return event.cookies.getAll();
        },
        setAll(cookiesToSet) {
          /**
           * Note: You have to add the `path` variable to the
           * set and remove method due to sveltekit's cookie API
           * requiring this to be set, setting the path to an empty string
           * will replicate previous/standard behavior (https://kit.svelte.dev/docs/types#public-types-cookies)
           */
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              event.cookies.set(name, value, { ...options, path: "/" }),
            );
          } catch {}
        },
      },
    },
  );

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      // JWT validation has failed
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};
