import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Grid Forge</h1>
        <p className="text-gray-400 mb-8">AI-powered SCADA Screen Generator</p>
        <Link
          href="/poc"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          PoC Editor
        </Link>
      </div>
    </div>
  );
}
