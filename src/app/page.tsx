import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/constants";

// Middleware sends anonymous visitors on to /login.
export default function HomePage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
