import { getCurrentUser } from "../user-actions";
import { redirect } from "next/navigation";
import ProfileLayoutClient from "./ProfileLayoutClient";

export default async function ProfileLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileLayoutClient user={user}>
      {children}
    </ProfileLayoutClient>
  );
}
