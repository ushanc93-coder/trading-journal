"use client";

import { useState, useRef, useEffect } from "react";
import { useNotebook, Note } from "@/lib/useNotebook";
import { useSettingsContext } from "@/lib/SettingsContext";
import { Plus, Trash2, CalendarDays, Search, Save, X, Image as ImageIcon, FileText, LayoutGrid, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import NotesCalendar from "@/components/NotesCalendar";
import { useConfirm } from "@/lib/ConfirmContext";
import ReactMarkdown from "react-markdown";

const CATEGORIES = [
  { name: "Educational", gradient: "from-amber-900/40 to-amber-600/10", border: "border-amber-500/30", text: "text-amber-400", shadow: "hover:shadow-amber-900/20" },
  { name: "Strategy", gradient: "from-purple-900/40 to-[var(--primary)]/10", border: "border-[var(--primary)]/30", text: "text-[var(--primary)]", shadow: "hover:shadow-purple-900/20" },
  { name: "Personal", gradient: "from-emerald-900/40 to-emerald-600/10", border: "border-emerald-500/30", text: "text-emerald-400", shadow: "hover:shadow-emerald-900/20" },
  { name: "Goals", gradient: "from-blue-900/40 to-blue-600/10", border: "border-blue-500/30", text: "text-blue-400", shadow: "hover:shadow-blue-900/20" },
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
  const [editDate, setEditDate] = useState("");
  
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
    // Auto-save one last time
    handleSave();
    
    // If there's text but no AI summary yet, quietly generate it in the background
    if (editContent.trim() && !aiSummary) {
      generateSummary(activeNoteId || undefined); // Pass ID so it knows where to save if state unmounts
    }
    
    setActiveNoteId(null);
  };

  if (activeNoteId) {
    return (
      <div className="max-w-[1200px] mx-auto min-h-[calc(100vh-120px)] flex flex-col bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Cover Image Area */}
        <div 
          className="h-48 w-full relative bg-[var(--card)] group flex items-center justify-center border-b border-[var(--border)]"
          style={editCoverImage ? { backgroundImage: `url(${editCoverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
          
          <button 
            onClick={handleBack}
            className="absolute top-6 left-6 z-10 flex items-center px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md text-white/80 hover:text-white transition-all text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Save & Close
          </button>

          <div className="absolute top-6 right-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {editCoverImage && (
              <button onClick={removeCoverImage} className="px-3 py-1.5 bg-rose-500/80 hover:bg-rose-500 backdrop-blur-md rounded-md text-white text-xs font-medium">
                Remove Cover
              </button>
            )}
            <button onClick={() => coverInputRef.current?.click()} className="px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md text-white text-xs font-medium">
              Change Cover
            </button>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, true)} />
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-12 flex-1 flex flex-col max-w-[900px] mx-auto w-full">
          <input 
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Untitled"
            className="bg-transparent text-5xl font-bold text-white focus:outline-none placeholder:text-zinc-700 mb-6"
          />
          
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--border)]/50">
            <select 
              value={editCategory} 
              onChange={(e) => { setEditCategory(e.target.value); setTimeout(handleSave, 0); }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            >
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[var(--muted-foreground)]" />
              <input 
                type="datetime-local"
                value={editDate}
                onChange={(e) => { setEditDate(e.target.value); setTimeout(handleSave, 0); }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="ml-auto flex items-center px-3 py-1.5 bg-[var(--muted)] hover:bg-zinc-700 rounded-md text-[var(--foreground)] text-sm transition-colors"
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
            className="flex-1 w-full bg-transparent text-lg text-[var(--foreground)] focus:outline-none resize-none leading-relaxed placeholder:text-zinc-700 min-h-[300px]"
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
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-[var(--primary)]/20 p-6 rounded-xl relative overflow-hidden">
                <div className="relative z-10 prose prose-invert prose-purple max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              </div>
            )}
            
            {aiError && (
              <div className="bg-rose-900/20 border border-rose-500/20 p-6 rounded-xl relative overflow-hidden mt-4">
                <div className="relative z-10 text-sm leading-relaxed text-rose-200">
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
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
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
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center">
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
            className={`relative h-40 rounded-2xl p-6 cursor-pointer overflow-hidden group transition-all duration-300 border hover:-translate-y-1 hover:shadow-2xl ${cat.shadow} ${
              activeCategory === cat.name ? cat.border : 'border-[var(--border)]/50 hover:border-zinc-600'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <div className="relative h-full flex flex-col justify-end">
              <h3 className="text-2xl font-bold text-white tracking-tight">{cat.name}</h3>
              <p className={`text-sm mt-1 font-medium ${cat.text}`}>{notes.filter(n => (n.category || "Daily") === cat.name).length} notes</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Table */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl shadow-black/20">
        <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--card)]/30 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-5 h-5 text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-semibold text-white">Overview: {activeCategory}</h3>
          </div>
          <button 
            onClick={handleCreateNote}
            className="flex items-center px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-md text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--card)]/20">
              <tr>
                <th className="px-8 py-4 font-semibold w-1/2">Name</th>
                <th className="px-8 py-4 font-semibold">Date</th>
                <th className="px-8 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-[var(--muted-foreground)]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No notes in {activeCategory}.</p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map(note => (
                  <tr 
                    key={note.id} 
                    onClick={() => handleSelectNote(note)}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-3 text-[var(--muted-foreground)] group-hover:text-white transition-colors" />
                        <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">{note.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-[var(--muted-foreground)]">
                      {format(parseISO(note.updatedAt), 'MMMM d, yyyy')}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button 
                        onClick={(e) => handleDelete(note.id, e)}
                        className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Calendar */}
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight mb-6 mt-12">Calendar</h3>
        <NotesCalendar notes={notes} onNoteClick={handleSelectNote} />
      </div>
    </div>
  );
}
