import { useState, type FormEvent } from "react";
import { households, profileInput } from "@shared/profile";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type StoredProfile = inferRouterOutputs<AppRouter>["profiles"]["mine"];

export default function ProfileForm({
  profile,
  email,
  onSaved,
}: {
  profile: StoredProfile;
  email: string;
  onSaved: () => Promise<void>;
}) {
  const save = trpc.profiles.save.useMutation();
  const [household, setHousehold] = useState(
    profile?.household ?? "Prefer not to say"
  );
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (key: string) => String(data.get(key) ?? "");
    const parsed = profileInput.safeParse({
      fullName: field("fullName"),
      phone: field("phone"),
      birthDate: field("birthDate"),
      address: field("address"),
      household,
      householdSize: field("householdSize")
        ? Number(field("householdSize"))
        : null,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0].message);
      return;
    }
    setMessage("");
    try {
      await save.mutateAsync(parsed.data);
      await onSaved();
      setMessage("Profile saved.");
    } catch {
      /* The server error is displayed below. */
    }
  }
  return (
    <form className="report-card profile-form" onSubmit={submit}>
      <h1>{profile ? "My profile" : "Welcome to the ministry"}</h1>
      <p>
        {profile
          ? "Update your personal details here."
          : "Create your member profile to open your workspace."}{" "}
        Your name is required. Share the other details you want the church to
        keep. Pastor Daniel and Pastor Phiwe can view your profile.
      </p>
      <fieldset disabled={save.isPending}>
        <div className="report-grid">
          <label>
            Full name
            <input
              autoComplete="name"
              name="fullName"
              required
              maxLength={160}
              defaultValue={profile?.fullName}
            />
          </label>
          <label>
            Account email
            <input readOnly type="email" value={email} />
          </label>
          <label>
            Mobile number
            <input
              autoComplete="tel"
              type="tel"
              name="phone"
              maxLength={32}
              defaultValue={profile?.phone}
            />
          </label>
          <label>
            Date of birth
            <input
              autoComplete="bday"
              type="date"
              name="birthDate"
              max={new Date().toLocaleDateString("sv-SE", {
                timeZone: "Africa/Johannesburg",
              })}
              defaultValue={profile?.birthDate}
            />
          </label>
          <label>
            Home address
            <textarea
              name="address"
              autoComplete="street-address"
              maxLength={350}
              defaultValue={profile?.address}
            />
          </label>
          <label>
            Household
            <select
              value={household}
              onChange={e => setHousehold(e.target.value)}
            >
              {households.map(h => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </label>
          {household === "Part of a family" && (
            <label>
              Number of people in your household
              <input
                name="householdSize"
                type="number"
                min="1"
                max="999"
                defaultValue={profile?.householdSize ?? ""}
              />
            </label>
          )}
        </div>
        <button>
          {save.isPending
            ? "Saving…"
            : profile
              ? "Save changes"
              : "Save and open workspace"}
        </button>
      </fieldset>
      <p role="status">{save.error?.message || message}</p>
    </form>
  );
}

export function MemberLookup() {
  const [email, setEmail] = useState("");
  const result = trpc.profiles.findByEmail.useQuery(email, {
    enabled: !!email,
    retry: false,
  });
  return (
    <section className="report-card">
      <h1>Member records</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("email"))
            .trim()
            .toLowerCase();
          if (value === email) void result.refetch();
          else setEmail(value);
        }}
      >
        <label>
          Find a member by account email
          <input name="email" type="email" required maxLength={254} />
        </label>
        <button>Find profile</button>
      </form>
      {email &&
        (result.isFetching ? (
          <p role="status">Searching…</p>
        ) : result.error ? (
          <p role="alert">{result.error.message}</p>
        ) : result.data ? (
          <dl>
            {Object.entries({
              "Full name": result.data.profile.fullName,
              "Account email": result.data.email,
              "Mobile number": result.data.profile.phone,
              "Date of birth": result.data.profile.birthDate,
              "Home address": result.data.profile.address,
              Household: result.data.profile.household,
              "Household size": result.data.profile.householdSize,
            })
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        ) : (
          <p role="status">No completed profile for this email.</p>
        ))}
    </section>
  );
}
