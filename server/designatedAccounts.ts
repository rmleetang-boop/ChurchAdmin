import { createHash } from "node:crypto";
import { z } from "zod";
import { upsertUser, getDb } from "./db";

type Designation = "Pastor Daniel" | "Pastor Phiwe" | "Technical administrator";
const designations = new Map<string, Designation>([
  ["dbc097e2a2d6d3b4a391d0e29184bdc7771bc86cb76e9122dde00c90b927214f","Pastor Phiwe"],
  ["1c3f3162b56abb65953a9a0adce9956015beacc04a40e3f5ef7cedf762415dbc","Pastor Phiwe"],
  ["cc846c24a6cc45347dff3ad17b8ca0eb681b6a5e6581b96372bd9ddcfa29b447","Pastor Daniel"],
  ["201a1baeea109140c4682e71028a146bbd2003764a926c697fcd4b692129524a","Technical administrator"],
]);
function digest(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
type Identity = {openId:string;email:string|null;loginMethod:string|null};
export function designation(user?: Identity | null) {
  if (!user?.email || !user.openId.startsWith("ghop:")) return undefined;
  const key = digest(user.email);
  if (user.loginMethod !== "otp:" + key.slice(0,48)) return undefined;
  return designations.get(key);
}
// Called only after the provider accepts a signup or recovery code.
export async function approveMailbox(email:string, user?:{id?:string;email?:string}) {
  const key=digest(email);
  if (!designations.has(key)) return;
  if (!user?.id || !z.string().uuid().safeParse(user.id).success || user.email?.toLowerCase()!==email || !await getDb())
    throw new Error("Account activation is unavailable. Try password recovery once the database is connected.");
  await upsertUser({openId:"ghop:"+user.id,email,loginMethod:"otp:"+key.slice(0,48)});
}
