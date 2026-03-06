"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, BrainCircuit, MessageSquare, Youtube, FileText, ChevronRight, Play, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/ui/page-loading";
import { ProgressRing } from "@/components/ui/progress-ring";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useContentStatus } from "@/hooks/use-content-status";

export default function StudyDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const contentId = params.id as string;

    const { status, content } = useContentStatus(contentId);

    const [isLoading, setIsLoading] = useState(true);

    const [hasFlashcards, setHasFlashcards] = useState(false);
    const [flashcardCount, setFlashcardCount] = useState(0);
    const [hasQuiz, setHasQuiz] = useState(false);
    const [quizCount, setQuizCount] = useState(0);
    const [chatCount, setChatCount] = useState(0);

    const [isGeneratingCards, setIsGeneratingCards] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [studyProgress, setStudyProgress] = useState<{ flashcards_reviewed: number; quiz_score: number; quiz_attempts: number } | null>(null);

    useEffect(() => {
        if (contentId && content) {
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contentId, content]);

    const fetchDashboardData = async () => {
        try {

            // Fetch flashcards to see if they exist
            try {
                const fcData = await api.getFlashcards(contentId);
                if (fcData && fcData.flashcards && fcData.flashcards.length > 0) {
                    setHasFlashcards(true);
                    setFlashcardCount(fcData.flashcards.length);
                }
            } catch {
                setHasFlashcards(false);
            }

            // Fetch quiz to see if it exists
            try {
                const quizData = await api.getQuiz(contentId);
                if (quizData && quizData.questions && quizData.questions.length > 0) {
                    setHasQuiz(true);
                    setQuizCount(quizData.questions.length);
                }
            } catch {
                setHasQuiz(false);
            }

            // Fetch chat history
            try {
                const chatData = await api.getChatHistory(contentId);
                if (chatData && chatData.messages) {
                    setChatCount(chatData.messages.filter(m => m.role === 'user').length);
                }
            } catch {
                setChatCount(0);
            }

            // Fetch study progress
            try {
                const progressData = await api.getStudyProgress(contentId);
                setStudyProgress(progressData);
            } catch {
                setStudyProgress(null);
            }

        } catch (error) {
            toast.error("Failed to load content", { description: error instanceof Error ? error.message : "Unknown error" });
            router.push('/library');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateFlashcards = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGeneratingCards(true);
        toast.message("Generating flashcards...", { description: "This might take a minute." });
        try {
            const data = await api.generateFlashcards(contentId);
            setHasFlashcards(true);
            setFlashcardCount(data.flashcards.length);
            toast.success("Flashcards generated successfully!");
            router.push(`/study/${contentId}/flashcards`);
        } catch (error) {
            toast.error("Generation failed", { description: error instanceof Error ? error.message : "Unknown error" });
        } finally {
            setIsGeneratingCards(false);
        }
    };

    const handleGenerateQuiz = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGeneratingQuiz(true);
        toast.message("Generating quiz...", { description: "Creating multiple choice questions." });
        try {
            const data = await api.generateQuiz(contentId);
            setHasQuiz(true);
            setQuizCount(data.questions.length);
            toast.success("Quiz generated successfully!");
            router.push(`/study/${contentId}/quiz`);
        } catch (error) {
            toast.error("Generation failed", { description: error instanceof Error ? error.message : "Unknown error" });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    if (isLoading && status !== 'processing') {
        return <PageLoading count={3} />;
    }

    if (!content) {
        return null;
    }

    if (status === 'error') {
        return (
            <div className="mx-auto max-w-2xl mt-12">
                <Card className="glass flex flex-col items-center justify-center p-12 text-center border-red-500/20">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Content Processing Failed</h2>
                    <h3 className="text-2xl font-bold mb-2">Likely Gemini Free Tier Limit Exceeded for the Day(English Video will still be processed)</h3>
                    <p className="text-muted-foreground mb-6">
                        We encountered an error while analyzing this content. Please try deleting
                        this item from your library and uploading it again.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => router.push('/library')}>
                            Return to Library
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-6 px-4 md:px-0">
            {/* Context Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={`font-medium capitalize ${content.source_type === 'youtube' ? 'text-red-500 border-red-500/30 bg-red-500/5' : 'text-blue-500 border-blue-500/30 bg-blue-500/5'}`}>
                        {content.source_type === 'youtube' ? <Youtube className="w-3 h-3 mr-1 inline" /> : <FileText className="w-3 h-3 mr-1 inline" />}
                        {content.source_type}
                    </Badge>
                    <Badge variant="outline" className={`font-medium capitalize ${status === 'ready' ? 'text-green-500 border-green-500/30 bg-green-500/5' : status === 'processing' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5'}`}>
                        {status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{new Date(content.created_at).toLocaleDateString()}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{content.title}</h1>


                <Card className="glass overflow-hidden bg-muted/10 border-muted">
                    <CardContent className="p-4 relative">
                        {content.source_type === 'youtube' && content.thumbnail_url && (
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
                                    <Image src={content.thumbnail_url} alt="Thumbnail" fill className="object-cover" unoptimized />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-2">Transcript Preview</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
                                        {content.raw_text.substring(0, 400)}...
                                    </p>
                                </div>
                            </div>
                        )}
                        {content.source_type === 'pdf' && (
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-1/4 h-32 rounded-lg bg-muted flex flex-col gap-2 items-center justify-center border border-dashed shrink-0">
                                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                                    {content.page_count && <span className="text-xs text-muted-foreground">{content.page_count} Pages</span>}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-2">Document Preview</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
                                        {content.raw_text.substring(0, 400)}...
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Separator className="opacity-50" />

            {/* Progress Overview Section */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Study Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="glass flex flex-row items-center p-6 gap-6 transition-all hover:shadow-md">
                        <ProgressRing
                            value={hasFlashcards && flashcardCount > 0 && studyProgress ? Math.min((studyProgress.flashcards_reviewed / flashcardCount) * 100, 100) : 0}
                            size={80}
                            strokeWidth={6}
                            label={studyProgress && hasFlashcards ? `${Math.min(studyProgress.flashcards_reviewed, flashcardCount)}/${flashcardCount}` : "0"}
                            sublabel="cards"
                            indicatorColor="text-blue-500"
                        />
                        <div>
                            <h3 className="font-semibold text-lg">Flashcards</h3>
                            <p className="text-sm text-muted-foreground">{hasFlashcards ? 'Cards Reviewed' : 'Not generated'}</p>
                        </div>
                    </Card>
                    <Card className="glass flex flex-row items-center p-6 gap-6 transition-all hover:shadow-md">
                        <ProgressRing
                            value={hasQuiz && studyProgress ? studyProgress.quiz_score : 0}
                            size={80}
                            strokeWidth={6}
                            label={studyProgress && hasQuiz ? `${studyProgress.quiz_score}%` : "0%"}
                            sublabel="best score"
                            indicatorColor="text-green-500"
                        />
                        <div>
                            <h3 className="font-semibold text-lg">Quiz</h3>
                            <p className="text-sm text-muted-foreground">{studyProgress?.quiz_attempts ? `${studyProgress.quiz_attempts} attempt${studyProgress.quiz_attempts !== 1 ? 's' : ''}` : (hasQuiz ? 'Ready to test' : 'Not generated')}</p>
                        </div>
                    </Card>
                    <Card className="glass flex flex-row items-center p-6 gap-6 transition-all hover:shadow-md">
                        <ProgressRing
                            value={chatCount > 0 ? Math.min(chatCount * 10, 100) : 0}
                            size={80}
                            strokeWidth={6}
                            label={chatCount.toString()}
                            sublabel="messages"
                            indicatorColor="text-purple-500"
                        />
                        <div>
                            <h3 className="font-semibold text-lg">Chat AI</h3>
                            <p className="text-sm text-muted-foreground">Questions asked</p>
                        </div>
                    </Card>
                </div>
            </section>

            <Separator className="opacity-50" />

            {/* Action Cards */}
            <section className="space-y-4 pt-2">
                <h2 className="text-xl font-bold tracking-tight">Activities</h2>
                {status === 'processing' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">Content is currently being processed. Activities will be available once processing is complete.</p>
                    </div>
                )}
                <div className={`grid gap-6 md:grid-cols-3 ${status === 'processing' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Card
                        className="glass group cursor-pointer transition-all duration-300 hover:glow-border hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                        onClick={() => hasFlashcards ? router.push(`/study/${contentId}/flashcards`) : null}
                    >
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <CardHeader className="relative">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <CardTitle className="flex items-center justify-between">
                                Flashcards
                                {hasFlashcards && <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{flashcardCount} cards</Badge>}
                            </CardTitle>
                            <CardDescription className="pt-2 text-sm leading-relaxed">
                                Review extracted key concepts, terms, and facts with interactive flip cards.
                            </CardDescription>
                        </CardHeader>
                        <div className="p-6 pt-0 relative mt-auto">
                            {hasFlashcards ? (
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                                    Start Flashcards <Play className="w-4 h-4 ml-2 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                                    onClick={handleGenerateFlashcards}
                                    disabled={isGeneratingCards}
                                >
                                    {isGeneratingCards ? "Generating..." : "Generate Flashcards"}
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card
                        className="glass group cursor-pointer transition-all duration-300 hover:glow-border hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                        onClick={() => hasQuiz ? router.push(`/study/${contentId}/quiz`) : null}
                    >
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <CardHeader className="relative">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 text-green-500 transition-transform group-hover:scale-110">
                                <BrainCircuit className="h-7 w-7" />
                            </div>
                            <CardTitle className="flex items-center justify-between">
                                Quiz
                                {hasQuiz && <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{quizCount} Qs</Badge>}
                            </CardTitle>
                            <CardDescription className="pt-2 text-sm leading-relaxed">
                                Test your knowledge and comprehension with generated multiple-choice questions.
                            </CardDescription>
                        </CardHeader>
                        <div className="p-6 pt-0 relative mt-auto">
                            {hasQuiz ? (
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors">
                                    Take Quiz <Play className="w-4 h-4 ml-2 fill-current" />
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-green-500/30 text-green-500 hover:bg-green-500/10"
                                    onClick={handleGenerateQuiz}
                                    disabled={isGeneratingQuiz}
                                >
                                    {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card
                        className="glass group cursor-pointer transition-all duration-300 hover:glow-border hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                        onClick={() => router.push(`/study/${contentId}/chat`)}
                    >
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        <CardHeader className="relative">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-110">
                                <MessageSquare className="h-7 w-7" />
                            </div>
                            <CardTitle className="flex items-center justify-between">
                                Chat Assistant
                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">Ready</Badge>
                            </CardTitle>
                            <CardDescription className="pt-2 text-sm leading-relaxed">
                                Ask questions and dive deeper into the specific material with an AI tutor.
                            </CardDescription>
                        </CardHeader>
                        <div className="p-6 pt-0 relative mt-auto flex items-end min-h-[50px]">
                            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                                Open Chat <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
