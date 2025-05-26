
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from 'date-fns';
import { generateXiaoHongShuPost } from "@/ai/flows/generate-xiaohongshu-post";
import type { GenerateXiaoHongShuPostOutput } from "@/ai/flows/generate-xiaohongshu-post";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Loader2, BookText, Sparkles, Image as ImageIcon, Download, History, Trash2, Eye } from "lucide-react";

const formSchema = z.object({
  bookTitle: z.string().min(2, {
    message: "书名至少需要2个字符。",
  }),
});

interface HistoryEntry {
  id: string;
  bookTitle: string;
  generatedContent: GenerateXiaoHongShuPostOutput;
  timestamp: number;
}

const MAX_HISTORY_ITEMS = 10;
const LOCAL_STORAGE_KEY = "redbookifyHistory";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GenerateXiaoHongShuPostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isClearHistoryAlertOpen, setIsClearHistoryAlertOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookTitle: "",
    },
  });

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
      // Optionally clear corrupted history
      // localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const saveToHistory = (bookTitle: string, content: GenerateXiaoHongShuPostOutput) => {
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      bookTitle,
      generatedContent: content,
      timestamp: Date.now(),
    };
    setHistory(prevHistory => {
      const updatedHistory = [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save history to localStorage:", e);
        toast({
          title: "历史记录保存失败",
          description: "浏览器存储空间可能已满。",
          variant: "destructive",
        });
      }
      return updatedHistory;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear history from localStorage:", e);
    }
    setIsClearHistoryAlertOpen(false);
    toast({ title: "历史记录已清空" });
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    form.setValue("bookTitle", entry.bookTitle);
    setGeneratedPost(entry.generatedContent);
    setError(null); // Clear any previous errors
    setIsHistoryModalOpen(false); // Close history modal
    // Scroll to top to see the loaded content
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedPost(null);
    setError(null);

    try {
      const placeholderScrapedContent = `关于 "${values.bookTitle}" 的一些通用占位符内容。
读者发现这本书引人入胜，因为它情节错综复杂，角色 relatable。
网络上的许多讨论都围绕着其出乎意料的转折和所探讨的深刻主题展开。
流行的引言和粉丝理论也被广泛分享。
该书因其独特的叙事方式获得了众多赞誉。
`;

      const result = await generateXiaoHongShuPost({
        bookTitle: values.bookTitle,
        scrapedContent: placeholderScrapedContent,
      });
      setGeneratedPost(result);
      saveToHistory(values.bookTitle, result); // Save to history on success
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "发生未知错误。";
      setError(`生成内容失败: ${errorMessage}`);
      toast({
        title: "错误",
        description: `生成内容失败: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBatchDownload = async () => {
    if (!generatedPost || !generatedPost.imageUrls || generatedPost.imageUrls.length === 0) {
      toast({ title: "没有图片可供下载", variant: "destructive" });
      return;
    }
    setIsBatchDownloading(true);
    toast({ title: "开始批量下载", description: "请注意浏览器可能会提示多次或阻止部分下载。" });

    const bookTitleSlug = slugify(form.getValues("bookTitle") || "image");

    for (let i = 0; i < generatedPost.imageUrls.length; i++) {
      const url = generatedPost.imageUrls[i];
      if (url && (url.startsWith('data:image') || url.includes('placehold.co'))) {
         triggerDownload(url, `redbookify-image-${i + 1}-${bookTitleSlug}.png`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn(`Skipping download for invalid or missing URL: ${url}`);
      }
    }
    setIsBatchDownloading(false);
    toast({ title: "批量下载处理完成", description: "如果部分图片未下载，请尝试单独下载。" });
  };


  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8 selection:bg-accent/50 selection:text-accent-foreground">
      <header className="w-full max-w-2xl mb-10 text-center">
        <div className="flex justify-center items-center relative">
          <h1 className="text-4xl font-bold text-primary-foreground bg-primary py-3 px-6 rounded-lg shadow-md inline-flex items-center">
            <BookText className="mr-3 h-8 w-8" />
            RedBookify
          </h1>
          <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 ml-4" title="查看历史记录">
                <History className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>生成历史</DialogTitle>
                <DialogDescription>
                  查看您最近生成的笔记。点击条目加载到主页面。最多保存 {MAX_HISTORY_ITEMS} 条记录。
                </DialogDescription>
              </DialogHeader>
              {history.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <Card key={entry.id} className="overflow-hidden">
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{entry.bookTitle}</CardTitle>
                          <CardDescription className="text-xs">
                            {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                           <Button variant="outline" size="sm" onClick={() => loadHistoryEntry(entry)}>
                            <Eye className="mr-2 h-4 w-4" />
                            查看
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-8">暂无历史记录。</p>
              )}
              <DialogFooter className="mt-4 sm:justify-between">
                {history.length > 0 && (
                  <AlertDialog open={isClearHistoryAlertOpen} onOpenChange={setIsClearHistoryAlertOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        清空历史
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确定要清空所有历史记录吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作无法撤销，所有已保存的生成记录将被永久删除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearHistory}>确定清空</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <DialogClose asChild>
                  <Button variant="outline" size="sm">关闭</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mt-4 text-lg">
          输入书名，AI 助您创作引人入胜的小红书笔记和配图！
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <Card className="shadow-xl rounded-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">输入书籍信息</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              提供书名，让我们的 AI 为您量身打造小红书风格的帖子、封面和配图。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="bookTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md font-medium">书名</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例如：《三体》"
                          {...field}
                          className="text-base py-5 px-4 rounded-md focus:ring-ring focus:border-ring"
                          aria-label="Book Title Input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading || isBatchDownloading}
                  className="w-full py-5 text-md rounded-md bg-accent text-accent-foreground hover:bg-accent/90 focus:ring-accent"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      生成图文笔记
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && !generatedPost && !error && (
          <Card className="mt-8 shadow-xl rounded-lg mb-8">
            <CardContent className="p-6 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent mb-4" />
              <p className="text-muted-foreground text-lg">AI 正在努力创作中，请稍候... (这可能需要一些时间，尤其是在生成图片时)</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mt-8 shadow-xl rounded-lg bg-destructive text-destructive-foreground mb-8">
            <CardHeader>
              <CardTitle className="text-center">生成失败</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {generatedPost && generatedPost.blogPost && (
          <Card className="mt-8 shadow-xl rounded-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center">您的小红书笔记</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] md:h-[400px] w-full rounded-md border border-border p-4 bg-secondary/50">
                <div
                  className="whitespace-pre-wrap text-foreground text-sm md:text-base leading-relaxed"
                >
                  {generatedPost.blogPost}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        
        {generatedPost && generatedPost.coverImageUrl && (
          <Card className="mt-8 shadow-xl rounded-lg mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center">
                <ImageIcon className="mr-2 h-6 w-6 text-accent" />
                建议封面图 (3:4)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <a
                href={generatedPost.coverImageUrl}
                download={`redbookify-cover-${slugify(form.getValues("bookTitle") || "image")}.png`}
                className="block group relative aspect-[3/4] w-full max-w-xs sm:max-w-sm md:max-w-md rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow"
                title="Download Cover Image"
              >
                <Image
                  src={generatedPost.coverImageUrl}
                  alt={`Generated cover image for ${form.getValues("bookTitle")}`}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className="transform transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint="book cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/300x400.png?text=Load+Error';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                  <Download className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </a>
            </CardContent>
             <CardFooter>
                <CardDescription className="text-xs text-center w-full">点击图片下载封面。AI 生成的图片仅供参考。</CardDescription>
            </CardFooter>
          </Card>
        )}

        {generatedPost && generatedPost.imageUrls && generatedPost.imageUrls.length > 0 && (
          <Card className="mt-8 shadow-xl rounded-lg mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-center flex items-center">
                  <ImageIcon className="mr-2 h-6 w-6 text-accent" />
                  建议配图 (3:4)
                </CardTitle>
                <Button
                  onClick={handleBatchDownload}
                  disabled={isBatchDownloading || isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isBatchDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  批量下载
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {generatedPost.imageUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    download={`redbookify-image-${index + 1}-${slugify(form.getValues("bookTitle") || "image")}.png`}
                    className="block group relative aspect-[3/4] rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow"
                    title={`Download Image ${index + 1}`}
                  >
                    <Image
                      src={url} 
                      alt={`Generated image ${index + 1} for ${form.getValues("bookTitle")}`}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 22vw"
                      style={{ objectFit: 'cover' }}
                      className="transform transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint="book theme vertical"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/300x400.png?text=Load+Error';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                      <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
            <CardFooter>
                <CardDescription className="text-xs text-center w-full">点击图片单独下载。批量下载可能受浏览器限制。AI 生成图片仅供参考。</CardDescription>
            </CardFooter>
          </Card>
        )}
      </main>

      <footer className="mt-12 text-center text-muted-foreground text-xs">
        <p>&copy; {new Date().getFullYear()} RedBookify. AI 驱动创作。</p>
        <p className="mt-1 text-xs text-muted-foreground/80">请注意：AI 生成的内容（包括文字和图片）可能需要修改和调整以达到最佳效果。直接在图片上生成特定文字（如书摘）对当前AI模型仍有挑战，建议图片以主题和氛围为主。</p>
      </footer>
    </div>
  );
}

