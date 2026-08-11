import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Briefcase, Eye, EyeOff, ArrowLeft } from "lucide-react";
import {
  useCreateUserMutation,
  useGetBlocksQuery,
  useGetSectorsQuery,
  useGetAwcsQuery,
} from "../redux/api.jsx";
import { useAuth, ROLES, ROLE_LABELS, ROLE_ORDER } from "../context/AuthContext.jsx";

const inputClass =
  "w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// Hierarchical delegation: district/block/sector can each create users, but
// only roles BELOW their own level, and only within their own branch (see
// icds-backend/controllers/userController.js createUser - scope codes
// at-or-above the creator's own level are locked server-side to the
// creator's account regardless of what this form sends, so the UI mirrors
// that by not even asking for them).
export default function AddUser() {
  const navigate = useNavigate();
  const { role: myRole, user: me } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [createUser, { isLoading: loading }] = useCreateUserMutation();

  const assignableRoles = useMemo(
    () => ROLE_ORDER.slice(ROLE_ORDER.indexOf(myRole) + 1),
    [myRole]
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: assignableRoles[0] || ROLES.AWC,
    blockCode: "",
    sectorCode: "",
    awcCode: "",
  });

  const { data: blockData } = useGetBlocksQuery();
  const { data: sectorData } = useGetSectorsQuery();
  const { data: awcData } = useGetAwcsQuery();

  const blocks = blockData?.blocks || [];
  const myRank = ROLE_ORDER.indexOf(myRole);
  const needsBlock = myRank < ROLE_ORDER.indexOf(ROLES.BLOCK) && [ROLES.BLOCK, ROLES.SECTOR, ROLES.AWC].includes(formData.role);
  const needsSector = myRank < ROLE_ORDER.indexOf(ROLES.SECTOR) && [ROLES.SECTOR, ROLES.AWC].includes(formData.role);
  const needsAwc = formData.role === ROLES.AWC;

  // When a dropdown isn't shown (because it's locked to the creator's own
  // scope), filter the level below it using the creator's own code instead
  // of the empty form field.
  const effectiveBlockCode = needsBlock ? formData.blockCode : me?.blockCode;
  const effectiveSectorCode = needsSector ? formData.sectorCode : me?.sectorCode;

  const sectors = useMemo(
    () => (sectorData?.sectors || []).filter((s) => !effectiveBlockCode || s.blockCode === effectiveBlockCode),
    [sectorData, effectiveBlockCode]
  );
  const awcs = useMemo(
    () => (awcData?.awcs || []).filter((a) => !effectiveSectorCode || a.sectorCode === effectiveSectorCode),
    [awcData, effectiveSectorCode]
  );

  function update(key, value) {
    setFormData((f) => {
      const next = { ...f, [key]: value };
      // Reset dependent codes when a higher level changes
      if (key === "role") {
        next.blockCode = "";
        next.sectorCode = "";
        next.awcCode = "";
      }
      if (key === "blockCode") {
        next.sectorCode = "";
        next.awcCode = "";
      }
      if (key === "sectorCode") {
        next.awcCode = "";
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      // POST /api/users
      await createUser(formData).unwrap();
      navigate("/applications/users");
    } catch (err) {
      setError(err?.data?.message || "Could not create the user.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/applications/users")}
          className="rounded-lg p-2 text-muted hover:bg-bg hover:text-ink"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
          <UserPlus className="text-primary" size={24} />
          Add Application User
        </h1>
      </div>

      {error && (
        <div className="rounded-2xl border border-coral/30 bg-coral-light px-4 py-3 text-sm font-semibold text-coral">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-surface p-6 shadow-card space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Name</label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Email</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Password</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Role</label>
          <div className="relative">
            <Briefcase size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={formData.role}
              onChange={(e) => update("role", e.target.value)}
              className={inputClass}
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsBlock && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Block <span className="text-coral">*</span>
            </label>
            <select
              required
              value={formData.blockCode}
              onChange={(e) => update("blockCode", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select block</option>
              {blocks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsSector && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Sector <span className="text-coral">*</span>
            </label>
            <select
              required
              value={formData.sectorCode}
              onChange={(e) => update("sectorCode", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select sector</option>
              {sectors.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsAwc && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              AWC <span className="text-coral">*</span>
            </label>
            <select
              required
              value={formData.awcCode}
              onChange={(e) => update("awcCode", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select AWC</option>
              {awcs.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-card transition-all hover:bg-primary-dark active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
