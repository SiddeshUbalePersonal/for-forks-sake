"use client";

import { useGitStore } from "@/store/useGitStore";
import { File, FilePlus, Save, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FileExplorer() {
    const { fileSystem, conflictState, editFile, resolveConflict, commits, head } = useGitStore();
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);

    const files = Object.keys(fileSystem).sort();

    const handleFileClick = (filename: string) => {
        setSelectedFile(filename);
        setEditorContent(fileSystem[filename]);
    };

    const handleSave = () => {
        if (!selectedFile) return;

        if (conflictState && conflictState.path === selectedFile) {
            resolveConflict(editorContent);
            setSelectedFile(null); // Close after resolve
            setFeedback("Conflict Resolved! Run 'git add .' to stage changes.");
            setTimeout(() => setFeedback(null), 5000);
        } else {
            editFile(selectedFile, editorContent);
            setSelectedFile(null);
        }
    };

    const isConflicted = (filename: string) => conflictState?.path === filename;

    // Check if file is modified relative to HEAD
    const isModified = (filename: string) => {
        if (isConflicted(filename)) return false; // Conflict overrides modified
        const headCommit = commits.find(c => c.id === head);
        const headContent = headCommit?.fileSystem[filename];
        return headContent !== fileSystem[filename];
    };

    return (
        <div className="flex flex-col h-full bg-muted/10 border-r border-border font-mono text-sm relative">
            <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <span className="font-bold opacity-70">EXPLORER</span>
                {conflictState && (
                    <span className="text-red-500 text-xs flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={12} /> CONFLICT
                    </span>
                )}
            </div>

            {/* Feedback Toast */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-12 left-2 right-2 bg-green-500/90 text-white text-xs p-2 rounded shadow-lg z-50 text-center"
                    >
                        {feedback}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {files.map(file => (
                    <div
                        key={file}
                        onClick={() => handleFileClick(file)}
                        className={`
                            flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                            ${selectedFile === file ? 'bg-primary/20 text-primary' : 'hover:bg-muted/50'}
                            ${isConflicted(file) ? 'text-red-500 font-bold border border-red-500/30 bg-red-500/10' : ''}
                        `}
                    >
                        <File size={14} className={isConflicted(file) ? "text-red-500" : (isModified(file) ? "text-yellow-500" : "opacity-50")} />
                        <span>{file}</span>
                        {isConflicted(file) && <span className="ml-auto text-xs">!</span>}
                        {!isConflicted(file) && isModified(file) && <span className="ml-auto text-xs text-yellow-500">M</span>}
                    </div>
                ))}

                {/* Add File Button (Simulated placeholder for 'touch') */}
                <div
                    className="flex items-center gap-2 p-2 rounded cursor-pointer opacity-40 hover:opacity-100 transition-opacity text-xs"
                    onClick={() => {
                        const name = prompt("Filename:");
                        if (name) editFile(name, "");
                    }}
                >
                    <FilePlus size={14} /> New File...
                </div>
            </div>

            {/* Mini Editor Overlay */}
            <AnimatePresence>
                {selectedFile && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="absolute bottom-0 left-0 w-full h-1/2 bg-background border-t-2 border-primary shadow-2xl z-20 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-2 bg-muted/50 border-b border-border">
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{selectedFile}</span>
                                {isConflicted(selectedFile!) && <span className="text-xs bg-red-500/20 text-red-500 px-2 rounded">CONFLICT</span>}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="p-1 px-3 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 flex items-center gap-1"
                                >
                                    <Save size={12} /> {isConflicted(selectedFile!) ? 'Resolve' : 'Save'}
                                </button>
                                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-muted rounded">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <textarea
                                className="w-full h-full p-4 bg-black/90 text-white font-mono resize-none focus:outline-none text-xs leading-relaxed"
                                value={editorContent}
                                onChange={(e) => setEditorContent(e.target.value)}
                            />
                            {/* Simple Conflict Helpers */}
                            {isConflicted(selectedFile!) && (
                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                    <button
                                        onClick={() => setEditorContent(conflictState?.ours || '')}
                                        className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/50 px-2 py-1 rounded hover:bg-blue-500/40"
                                    >
                                        Accept Current
                                    </button>
                                    <button
                                        onClick={() => setEditorContent(conflictState?.theirs || '')}
                                        className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/50 px-2 py-1 rounded hover:bg-green-500/40"
                                    >
                                        Accept Incoming
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
