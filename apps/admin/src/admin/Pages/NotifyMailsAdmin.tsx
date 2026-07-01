import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Calendar,
  RefreshCw,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../lib/api";

const PAGE_SIZE = 5;

type NotifySubscriber = {
  id: number;
  email: string;
  type: "article" | "event";
  status: "active" | "unsubscribed";
  createdAt: string;
  updatedAt: string;
};

function StatusBadge({ status }: { status: NotifySubscriber["status"] }) {
  const isActive = status === "active";
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      {isActive ? "Active" : "Unsubscribed"}
    </span>
  );
}

function SubscriberTable({
  title,
  icon: Icon,
  rows,
  loading,
  emptyMessage,
  page,
  onPageChange,
}: {
  title: string;
  icon: typeof FileText;
  rows: NotifySubscriber[];
  loading: boolean;
  emptyMessage: string;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, rows.length);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <Icon size={20} className="text-[#0D4A7A]" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="ml-auto text-sm text-gray-500">{rows.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#eef2ff]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                Subscribed Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900">{row.email}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Showing {rangeStart} to {rangeEnd} of {rows.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => onPageChange(Math.max(0, safePage - 1))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotifyMailsAdmin() {
  const [articles, setArticles] = useState<NotifySubscriber[]>([]);
  const [events, setEvents] = useState<NotifySubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [articlePage, setArticlePage] = useState(0);
  const [eventPage, setEventPage] = useState(0);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getNotifySubscribers();
      setArticles(data.articles || []);
      setEvents(data.events || []);
    } catch {
      toast.error("Failed to load notify subscribers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    setArticlePage(0);
    setEventPage(0);
  }, [search]);

  const filterRows = useCallback(
    (rows: NotifySubscriber[]) => {
      const q = search.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter((r) => r.email.toLowerCase().includes(q));
    },
    [search]
  );

  const filteredArticles = useMemo(
    () => filterRows(articles),
    [articles, filterRows]
  );
  const filteredEvents = useMemo(() => filterRows(events), [events, filterRows]);

  const activeArticleCount = articles.filter((r) => r.status === "active").length;
  const activeEventCount = events.filter((r) => r.status === "active").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">
              Notify Mails
            </h1>
            <p className="text-gray-500 text-sm">
              Article and event notification subscribers from the database.
            </p>
          </div>
       
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Article Notify (Active)</p>
                <p className="text-3xl font-bold mt-2">{activeArticleCount}</p>
              </div>
              <FileText size={32} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Event Notify (Active)</p>
                <p className="text-3xl font-bold mt-2">{activeEventCount}</p>
              </div>
              <Calendar size={32} className="text-emerald-200" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <SubscriberTable
            title="Articles Notify Emails"
            icon={FileText}
            rows={filteredArticles}
            loading={loading}
            emptyMessage="No article notify subscribers found."
            page={articlePage}
            onPageChange={setArticlePage}
          />
          <SubscriberTable
            title="Events Notify Emails"
            icon={Calendar}
            rows={filteredEvents}
            loading={loading}
            emptyMessage="No event notify subscribers found."
            page={eventPage}
            onPageChange={setEventPage}
          />
        </div>
      </div>
    </div>
  );
}
