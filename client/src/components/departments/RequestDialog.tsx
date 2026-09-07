import { useState } from "react";
import { X, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { FEATURE_STATUSES, FEATURE_STATUS_LABELS, type DepartmentFeature, type FeatureStatus, type FeatureInput } from "@shared/departmentFeatures";
import { FeatureFields, blankFeature } from "./FeatureFields";

export const RequestDialog = ({ departmentName, feature, onClose, onAdd, onUpdate, pending }: {
  departmentName: string; feature?: DepartmentFeature; onClose: () => void; pending: boolean;
  onAdd: (input: FeatureInput) => Promise<void>; onUpdate: (id: number, status: FeatureStatus, notes: string) => Promise<void>;
}) => {
  const [input, setInput] = useState(blankFeature);
  const [status, setStatus] = useState<FeatureStatus>(feature?.status || "submitted");
  const [notes, setNotes] = useState(feature?.teamNotes || "");
  const [error, setError] = useState("");
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError("");
    try { if (feature) await onUpdate(feature.id, status, notes); else await onAdd(input); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save your request."); }
  };
  return <Dialog open onOpenChange={open => !open && !pending && onClose()}><DialogContent className="workspace-dialog" showCloseButton={false} data-testid="feature-request-dialog">
    <DialogClose className="dialog-x icon-button" data-testid="feature-request-close" disabled={pending} aria-label="Close feature request"><X size={19} /></DialogClose>
    <div className="eyebrow" data-testid="feature-request-department">{departmentName}</div>
    <DialogTitle data-testid="feature-request-dialog-title">{feature ? feature.title : "What would help your team?"}</DialogTitle>
    <DialogDescription data-testid="feature-request-dialog-description">{feature ? "Keep the brief and development progress in one place." : "Describe a feature for the development team to review and build."}</DialogDescription>
    <form className="workspace-form" data-testid="feature-request-form" onSubmit={save}><fieldset disabled={pending}>
      {feature ? <>
        <div className="request-detail-copy" data-testid="feature-request-detail"><span className={`priority-tag priority-${feature.priority}`} data-testid="feature-request-priority">{feature.priority} priority</span><p data-testid="feature-request-description">{feature.description}</p><small data-testid="feature-request-date">Requested {new Date(feature.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</small></div>
        <label htmlFor="feature-status">Development status</label><select id="feature-status" data-testid="feature-status-select" value={status} onChange={e => setStatus(e.target.value as FeatureStatus)}>{FEATURE_STATUSES.map(value => <option key={value} value={value}>{FEATURE_STATUS_LABELS[value]}</option>)}</select>
        <label htmlFor="feature-team-notes">Development team notes</label><textarea id="feature-team-notes" data-testid="feature-team-notes-input" rows={4} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add decisions, clarifications or progress updates…" />
        <p className="form-note" data-testid="feature-status-disclaimer">This status tracks the team's work; changing it does not automatically build or activate a feature.</p>
      </> : <FeatureFields value={input} onChange={setInput} />}
      </fieldset>{error && <p className="form-error" role="alert" data-testid="feature-request-error">{error}</p>}
      <div className="workspace-form-footer"><button type="button" className="button button-ghost" disabled={pending} data-testid="feature-request-cancel" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" data-testid="feature-request-save" disabled={pending}>{pending ? "Saving…" : feature ? "Save update" : "Save request"}<Send size={15} /></button></div>
    </form>
  </DialogContent></Dialog>;
};