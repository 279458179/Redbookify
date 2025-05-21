
"use client";

import { useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Loader2, BookText, Sparkles, Image as ImageIcon } from "lucide-react";

const formSchema = z.object({
  bookTitle: z.string().min(2, {
    message: "书名至少需要2个字符。",
  }),
});

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GenerateXiaoHongShuPostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookTitle: "",
    },
  });

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

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8 selection:bg-accent/50 selection:text-accent-foreground">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary-foreground bg-primary py-3 px-6 rounded-lg shadow-md inline-flex items-center">
          <BookText className="mr-3 h-8 w-8" />
          RedBookify
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          输入书名，AI 助您创作引人入胜的小红书笔记和配图！
        </p>
      </header>

      <main className="w-full max-w-2xl">
        <Card className="shadow-xl rounded-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">输入书籍信息</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              提供书名，让我们的 AI 为您量身打造小红书风格的帖子和配图。
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
                  disabled={isLoading}
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
          <Card className="mt-8 shadow-xl rounded-lg">
            <CardContent className="p-6 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent mb-4" />
              <p className="text-muted-foreground text-lg">AI 正在努力创作中，请稍候... (这可能需要一点时间)</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mt-8 shadow-xl rounded-lg bg-destructive text-destructive-foreground">
            <CardHeader>
              <CardTitle className="text-center">生成失败</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {generatedPost && generatedPost.blogPost && (
          <Card className="mt-8 shadow-xl rounded-lg">
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

        {generatedPost && generatedPost.imageUrls && generatedPost.imageUrls.length > 0 && (
          <Card className="mt-8 shadow-xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center">
                <ImageIcon className="mr-2 h-6 w-6 text-accent" />
                建议配图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {generatedPost.imageUrls.map((url, index) => (
                  <div key={index} className="aspect-square relative rounded-md overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow">
                    <Image
                      src={url} // Data URIs from Genkit
                      alt={`Generated image ${index + 1} for ${form.getValues("bookTitle")}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className="transform transition-transform duration-300 hover:scale-105"
                      data-ai-hint="book theme visual" // Generic hint
                      onError={(e) => {
                        // In case Next/Image has an issue with a specific data URI that wasn't caught as an error during generation
                        e.currentTarget.src = 'https://placehold.co/400x400.png?text=Load+Error';
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
                <CardDescription className="text-xs text-center w-full">AI 生成的图片仅供参考，您可以挑选使用或自行创作。</CardDescription>
            </CardFooter>
          </Card>
        )}
      </main>

      <footer className="mt-12 text-center text-muted-foreground text-xs">
        <p>&copy; {new Date().getFullYear()} RedBookify. AI 驱动创作。</p>
      </footer>
    </div>
  );
}
