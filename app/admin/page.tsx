import { cookies } from "next/headers";
import AdminLoginForm from "./AdminLoginForm";
import AdminDashboard from "./AdminDashboard";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const getSupabase = require("@/lib/db");

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  const isAuthenticated = session?.value === "authenticated";

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  const supabase = getSupabase();
  const [{ data: testimonials }, { data: bookings }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("id, name, rating, comment, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, name, mobile, email_id, pickup_datetime, service, car, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminDashboard
      testimonials={testimonials ?? []}
      bookings={bookings ?? []}
    />
  );
}
