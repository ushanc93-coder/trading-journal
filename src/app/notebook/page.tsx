"use client";

import {  useState, useRef, useEffect } from "react";
import { useNotebook, Note } from "@/lib/useNotebook";
import DatePickerDropdown from "@/components/DatePickerDropdown";
import { Check } from "lucide-react";
import { useSettingsContext } from "@/lib/SettingsContext";
import { Plus, Trash2, CalendarDays, Search, Save, X, Image as ImageIcon, FileText, LayoutGrid, ChevronLeft, Sparkles, Loader2 , ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import NotesCalendar from "@/components/NotesCalendar";
import { useConfirm } from "@/lib/ConfirmContext";
import ReactMarkdown from "react-markdown";

const CATEGORIES = [
  { 
    name: "Educational", 
    borderActive: "border-amber-600", 
    bgActive: "bg-amber-500/10",
    textActive: "text-amber-600",
    hoverBorder: "hover:border-amber-500/50",
    glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]",
    tableRowGlow: "hover:bg-amber-500/5 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
  },
  { 
    name: "Strategy", 
    borderActive: "border-purple-600", 
    bgActive: "bg-purple-500/10",
    textActive: "text-purple-600",
    hoverBorder: "hover:border-purple-500/50",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]",
    tableRowGlow: "hover:bg-purple-500/5 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
  },
  { 
    name: "Personal", 
    borderActive: "border-emerald-600", 
    bgActive: "bg-emerald-500/10",
    textActive: "text-emerald-600",
    hoverBorder: "hover:border-emerald-500/50",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]",
    tableRowGlow: "hover:bg-emerald-500/5 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
  },
  { 
    name: "Goals", 
    borderActive: "border-blue-600", 
    bgActive: "bg-blue-500/10",
    textActive: "text-blue-600",
    hoverBorder: "hover:border-blue-500/50",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]",
    tableRowGlow: "hover:bg-blue-500/5 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
  }
];

export default function NotebookPage() {
  const { notes, saveNote, deleteNote, isLoaded } = useNotebook();
  const { confirm, alert } = useConfirm();
  const { preferences } = useSettingsContext();
  
  const [activeCategory, setActiveCategory] = useState<string>("Educational");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [motivationalQuote, setMotivationalQuote] = useState<{ topic: string, text: string } | null>(null);
  
  // Fetch AI motivation on mount
  useEffect(() => {
    if (!preferences?.geminiApiKey) return;
    let isMounted = true;
    
    const fetchQuote = async () => {
      try {
        const promptText = `Provide a powerful daily inspiration for a day trader. Relate it to trading discipline, patience, or overcoming greed. Since the user is a Christian, seamlessly weave in a subtle biblical principle or a short verse that fits perfectly with these trading concepts.
        You MUST format your response exactly like this:
        Topic: [A short 2-5 word title for today's inspiration]
        Quote: [1-2 sentences of explanation or motivation]
        Do NOT use any markdown. Just those two lines.`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${preferences.geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (isMounted && res.ok && text) {
          const topicMatch = text.match(/Topic:\s*(.*)/i);
          const quoteMatch = text.match(/Quote:\s*(.*)/i);
          if (topicMatch && quoteMatch) {
            setMotivationalQuote({
              topic: topicMatch[1].trim(),
              text: quoteMatch[1].trim()
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch quote", e);
      }
    };
    fetchQuote();
    return () => { isMounted = false; };
  }, [preferences?.geminiApiKey]);

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("Educational");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined);
  const [editCoverPosition, setEditCoverPosition] = useState<number>(50);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const dragRef = useRef({ isDragging: false, startY: 0, startPos: 50 });
  const [editDate, setEditDate] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleDiscard = () => {
    if (activeNoteId) deleteNote(activeNoteId);
    setActiveNoteId(null);
    setSaveError(null);
  };

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const autoSummarizeQueue = useRef<string | null>(null);

  useEffect(() => {
    if (activeNoteId && autoSummarizeQueue.current === activeNoteId && editContent && !isSummarizing) {
      autoSummarizeQueue.current = null;
      // Using setTimeout to defer execution slightly in case of state batching issues
      setTimeout(() => generateSummary(), 0);
    }
  }, [activeNoteId, editContent, isSummarizing]);

  if (!isLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading workspace...</div>;

  const filteredNotes = notes.filter(n => (n.category || "Educational") === activeCategory);

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    
    // Clean up bugged summaries that saved error text to the database
    let validSummary = note.aiSummary;
    if (validSummary && (validSummary.startsWith("Failed to generate summary") || validSummary.startsWith("Error generating summary") || validSummary.includes("Quota exceeded"))) {
      validSummary = undefined;
    }
    
    setAiSummary(validSummary || null);
    setAiError(null);
    setIsSummarizing(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category || "Educational");
    setEditImages(note.images || []);
    setEditCoverImage(note.coverImage);
    setEditCoverPosition(note.coverPosition ?? 50);
    setIsRepositioning(false);
    try {
      setEditDate(format(parseISO(note.updatedAt), "yyyy-MM-dd'T'HH:mm"));
    } catch {
      setEditDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
    
    if (note.content.trim() && !note.aiSummary) {
      autoSummarizeQueue.current = note.id;
    }
  };

  const handleCreateNote = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newNote: Note = {
      id: newId,
      title: "Untitled Note",
      content: "",
      category: activeCategory,
      updatedAt: new Date().toISOString(),
      images: []
    };
    saveNote(newNote);
    handleSelectNote(newNote);
    setEditDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSave = () => {
    if (!activeNoteId) return;
    
    let isoDate;
    try {
      isoDate = new Date(editDate).toISOString();
    } catch {
      isoDate = new Date().toISOString();
    }

    saveNote({
      id: activeNoteId,
      title: editTitle || "Untitled Note",
      content: editContent,
      category: editCategory,
      images: editImages,
      coverImage: editCoverImage,
      coverPosition: editCoverPosition,
      updatedAt: isoDate,
      aiSummary: aiSummary || undefined
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      message: "Are you sure you want to delete this note?",
      danger: true
    });
    if (ok) {
      deleteNote(id);
      if (activeNoteId === id) setActiveNoteId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      await alert({ message: "File size exceeds 5MB limit." });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (isCover) {
          setEditCoverImage(data.url);
            setEditCoverPosition(50);
        } else {
          setEditImages(prev => [...prev, data.url]);
        }
        // Auto save
        if (activeNoteId) {
          saveNote({
            id: activeNoteId,
            title: editTitle,
            content: editContent,
            category: editCategory,
            coverImage: isCover ? data.url : editCoverImage,
              coverPosition: editCoverPosition,
            images: isCover ? editImages : [...editImages, data.url],
            aiSummary: aiSummary || undefined
          });
        }
      }
    } catch (err) {
      console.error(err);
      await alert({ message: "Failed to upload image.", danger: true });
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = editImages.filter((_, idx) => idx !== indexToRemove);
    setEditImages(updated);
    if (activeNoteId) {
      saveNote({
        id: activeNoteId,
        title: editTitle,
        content: editContent,
        category: editCategory,
        coverImage: editCoverImage,
      coverPosition: editCoverPosition,
        images: updated,
        aiSummary: aiSummary || undefined
      });
    }
  };

  const removeCoverImage = () => {
    setEditCoverImage(undefined);
    if (activeNoteId) {
      saveNote({
        id: activeNoteId,
        title: editTitle,
        content: editContent,
        category: editCategory,
        coverImage: undefined,
        images: editImages,
        aiSummary: aiSummary || undefined
      });
    }
  };

  const generateSummary = async (targetNoteId?: string) => {
    const idToSaveTo = targetNoteId || activeNoteId;
    
    const apiKey = preferences.geminiApiKey;
    if (!apiKey) {
      await alert({ message: "Please enter your Gemini API Key in Settings.", danger: true });
      return;
    }
    if (!editContent.trim()) {
      await alert({ message: "Note is empty.", danger: true });
      return;
    }

    if (!targetNoteId) setIsSummarizing(true);
    if (!targetNoteId) setAiSummary(null);
    if (!targetNoteId) setAiError(null);

    const promptText = `I am a trader writing in my journal. I might be typing in English, or in Singlish (Sinhala language typed with English letters).
Read my journal entry carefully. Please provide a response structured exactly like this:

### Emotion / Situation
(Analyze my state of mind, emotion, and situation based on my words and any attached images)

### What You Should Do Next
(Actionable advice as a strict trading coach on what I should do right now or tomorrow)

### Summary
(A brief summary of what I wrote)

My Journal Entry:
"${editContent}"`;

    try {
      const parts: any[] = [{ text: promptText }];
      
      // Process images if any
      const allImages = [...(editCoverImage ? [editCoverImage] : []), ...editImages];
      for (const imgUrl of allImages) {
        if (imgUrl.startsWith('data:image/')) {
          const mimeMatch = imgUrl.match(/^data:(image\/[^;]+);base64,/);
          if (mimeMatch) {
            parts.push({ inline_data: { mime_type: mimeMatch[1], data: imgUrl.split(',')[1] } });
          }
        } else {
          // Attempt to fetch local url and convert to base64
          try {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            const mimeMatch = base64.match(/^data:(image\/[^;]+);base64,/);
            if (mimeMatch) {
              parts.push({ inline_data: { mime_type: mimeMatch[1], data: base64.split(',')[1] } });
            }
          } catch(e) {
            console.error("Could not process image for AI", e);
          }
        }
      }

      let retries = 5;
      let aiRes;
      let aiData;

      while (retries > 0) {
        aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        });
        
        aiData = await aiRes.json();

        if (aiRes.status === 503 || aiRes.status === 429 || aiData?.error?.message?.includes('high demand')) {
          retries--;
          if (retries === 0) break;
          if (!targetNoteId) setAiSummary(`High demand on Google's servers. Retrying... (${retries} attempts left)`);
          await new Promise(r => setTimeout(r, 3000));
        } else {
          break;
        }
      }

      if (aiRes?.ok && aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = aiData.candidates[0].content.parts[0].text;
        if (!targetNoteId) setAiSummary(text);
        if (idToSaveTo) {
          saveNote({
            id: idToSaveTo,
            title: editTitle || "Untitled Note",
            content: editContent,
            category: editCategory,
            images: editImages,
            coverImage: editCoverImage,
      coverPosition: editCoverPosition,
            updatedAt: new Date().toISOString(),
            aiSummary: text
          });
        }
      } else {
        if (!targetNoteId) setAiError(`Failed to generate summary. ${aiData?.error?.message || "Safety block or API error."}`);
      }
    } catch (e: any) {
      if (!targetNoteId) setAiError(`Error generating summary: ${e.message}`);
    } finally {
      if (!targetNoteId) setIsSummarizing(false);
    }
  };

  const handleBack = () => {
    // Check if the note is completely empty or just the default placeholder
    const isEmpty = (!editTitle.trim() || editTitle === "Untitled Note") && 
                    !editContent.trim() && 
                    editImages.length === 0 && 
                    !editCoverImage;

    if (isEmpty && activeNoteId) {
      // Discard empty note (prevent pollution of database)
      deleteNote(activeNoteId);
    } else {
      // Auto-save one last time
      handleSave();
      
      // If there's text but no AI summary yet, quietly generate it in the background
      if (editContent.trim() && !aiSummary) {
        generateSummary(activeNoteId || undefined);
      }
    }
    
    setActiveNoteId(null);
  };

  if (activeNoteId) {
    return (
      <div className="max-w-[1200px] mx-auto min-h-[calc(100vh-120px)] flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden animate-zoom-in shadow-2xl relative">
        {/* Cover Image Area */}
        <div 
            className={`h-48 w-full relative bg-[var(--card)] flex items-center justify-center border-b border-[var(--border)] ${isRepositioning ? 'cursor-grab active:cursor-grabbing' : 'group'}`}
            style={editCoverImage ? { backgroundImage: `url(${editCoverImage})`, backgroundSize: 'cover', backgroundPosition: `center ${editCoverPosition}%` } : {}}
            onMouseDown={(e) => {
              if (!isRepositioning) return;
              dragRef.current = { isDragging: true, startY: e.clientY, startPos: editCoverPosition };
            }}
            onMouseMove={(e) => {
              if (!isRepositioning || !dragRef.current.isDragging) return;
              const deltaY = e.clientY - dragRef.current.startY;
              let newPos = dragRef.current.startPos - (deltaY * 0.3); // Sensitivity
              newPos = Math.max(0, Math.min(100, newPos));
              setEditCoverPosition(newPos);
            }}
            onMouseUp={() => dragRef.current.isDragging = false}
            onMouseLeave={() => dragRef.current.isDragging = false}
          >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
          
          

          
          {isRepositioning && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 pointer-events-none">
              <span className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold shadow-2xl animate-zoom-in">Drag image to reposition</span>
            </div>
          )}
          {isRepositioning ? (
            <div className="absolute top-6 right-6 z-20 flex gap-2 animate-zoom-in">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsRepositioning(false); dragRef.current.isDragging = false; }} 
                className="px-4 py-2 bg-black/60 hover:bg-[var(--loss)] backdrop-blur-md rounded-lg text-white text-sm font-bold shadow-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsRepositioning(false); dragRef.current.isDragging = false; handleSave(); }} 
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 backdrop-blur-md rounded-lg text-white text-sm font-bold shadow-lg transition-all"
              >
                Save Position
              </button>
            </div>
          ) : (
            <div className="absolute top-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!editCoverImage ? (
                <button onClick={() => coverInputRef.current?.click()} className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white text-sm font-bold shadow-lg transition-all">
                  Insert Cover
                </button>
              ) : (
                <div className="relative">
                  <button onClick={() => setIsCoverMenuOpen(!isCoverMenuOpen)} className="flex items-center px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg text-white text-sm font-bold shadow-lg transition-all">
                    Edit Cover <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  {isCoverMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsCoverMenuOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-40 p-1 animate-zoom-in">
                        <button onClick={() => { setIsCoverMenuOpen(false); coverInputRef.current?.click(); }} className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg font-medium transition-colors">
                          Replace
                        </button>
                        <button onClick={() => { setIsCoverMenuOpen(false); setIsRepositioning(true); }} className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg font-medium transition-colors">
                          Reposition
                        </button>
                        <button onClick={() => { setIsCoverMenuOpen(false); removeCoverImage(); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-colors">
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, true)} />
            </div>
          )}

        </div>

        {/* Editor Area */}
          <div className="absolute top-[216px] right-8 flex items-center gap-3 z-10">
              {saveError && (
                <div className="px-4 py-2 bg-[var(--loss)] text-white text-sm font-bold rounded-lg animate-zoom-in shadow-lg">
                  {saveError}
                </div>
              )}
              <button 
                onClick={handleDiscard}
                className="flex items-center px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg text-white/80 hover:text-white transition-all text-sm font-bold"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Discard
              </button>
              <button 
                onClick={handleBack}
                className="flex items-center px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/80 shadow-lg shadow-[var(--primary)]/20 backdrop-blur-md rounded-lg text-white transition-all text-sm font-bold"
              >
                <Save className="w-4 h-4 mr-2" /> Save & Close
              </button>
          </div>

          <div className="p-12 flex-1 flex flex-col max-w-[900px] mx-auto w-full relative">
            
          

          <div className="mb-6 pr-[350px]">
            <input 
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Untitled"
              className="bg-transparent text-5xl font-bold text-[var(--foreground)] focus:outline-none placeholder:text-[var(--muted-foreground)] w-full"
            />
          </div>
          
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--border)]/50">
            <div className="relative">
              <button 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-medium text-[var(--foreground)] flex items-center justify-between w-40 hover:border-[var(--primary)] transition-colors shadow-sm"
              >
                {editCategory}
                <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
              
              {isCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 p-2 animate-zoom-in">
                      <div className="px-3 py-2 text-[10px] font-bold text-[var(--muted-foreground)] tracking-wider uppercase">
                        Select Category
                      </div>
                      <div className="h-px bg-[var(--border)] mx-3 mb-2 opacity-50"></div>
                      {CATEGORIES.map(c => (
                        <div 
                          key={c.name}
                          onClick={() => { setEditCategory(c.name); setIsCategoryOpen(false); setTimeout(handleSave, 0); }}
                          className={`px-3 py-2.5 mx-1 mb-1 rounded-xl cursor-pointer text-sm font-medium transition-all flex items-center justify-between ${editCategory === c.name ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md' : 'text-[var(--foreground)] hover:bg-[var(--muted)]/80'}`}
                        >
                          <span>{c.name}</span>
                          {editCategory === c.name && <Check className="w-4 h-4" />}
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </div>
            <div className="flex items-center gap-2">
                <DatePickerDropdown date={editDate} onChange={d => { setEditDate(d); setTimeout(handleSave, 0); }} />
              </div>
                          <button 
                onClick={() => fileInputRef.current?.click()}
                className="ml-auto flex items-center px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--border)] rounded-md text-[var(--foreground)] text-sm transition-colors"
              >
                <ImageIcon className="w-4 h-4 mr-2" /> Attach Image
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, false)} />
              
              </div>

          <textarea 
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onBlur={handleSave}
            placeholder="Write your thoughts here..."
            className="flex-1 w-full bg-transparent text-lg text-[var(--foreground)] focus:outline-none resize-none leading-relaxed placeholder:text-[var(--muted-foreground)] min-h-[300px]"
          />

          <div className="mt-8 pt-8 border-t border-[var(--border)]/50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-400 uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-[var(--primary)]" /> AI Note Summarizer
              </h4>
              {!aiSummary && (
                <button 
                  onClick={() => generateSummary()}
                  disabled={isSummarizing || !editContent.trim()}
                  className="px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-md text-xs font-bold transition-all disabled:opacity-50 flex items-center"
                >
                  {isSummarizing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
                  {isSummarizing ? "Summarizing..." : "Generate Summary & Action Items"}
                </button>
              )}
            </div>

            {aiSummary && (
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 p-6 rounded-3xl relative overflow-hidden">
                <div className="relative z-10 prose dark:prose-invert prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-strong:text-[var(--foreground)] prose-li:text-[var(--foreground)] max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              </div>
            )}
            
            {aiError && (
              <div className="bg-[var(--loss)]/20 border border-[var(--loss)]/30 p-6 rounded-xl relative overflow-hidden mt-4">
                <div className="relative z-10 text-sm leading-relaxed text-[var(--loss)]">
                  <ReactMarkdown>{aiError}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {editImages.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[var(--border)]/50">
              <h4 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-6">Attachments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editImages.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]/50">
                    <img src={url} alt="Attached" className="w-full h-auto object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-[var(--loss)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-3 max-w-4xl">
        <h2 className="text-3xl font-bold text-[var(--foreground)] tracking-tight flex items-center">
          <Sparkles className="w-6 h-6 mr-3 text-[var(--primary)] flex-shrink-0" />
          {motivationalQuote?.topic || "Daily Inspiration"}
        </h2>
        <div className="text-[var(--foreground)] text-lg leading-relaxed italic border-l-2 border-[var(--primary)]/50 pl-4 py-1">
          {motivationalQuote ? (
            <ReactMarkdown>{motivationalQuote.text}</ReactMarkdown>
          ) : (
            <span className="animate-pulse text-[var(--muted-foreground)]">Seeking inspiration from the markets...</span>
          )}
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map(cat => (
          <div 
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`relative h-40 rounded-3xl p-6 cursor-pointer overflow-hidden group transition-all duration-300 border hover:-translate-y-1 ${cat.glow} ${
              activeCategory === cat.name ? `${cat.borderActive} ${cat.bgActive}` : `border-[var(--border)] bg-[var(--card)] ${cat.hoverBorder}`
            }`}
          >
            <div className="relative h-full flex flex-col justify-end">
              <h3 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{cat.name}</h3>
              <p className={`text-sm mt-1 font-medium ${activeCategory === cat.name ? cat.textActive : 'text-[var(--muted-foreground)]'}`}>
                {notes.filter(n => (n.category || "Educational") === cat.name).length} notes
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Table */}
      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-xl shadow-black/5 pb-4">
        <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--card)]/30 flex justify-between items-center rounded-t-3xl">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Overview: {activeCategory}</h3>
          </div>
          <button 
            onClick={handleCreateNote}
            className="flex items-center px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </button>
        </div>
        
        <div className="">
            <div className="flex px-10 py-4 text-xs text-[var(--muted-foreground)] uppercase bg-[var(--card)]/20 border-b border-[var(--border)] mb-2">
              <div className="w-1/2 font-semibold">Name</div>
              <div className="w-1/4 font-semibold">Date</div>
              <div className="w-1/4 font-semibold text-right">Actions</div>
            </div>
            
            <div className="space-y-2 px-4">
              {filteredNotes.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted-foreground)]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No notes in {activeCategory}.</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div 
                    key={note.id} 
                    onClick={() => handleSelectNote(note)}
                    className={`animate-slide-up flex items-center px-6 py-4 rounded-2xl transition-all duration-300 cursor-pointer group ${CATEGORIES.find(c => c.name === activeCategory)?.tableRowGlow || ''}`}
                  >
                    <div className="w-1/2 flex items-center">
                      <FileText className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                      <span className="font-medium text-[var(--foreground)] group-hover:text-[var(--foreground)] transition-colors">{note.title}</span>
                    </div>
                    <div className="w-1/4 text-sm text-[var(--muted-foreground)]">
                      {format(parseISO(note.updatedAt), 'MMMM d, yyyy')}
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <button 
                        onClick={(e) => handleDelete(note.id, e)}
                        className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
      </div>

      {/* Monthly Calendar */}
      <div>
        <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight mb-6 mt-12">Calendar</h3>
        <NotesCalendar notes={notes} onNoteClick={handleSelectNote} />
      </div>
    </div>
  );
}
