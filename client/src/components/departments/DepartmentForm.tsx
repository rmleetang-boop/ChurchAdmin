import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { BRANCHES } from "@/data/demo";
import { departmentInput, type DepartmentInput } from "@shared/departmentFeatures";
import { blankFeature, FeatureFields } from "./FeatureFields";

export const DepartmentForm = ({ open, onClose, onSave, pending, branchId, isSample }: {
  open: boolean; onClose: () => void; onSave: (draft: DepartmentInput) => Promise<void>; pending: boolean; branchId: number; isSample: boolean;
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<DepartmentInput>({ name: "", leadName: "", branchId, description: "", features: [blankFeature()] });
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (step === 1) { setStep(2); return; }
    const parsed = departmentInput.safeParse(draft);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    try { await onSave(parsed.data); onClose(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save. Please try again."); }
  };
  return <Dialog open={open} onOpenChange={value => !value && !pending && onClose()}><DialogContent className="workspace-dialog" showCloseButton={false} data-testid="department-create-dialog">
    <DialogClose className="dialog-x icon-button" data-testid="department-form-close" disabled={pending} aria-label="Close department form"><X size={19} /></DialogClose>
    <div className="eyebrow" data-testid="department-form-step">STEP {step} OF 2 · DEPARTMENT SETUP</div>
    <DialogTitle data-testid="department-form-title">{step === 1 ? "A place for your ministry." : "Tell us what your team needs."}</DialogTitle>
    <DialogDescription data-testid="department-form-description">{step === 1 ? "Give your department a name, a home branch and a leader." : "Describe the features in your own words. Your development team can review the brief and build them."}</DialogDescription>
    <div className="form-step-track" aria-hidden="true"><i /><i className={step === 2 ? "complete" : ""} /></div>
    <form onSubmit={submit} className="workspace-form" data-testid="department-create-form">
      <fieldset disabled={pending}>
      {step === 1 ? <>
        <label htmlFor="department-name">Department name *</label><input id="department-name" data-testid="department-name-input" autoFocus required minLength={2} maxLength={160} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Youth Ministry" />
        <div className="form-two-col"><div><label htmlFor="department-branch">Branch *</label><select id="department-branch" data-testid="department-branch-select" value={draft.branchId} onChange={e => setDraft({ ...draft, branchId: Number(e.target.value) })}>{BRANCHES.map((branch, i) => <option key={branch} value={i + 1}>{branch}</option>)}</select></div><div><label htmlFor="department-lead">Department leader *</label><input id="department-lead" data-testid="department-lead-input" required minLength={2} maxLength={160} value={draft.leadName} onChange={e => setDraft({ ...draft, leadName: e.target.value })} placeholder="e.g. Nadine Mukendi" /></div></div>
        <label htmlFor="department-purpose">Purpose <small>Optional</small></label><textarea id="department-purpose" data-testid="department-purpose-input" maxLength={1000} rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="What does this department do for your church family?" />
      </> : <>
        <div className="department-brief-summary" data-testid="department-brief-summary"><strong>{draft.name}</strong><span>{BRANCHES[draft.branchId - 1]} · {draft.leadName}</span></div>
        {draft.features.map((feature, i) => <FeatureFields key={i} index={i} value={feature} onChange={next => setDraft({ ...draft, features: draft.features.map((f, j) => i === j ? next : f) })} onRemove={draft.features.length > 1 ? () => setDraft({ ...draft, features: draft.features.filter((_, j) => i !== j) }) : undefined} />)}
        {draft.features.length < 10 && <button type="button" className="button button-ghost add-feature-field" data-testid="add-another-feature" onClick={() => setDraft({ ...draft, features: [...draft.features, blankFeature()] })}><Plus size={16} />Add another feature</button>}
        <p className="form-note" data-testid="department-request-disclaimer">{isSample ? "Saved in this browser's sample workspace. Export the brief to share with your development team." : "Requests are saved for review. New features become available only after your development team builds them."}</p>
      </>}
      </fieldset>
      {error && <p className="form-error" role="alert" data-testid="department-form-error">{error}</p>}
      <div className="workspace-form-footer"><button type="button" className="button button-ghost" data-testid="department-form-back" disabled={pending} onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 2 && <ArrowLeft size={15} />}{step === 1 ? "Cancel" : "Back"}</button><button type="submit" className="button button-primary" data-testid="department-form-submit" disabled={pending}>{pending ? "Saving…" : step === 1 ? "Define features" : "Create department"}{step === 1 ? <ArrowRight size={16} /> : <Send size={15} />}</button></div>
    </form>
  </DialogContent></Dialog>;
};