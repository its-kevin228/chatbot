"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiThumbsUp, FiThumbsDown, FiCopy, FiUser } from "react-icons/fi";
import { RiRobot2Fill } from "react-icons/ri";
import { BiRefresh, BiDotsHorizontalRounded } from "react-icons/bi";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
    const [dislikedMessages, setDislikedMessages] = useState<Set<number>>(new Set());
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { 
            role: "user", 
            content: input,
            timestamp: new Date()
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) throw new Error("Failed to get response");

            const data = await response.json();
            const assistantMessage: Message = {
                role: "assistant",
                content: data.response,
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const handleLike = (index: number) => {
        setLikedMessages(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
        });
        setDislikedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    const handleDislike = (index: number) => {
        setDislikedMessages(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
        });
        setLikedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    const handleCopy = async (content: string, index: number) => {
        await navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleRegenerate = async (index: number) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messages[index].content }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const regeneratedMessage: Message = {
                role: "assistant",
                content: data.response,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, regeneratedMessage]);
        } catch (error) {
            console.error("Error:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I encountered an error while regenerating the response. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setIsTyping(true);
        const timeout = setTimeout(() => setIsTyping(false), 1000);
        return () => clearTimeout(timeout);
    };

    return (
        <div className="max-w-4xl mx-auto relative h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-2 md:px-4 lg:px-6">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-2xl p-2 md:p-4 lg:p-6 h-[calc(100vh-16px)] flex flex-col space-y-2 md:space-y-3 lg:space-y-4 backdrop-blur-md border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center items-center mb-2">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <RiRobot2Fill className="text-purple-500" />
                        Chatbot Assistant
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto mb-1 md:mb-2 lg:mb-3 space-y-2 md:space-y-3 lg:space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2 md:pr-3 lg:pr-4">
                    {messages.map((message, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            key={index} 
                            className={`flex items-start gap-2 md:gap-3 lg:gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                message.role === "user" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-purple-500 dark:bg-purple-600 text-white"
                            }`}>
                                {message.role === "user" 
                                    ? <FiUser size={20} /> 
                                    : <RiRobot2Fill size={20} />
                                }
                            </div>
                            <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]`}>
                                <div className={`p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl ${
                                    message.role === "user" 
                                        ? "bg-blue-500 text-white" 
                                        : "bg-gray-100 dark:bg-gray-700 dark:text-white"
                                } shadow-md transition-all duration-300 ease-in-out hover:shadow-lg text-xs sm:text-sm md:text-base`}>
                                    <div className="whitespace-pre-wrap">
                                        {message.role === "assistant" ? (
                                            <motion.span
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {message.content}
                                            </motion.span>
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                    {message.role === "assistant" && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleLike(index)}
                                                className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${likedMessages.has(index) ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}
                                                aria-label="Like"
                                            >
                                                <FiThumbsUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDislike(index)}
                                                className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${dislikedMessages.has(index) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                                                aria-label="Dislike"
                                            >
                                                <FiThumbsDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleRegenerate(index)}
                                                className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400`}
                                                aria-label="Regenerate"
                                                disabled={isLoading}
                                            >
                                                <BiRefresh size={16} className="transition-all duration-200 hover:rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => handleCopy(message.content, index)}
                                                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400"
                                                aria-label="Copy"
                                            >
                                                {copiedIndex === index ? (
                                                    <span className="text-green-500 text-sm">✓</span>
                                                ) : (
                                                    <FiCopy size={14} />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 md:mt-2 px-1 md:px-2">
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 md:gap-3 lg:gap-4"
                        >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500 dark:bg-purple-600 text-white">
                                <RiRobot2Fill size={20} />
                            </div>
                            <div className="flex flex-col items-start max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[75%] lg:max-w-[70%]">
                                <div className="p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-700 dark:text-white shadow-md">
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="flex items-center gap-1"
                                    >
                                        <BiDotsHorizontalRounded size={20} className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Generating response...</span>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <motion.form 
                onSubmit={handleSubmit} 
                className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 p-2 md:p-3 lg:p-4 rounded-t-lg shadow-lg z-20 backdrop-blur-md border-t border-gray-200 dark:border-gray-700"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="flex gap-2 md:gap-3 items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 p-2 md:p-3 text-xs sm:text-sm md:text-base border dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500"
                        disabled={isLoading}
                    />
                    <motion.button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl disabled:shadow-none font-medium text-xs sm:text-sm md:text-base ${
                            input.trim() 
                                ? "bg-blue-500 dark:bg-purple-500 hover:bg-blue-600 dark:hover:bg-purple-600 text-white" 
                                : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <BiRefresh size={20} />
                            </motion.div>
                        ) : (
                            "Send"
                        )}
                    </motion.button>
                </div>
            </motion.form>
        </div>
    );
}