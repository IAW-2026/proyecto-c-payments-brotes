/*
debe tener:
 + header
 + lista de nav-links
 + footer
*/

export default function Sidebar() {
  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col shrink-0">
      <div className="p-4 font-bold text-lg border-b border-gray-700">
        Mi App
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <a href="/" className="block px-3 py-2 rounded hover:bg-gray-700">
          Inicio
        </a>
        <a
          href="/dashboard"
          className="block px-3 py-2 rounded hover:bg-gray-700"
        >
          Dashboard
        </a>
      </nav>
    </aside>
  );
}
