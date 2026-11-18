import { useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mic, Video, PlayCircle, Plus, MoreHorizontal, ChevronRight, Send, Sparkles } from "lucide-react";

export default function SermonsView() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [preacher, setPreacher] = useState(user?.name || "");
  const [serviceDate, setServiceDate] = useState(new Date().toLocaleDateString("sv-SE"));
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "both">("both");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [sermonId, setSermonId] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sermonQuery = trpc.sermons.list.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const recordMutation = trpc.sermons.record.useMutation();
  const distributeMutation = trpc.sermons.distribute.useMutation();

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return toast.error("Recording is not available in this browser");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); stream.getTracks().forEach(track => track.stop()); };
      recorder.start(); recorderRef.current = recorder; setRecording(true); toast.success("Recording started", { description: "Speak naturally. You can stop when the sermon is complete." });
    } catch { toast.error("Microphone access was not granted", { description: "Allow microphone access to record a sermon." }); }
  };
  const stopRecording = () => { recorderRef.current?.stop(); recorderRef.current = null; setRecording(false); };
  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
  const transcribe = async () => {
    if (!audioBlob) return toast.error("Record the sermon first");
    if (!user?.role) return toast.info("Sign in as a leader to save and transcribe recordings");
    try {
      const encodedAudio = await blobToDataUrl(audioBlob);
      const encodedVideo = videoFile ? await blobToDataUrl(videoFile) : undefined;
      const result = await recordMutation.mutateAsync({ title, preacher, serviceDate: new Date(`${serviceDate}T10:00:00`), audioBase64: encodedAudio, audioMimeType: audioBlob.type || "audio/webm", videoUrl: videoFile ? "" : videoUrl, videoBase64: encodedVideo, videoMimeType: videoFile?.type });
      setTranscript(result?.transcript || "Transcript ready. The sermon recording has been saved.");
      setHighlights(result?.highlights ? JSON.parse(result.highlights) : ["Transcript ready for review", "Key sermon themes will appear here"]);
      setSermonId(result?.id ?? null); toast.success("Transcript and highlights ready", { description: "Review the highlights before sharing them." });
    } catch (error) { toast.error("Transcription could not be completed", { description: error instanceof Error ? error.message : "Try recording again." }); }
  };
  const distribute = () => { if (!sermonId) return toast.info("Save the transcript before distributing highlights"); distributeMutation.mutate({ id: sermonId, channel, paymentLink: "" }, { onSuccess: () => toast.success("Highlights queued", { description: `${channel === "both" ? "Email and WhatsApp" : channel} distribution is ready.` }) }); };
  const existingSermons = sermonQuery.data ?? [];
  return <ModuleLayout eyebrow="MESSAGE & MEMORY" title="Sermons" description="Record preaching once, turn it into a searchable transcript, and share the strongest highlights with your church family." action={recording ? "Stop recording" : "Start recording"} onAction={recording ? stopRecording : startRecording}><div className="sermon-explainer"><div className="sermon-explainer-icon"><Mic size={19} /></div><div><div className="eyebrow">A SIMPLE LEADER WORKFLOW</div><h2>Record → transcribe → share</h2><p>Audio is required for transcription. Leaders can add a video link or upload a video when they want members to watch the full message.</p></div><span className={`recording-state ${recording ? "live" : ""}`}><i />{recording ? "Recording now" : "Ready to record"}</span></div><div className="sermon-layout"><div className="panel sermon-recorder-panel"><div className="panel-heading"><div><div className="eyebrow">SERMON DETAILS</div><h2>{audioBlob ? "Recording captured" : "Prepare a recording"}</h2></div><span className="channel-badge"><Mic size={14} />Audio + transcript</span></div><div className="sermon-form"><label>Sermon title<input value={title} onChange={event => setTitle(event.target.value)} /></label><div className="sermon-form-grid"><label>Preacher<input value={preacher} onChange={event => setPreacher(event.target.value)} /></label><label>Service date<input type="date" value={serviceDate} onChange={event => setServiceDate(event.target.value)} /></label></div><label>Optional video link <span className="label-hint">YouTube, Vimeo, or church video URL</span><input value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://..." /></label><label className="video-upload-label">Or upload a video <span className="label-hint">Optional · up to 100MB</span><input type="file" accept="video/*" onChange={event => setVideoFile(event.target.files?.[0] ?? null)} /></label>{videoFile && <div className="video-file-note"><Video size={15} /><span>{videoFile.name} selected for upload</span></div>}{audioUrl ? <div className="audio-preview"><PlayCircle size={17} /><div><strong>Audio recording ready</strong><span>Listen before requesting the transcript.</span></div><audio controls src={audioUrl} /></div> : <div className="record-dropzone"><Mic size={20} /><strong>Record the sermon from this browser</strong><span>Use a quiet room and keep the tab open while recording.</span><button className="button button-primary" onClick={startRecording}><Mic size={15} />{recording ? "Recording…" : "Record audio"}</button></div>}<button className="button button-primary wide-button" disabled={!audioBlob || recordMutation.isPending} onClick={transcribe}>{recordMutation.isPending ? "Transcribing…" : "Generate transcript & highlights"}<Sparkles size={15} /></button></div></div><div className="panel sermon-output-panel"><div className="panel-heading"><div><div className="eyebrow">AI-ASSISTED NOTES</div><h2>Transcript & highlights</h2></div><span className="status-badge status-gold">{transcript ? "Ready" : "Waiting"}</span></div>{transcript ? <><div className="transcript-box"><strong>Transcript</strong><p>{transcript}</p></div><div className="highlight-box"><div className="highlight-heading"><strong>Shareable highlights</strong><span>{highlights.length} points</span></div>{highlights.map((highlight, index) => <div className="highlight-row" key={`${highlight}-${index}`}><span>{index + 1}</span><p>{highlight}</p></div>)}</div><div className="distribution-box"><div><strong>Distribute to members</strong><span>Send the highlight summary with a link to the full message.</span></div><select value={channel} onChange={event => setChannel(event.target.value as "email" | "whatsapp" | "both")}><option value="both">Email + WhatsApp</option><option value="email">Email only</option><option value="whatsapp">WhatsApp only</option></select><button className="button button-primary" onClick={distribute}><Send size={14} />Share highlights</button></div></> : <div className="sermon-empty"><Sparkles size={23} /><strong>Your transcript will appear here</strong><span>After recording, ChurchFlow will prepare the full text and extract concise highlights for sharing.</span></div>}</div></div><div className="panel recent-sermons-panel"><div className="panel-heading"><div><div className="eyebrow">SERMON LIBRARY</div><h2>Recent messages</h2></div><button className="text-button">View all <ChevronRight size={15} /></button></div>{existingSermons.length ? existingSermons.slice(0, 4).map(sermon => <div className="sermon-library-row" key={sermon.id}><span className="sermon-library-icon"><PlayCircle size={15} /></span><div><strong>{sermon.title}</strong><span>{sermon.preacher} · {new Date(sermon.serviceDate).toLocaleDateString()}</span></div><span className="status-badge status-green">{sermon.status}</span><button className="icon-button"><MoreHorizontal size={16} /></button></div>) : <div className="library-empty">No saved sermons yet. Your first recording will appear here.</div>}</div></ModuleLayout>;
}

function ModuleLayout({ eyebrow, title, description, action, onAction, children }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) {
  return <section className="module-view"><div className="module-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><button className="button button-primary" onClick={onAction}><Plus size={17} />{action}</button></div>{children}</section>;
}
