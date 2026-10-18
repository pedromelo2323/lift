import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/auth", "/privacy", "/terms", "/support"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, pathname: string, from: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.includes("-auth-token"));
  // If the auth server is unreachable (gym basement), trust the cookie; RLS still guards the data.
  const signedIn = data?.claims?.sub ? true : Boolean(error) && hasSessionCookie;

  const { pathname } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!signedIn && !isPublic(pathname)) return redirectTo(request, "/auth", response);
  if (signedIn && pathname === "/auth") return redirectTo(request, "/", response);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|manifest.json|sw.js|robots.txt|.*\\.(?:png|svg|ico|jpg|jpeg|webp|webmanifest)$).*)",
  ],
};
