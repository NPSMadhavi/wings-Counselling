import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-xs mb-4">WINGS</p>
        <h1 className="text-4xl font-bold text-white mb-4">Page not found</h1>
        <p className="text-gray-400 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <span className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-white font-medium">
              Go Home
            </span>
          </Link>
          <Link href="/career">
            <span className="inline-flex items-center justify-center rounded-xl border border-purple-500/30 px-6 py-3 text-purple-300 font-medium">
              Browse Careers
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
