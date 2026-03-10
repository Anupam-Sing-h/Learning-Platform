"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Youtube, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Content } from "@/types";

export default function HomePage() {
  const router = useRouter();

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYoutubeValid, setIsYoutubeValid] = useState<boolean | null>(null);
  const [isProcessingYoutube, setIsProcessingYoutube] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const [recentUploads, setRecentUploads] = useState<Content[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  const fetchRecentUploads = async () => {
    try {
      const response = await api.getContents();
      // Assuming API returns all contents in ascending/descending order
      // Just slice the first 3
      setRecentUploads(response.contents.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  const validateYoutubeUrl = (url: string) => {
    setYoutubeUrl(url);
    if (!url) {
      setIsYoutubeValid(null);
      return;
    }
    // Basic YouTube regex matching https://www.youtube.com/watch?v=... and https://youtu.be/...
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    setIsYoutubeValid(regex.test(url));
  };

  const simulateProgress = () => {
    setProgress(0);
    setProgressText("Extracting content...");

    setTimeout(() => { setProgress(33); setProgressText("Generating embeddings..."); }, 1500);
    setTimeout(() => { setProgress(66); setProgressText("Storing in database..."); }, 3000);
    setTimeout(() => { setProgress(90); setProgressText("Almost ready..."); }, 4500);
  };

  const handleProcessYoutube = async () => {
    if (!isYoutubeValid) return;

    setIsProcessingYoutube(true);
    simulateProgress();

    try {
      const result = await api.processVideo(youtubeUrl);
      setProgress(100);
      setProgressText("Ready!");
      toast.success("Content processed successfully!");

      sessionStorage.setItem(`content_init_${result.content_id}`, JSON.stringify({
        title: result.title,
        status: result.status,
        type: 'youtube'
      }));

      setTimeout(() => router.push(`/study/${result.content_id}`), 500);
    } catch (error) {
      toast.error("Failed to process video", { description: error instanceof Error ? error.message : "Unknown error" });
      setIsProcessingYoutube(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", { description: "Please upload a PDF file." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 20MB." });
      return;
    }

    setPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleProcessPdf = async () => {
    if (!pdfFile) return;

    setIsProcessingPdf(true);
    simulateProgress();

    try {
      const result = await api.processPdf(pdfFile);
      setProgress(100);
      setProgressText("Ready!");
      toast.success("Content processed successfully!");

      sessionStorage.setItem(`content_init_${result.content_id}`, JSON.stringify({
        title: result.title,
        status: result.status,
        type: 'pdf'
      }));

      setTimeout(() => router.push(`/study/${result.content_id}`), 500);
    } catch (error) {
      toast.error("Failed to process PDF", { description: error instanceof Error ? error.message : "Unknown error" });
      setIsProcessingPdf(false);
      setProgress(0);
    }
  };

  const isProcessing = isProcessingYoutube || isProcessingPdf;

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-12 pt-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#110826] p-12 text-center md:p-20 shadow-2xl outline-1 outline-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/30 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Transform Any Content Into Interactive Learning
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Paste a YouTube URL or upload a PDF to generate flashcards, quizzes, and chat with AI
          </p>
        </div>
      </section>

      {/* Upload Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* YouTube Card */}
        <Card className="glass glass-strong group relative overflow-hidden transition-all hover:glow-border flex flex-col">
          <CardHeader className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-transform group-hover:scale-110 duration-300">
                <Youtube className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="border-red-500/30 text-red-500 font-medium">Video</Badge>
            </div>
            <CardTitle className="text-xl">YouTube Video</CardTitle>
            <CardDescription>
              Paste a URL to extract the transcript and generate study materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex-1">
            <div className="relative flex items-center">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => validateYoutubeUrl(e.target.value)}
                disabled={isProcessing}
                className="pr-10"
              />
              {isYoutubeValid === true && (
                <CheckCircle2 className="absolute right-3 h-5 w-5 text-green-500" />
              )}
              {isYoutubeValid === false && (
                <XCircle className="absolute right-3 h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
          <CardFooter className="relative flex-col items-stretch space-y-4 pt-0">
            <Button
              onClick={handleProcessYoutube}
              disabled={!isYoutubeValid || isProcessing}
              className="w-full transition-all duration-300 relative overflow-hidden"
            >
              {isProcessingYoutube ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Video"
              )}
            </Button>

            {isProcessingYoutube && (
              <div className="space-y-2 fade-in">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>{progressText}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardFooter>
        </Card>

        {/* PDF Card */}
        <Card className="glass glass-strong group relative overflow-hidden transition-all hover:glow-border flex flex-col">
          <CardHeader className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-110 duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="border-blue-500/30 text-blue-500 font-medium">PDF</Badge>
            </div>
            <CardTitle className="text-xl">PDF Document</CardTitle>
            <CardDescription>
              Upload a document to extract text and generate interactive tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative flex-1">
            <div
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all duration-300 ${pdfFile ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 bg-muted/10'} p-8 text-center hover:border-primary/50 hover:bg-primary/5 cursor-pointer`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <Upload className={`h-8 w-8 mb-2 transition-colors duration-300 ${pdfFile ? 'text-primary' : 'text-muted-foreground'}`} />
              {pdfFile ? (
                <>
                  <p className="text-sm font-semibold text-primary truncate max-w-[200px]">{pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">Drag & drop your PDF here</p>
                  <p className="text-xs text-muted-foreground">or click to browse (max 20MB)</p>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="relative flex-col items-stretch space-y-4 pt-0">
            <Button
              onClick={handleProcessPdf}
              disabled={!pdfFile || isProcessing}
              className="w-full transition-all duration-300 relative overflow-hidden"
            >
              {isProcessingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload & Process"
              )}
            </Button>

            {isProcessingPdf && (
              <div className="space-y-2 fade-in">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>{progressText}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardFooter>
        </Card>
      </section>

      {/* Recent Uploads Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Content</h2>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => router.push('/library')}>
            View all
          </Button>
        </div>

        {isLoadingUploads ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[90px] w-full rounded-xl" />
            ))}
          </div>
        ) : recentUploads.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recentUploads.map((content) => (
              <Card
                key={content.id}
                className="glass cursor-pointer overflow-hidden transition-all duration-300 hover:glow-border hover:shadow-md hover:-translate-y-1"
                onClick={() => router.push(`/study/${content.id}`)}
              >
                <div className="p-4 flex gap-4 items-center h-full text-left">
                  <div className={`shrink-0 p-3 rounded-xl transition-colors ${content.source_type === 'youtube' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {content.source_type === 'youtube' ? <Youtube className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="overflow-hidden flex-1 space-y-1">
                    <h3 className="font-semibold truncate text-sm leading-tight text-foreground">{content.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium capitalize">
                        {content.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass border-dashed !bg-transparent">
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 opacity-40" />
              </div>
              <p className="font-medium text-foreground">No content processed yet</p>
              <p className="text-sm mt-1">Upload a YouTube video or PDF to get started.</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
