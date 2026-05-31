import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { HiSparkles } from "react-icons/hi2";
import { FaPaperPlane } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { streamAssistant } from "../../api/assistant";

const CONVERSATION_KEY = "assistantConversationId";

const ChatAssistant = () => {
    const { user } = useSelector((state) => state.auth);
    const isLoggedIn = Boolean(user && user.id);

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]); // { role: "user" | "assistant", text }
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationId, setConversationId] = useState(
        () => localStorage.getItem(CONVERSATION_KEY) || null
    );

    const scrollRef = useRef(null);
    const abortRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open]);

    const persistConversationId = (id) => {
        setConversationId(id);
        if (id) localStorage.setItem(CONVERSATION_KEY, id);
    };

    const startNewChat = () => {
        if (abortRef.current) abortRef.current.abort();
        setMessages([]);
        setIsStreaming(false);
        persistConversationId(null);
        localStorage.removeItem(CONVERSATION_KEY);
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || isStreaming) return;

        setInput("");
        // Append the user's message and a placeholder assistant message we will stream into.
        setMessages((prev) => [
            ...prev,
            { role: "user", text },
            { role: "assistant", text: "" },
        ]);
        setIsStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        const appendToAssistant = (fragment) => {
            setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                    next[next.length - 1] = { ...last, text: last.text + fragment };
                }
                return next;
            });
        };

        try {
            await streamAssistant({
                message: text,
                conversationId,
                signal: controller.signal,
                onConversationId: persistConversationId,
                onToken: appendToAssistant,
            });
        } catch (err) {
            if (err?.name === "AbortError") return;
            setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                const errorText = err?.message || "Something went wrong. Please try again.";
                if (last && last.role === "assistant" && !last.text) {
                    next[next.length - 1] = { ...last, text: errorText, error: true };
                } else {
                    next.push({ role: "assistant", text: errorText, error: true });
                }
                return next;
            });
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    };

    return (
        <>
            {/* FLOATING TOGGLE BUTTON */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    aria-label="Open shopping assistant"
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-custom-gradient text-white px-5 py-3 shadow-xl hover:scale-105 transition-transform">
                    <HiSparkles size={22} />
                    <span className="font-semibold hidden sm:inline">Ask Rosy</span>
                </button>
            )}

            {/* CHAT PANEL */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[92vw] max-w-[400px] h-[70vh] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* HEADER */}
                    <div className="flex items-center justify-between px-4 py-3 bg-custom-gradient text-white">
                        <div className="flex items-center gap-2">
                            <HiSparkles size={22} />
                            <div className="leading-tight">
                                <p className="font-semibold">Rosy</p>
                                <p className="text-xs text-gray-200">Shopping Assistant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={startNewChat}
                                className="text-xs font-medium underline-offset-2 hover:underline"
                                title="Start a new conversation">
                                New chat
                            </button>
                            <button onClick={() => setOpen(false)} aria-label="Close assistant">
                                <RxCross2 size={22} />
                            </button>
                        </div>
                    </div>

                    {/* BODY */}
                    {!isLoggedIn ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
                            <HiSparkles className="text-purple-500" size={36} />
                            <p className="text-slate-700 font-medium">
                                Please log in to chat with Rosy about products, your orders and cart.
                            </p>
                            <Link
                                to="/login"
                                onClick={() => setOpen(false)}
                                className="bg-custom-gradient text-white px-5 py-2 rounded-md font-semibold">
                                Log in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                                {messages.length === 0 && (
                                    <div className="text-center text-slate-500 text-sm mt-6">
                                        <HiSparkles className="mx-auto text-purple-400 mb-2" size={28} />
                                        Say hi to Rosy, or ask about products, your orders or your cart.
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap wrap-break-word ${
                                                msg.role === "user"
                                                    ? "bg-blue-600 text-white rounded-br-sm"
                                                    : msg.error
                                                    ? "bg-rose-100 text-rose-800 rounded-bl-sm"
                                                    : "bg-white text-slate-800 border border-gray-200 rounded-bl-sm"
                                            }`}>
                                            {msg.text}
                                            {msg.role === "assistant" &&
                                                !msg.text &&
                                                isStreaming &&
                                                i === messages.length - 1 && (
                                                    <span className="inline-flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* INPUT */}
                            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 p-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Rosy anything..."
                                    disabled={isStreaming}
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                />
                                <button
                                    type="submit"
                                    disabled={isStreaming || !input.trim()}
                                    aria-label="Send message"
                                    className="bg-custom-gradient text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-50">
                                    <FaPaperPlane size={16} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatAssistant;
