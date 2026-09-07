import { Trash2 } from "lucide-react";
import type { FeatureInput } from "@shared/departmentFeatures";

export const FeatureFields = ({ value, onChange, index = 0, onRemove }: {
  value: FeatureInput; onChange: (value: FeatureInput) => void; index?: number; onRemove?: () => void;
}) => <fieldset className="feature-fields" data-testid={`feature-fields-${index}`}>
  <div className="feature-fields-heading"><span data-testid={`feature-number-${index}`}>FEATURE {String(index + 1).padStart(2, "0")}</span>{onRemove && <button type="button" className="icon-button" data-testid={`remove-feature-${index}`} aria-label={`Remove feature ${index + 1}`} onClick={onRemove}><Trash2 size={16} /></button>}</div>
  <label htmlFor={`feature-title-${index}`}>Feature name <span aria-hidden="true">*</span></label>
  <input id={`feature-title-${index}`} data-testid={`feature-title-${index}`} required minLength={3} maxLength={120} value={value.title} onChange={e => onChange({ ...value, title: e.target.value })} placeholder="e.g. Volunteer availability calendar" />
  <label htmlFor={`feature-description-${index}`}>What should it do? <span aria-hidden="true">*</span></label>
  <textarea id={`feature-description-${index}`} data-testid={`feature-description-${index}`} required minLength={10} maxLength={2000} rows={3} value={value.description} onChange={e => onChange({ ...value, description: e.target.value })} placeholder="Describe who will use it, what they need to do, and the result you expect." />
  <label htmlFor={`feature-priority-${index}`}>Priority</label>
  <select id={`feature-priority-${index}`} data-testid={`feature-priority-${index}`} value={value.priority} onChange={e => onChange({ ...value, priority: e.target.value as FeatureInput["priority"] })}><option value="low">Low · Nice to have</option><option value="medium">Medium · Helps our team</option><option value="high">High · Essential for our work</option></select>
</fieldset>;

export const blankFeature = (): FeatureInput => ({ title: "", description: "", priority: "medium" });