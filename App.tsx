import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Note, Tag } from './types';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { FAB } from './components/FAB';
import { Icon } from './components/Icon';
import { AskGeminiModal } from './components/AskGeminiModal';

const App: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [activeTagId, setActiveTagId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAskGeminiModalOpen, setIsAskGeminiModalOpen] = useState(false);

    useEffect(() => {
        try {
            const storedNotes = localStorage.getItem('notes_data');
            const storedTags = localStorage.getItem('tags_data');
            if (storedNotes) {
                setNotes(JSON.parse(storedNotes));
            }
            if (storedTags) {
                setTags(JSON.parse(storedTags));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if(isInitialized) {
            try {
                localStorage.setItem('notes_data', JSON.stringify(notes));
            } catch (error) {
                console.error("Failed to save notes to localStorage", error);
            }
        }
    }, [notes, isInitialized]);

    useEffect(() => {
        if(isInitialized) {
            try {
                localStorage.setItem('tags_data', JSON.stringify(tags));
            } catch (error) {
                console.error("Failed to save tags to localStorage", error);
            }
        }
    }, [tags, isInitialized]);

    const handleAddNote = useCallback(() => {
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            tags: activeTagId ? [activeTagId] : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
    }, [activeTagId]);
    
    const handleSaveNote = useCallback((updatedNote: Note) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    }, []);

    const handleDeleteNote = useCallback((noteId: string) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (activeNoteId === noteId) {
            setActiveNoteId(null);
        }
    }, [activeNoteId]);
    
    const handleAddTag = useCallback((tagName: string): Tag => {
        const newTag: Tag = { id: crypto.randomUUID(), name: tagName };
        setTags(prev => [...prev, newTag]);
        return newTag;
    }, []);

    const filteredNotes = useMemo(() => {
        return notes
            .filter(note => {
                if (activeTagId && !note.tags.includes(activeTagId)) {
                    return false;
                }
                if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && !note.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [notes, activeTagId, searchTerm]);

    const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

    const handleSelectTag = (tagId: string | null) => {
        setActiveTagId(tagId);
        setIsSidebarOpen(false);
    }

    if (!isInitialized) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
                Loading Notes...
            </div>
        );
    }
    
    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex overflow-hidden font-sans">
            <Sidebar
                tags={tags}
                activeTagId={activeTagId}
                onSelectTag={handleSelectTag}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 flex flex-col min-w-0">
                {!activeNote ? (
                    <>
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-800 rounded-full">
                            <Icon name="menu" />
                        </button>
                        <NoteList
                            notes={filteredNotes}
                            tags={tags}
                            onSelectNote={setActiveNoteId}
                            onDeleteNote={handleDeleteNote}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onAskGemini={() => setIsAskGeminiModalOpen(true)}
                        />
                        <FAB onClick={handleAddNote} />
                    </>
                ) : (
                    <NoteEditor
                        note={activeNote}
                        tags={tags}
                        onSave={handleSaveNote}
                        onDelete={handleDeleteNote}
                        onBack={() => setActiveNoteId(null)}
                        onAddTag={handleAddTag}
                    />
                )}
            </main>
            <AskGeminiModal
                isOpen={isAskGeminiModalOpen}
                onClose={() => setIsAskGeminiModalOpen(false)}
                notes={notes}
            />
        </div>
    );
};

export default App;