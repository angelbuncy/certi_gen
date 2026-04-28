import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { CursorEffects } from "@/components/CursorEffects";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl gold-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">PAGE NOT FOUND</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground tracking-wider">
          GO HOME
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CertiGen" },
      { name: "description", content: "Design, generate, and mass-mail beautiful certificates from any spreadsheet." },
      { property: "og:title", content: "CertiGen" },
      { name: "twitter:title", content: "CertiGen" },
      { property: "og:description", content: "Design, generate, and mass-mail beautiful certificates from any spreadsheet." },
      { name: "twitter:description", content: "Design, generate, and mass-mail beautiful certificates from any spreadsheet." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/132cfe2b-56ea-488a-afca-fb520c1b7d95/id-preview-b2676603--4c5050e9-eb7e-4471-aeb9-c7e9c5e8833e.lovable.app-1777351034747.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/132cfe2b-56ea-488a-afca-fb520c1b7d95/id-preview-b2676603--4c5050e9-eb7e-4471-aeb9-c7e9c5e8833e.lovable.app-1777351034747.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <CursorEffects />
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
