// This is an AI-powered function that generates a XiaoHongShu-style blog post based on a given book title.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview Generates a XiaoHongShu-style blog post from a book title.
 *
 * - generateXiaoHongShuPost - A function that generates a XiaoHongShu-style blog post.
 * - GenerateXiaoHongShuPostInput - The input type for the generateXiaoHongShuPost function.
 * - GenerateXiaoHongShuPostOutput - The return type for the generateXiaoHongShuPost function.
 */

const GenerateXiaoHongShuPostInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book to generate a blog post for.'),
  scrapedContent: z.string().optional().describe('The scraped content from websites.'),
});

export type GenerateXiaoHongShuPostInput = z.infer<typeof GenerateXiaoHongShuPostInputSchema>;

const GenerateXiaoHongShuPostOutputSchema = z.object({
  blogPost: z.string().describe('The generated XiaoHongShu-style blog post.'),
});

export type GenerateXiaoHongShuPostOutput = z.infer<typeof GenerateXiaoHongShuPostOutputSchema>;

export async function generateXiaoHongShuPost(
  input: GenerateXiaoHongShuPostInput
): Promise<GenerateXiaoHongShuPostOutput> {
  return generateXiaoHongShuPostFlow(input);
}

const generateXiaoHongShuPostPrompt = ai.definePrompt({
  name: 'generateXiaoHongShuPostPrompt',
  input: {schema: GenerateXiaoHongShuPostInputSchema},
  output: {schema: GenerateXiaoHongShuPostOutputSchema},
  prompt: `You are an expert social media content creator, specializing in the XiaoHongShu (Little Red Book) platform.
Your primary goal is to generate an engaging and insightful blog post about the book titled "{{{bookTitle}}}".
If available, use the following scraped content for additional context:
{{{scrapedContent}}}

To craft a high-quality post that resonates with the XiaoHongShu audience, please utilize the following advanced content generation strategies and examples. You can select the most fitting strategy or combine elements from several. The final output must be in Chinese, incorporate emojis and relevant hashtags, maintain a conversational tone, and be approximately 300-500 words, structured with short paragraphs and potentially headings.

**Content Generation Strategies & Examples (参照以下模板进行创作):**

**1. 明确书籍类型+核心受众 (Clarify Book Type + Core Audience)**
"请分析《{{{bookTitle}}}》中3个最能引发[XX人群，请根据书籍内容具体化，例如：年轻职场女性、初为人母的妈妈、创业者等]共鸣的情节，比如[情感困境/职场难题/成长痛点，请根据书籍内容具体化]相关片段。需要具体到角色在[某个具体场景]中的心理转折，例如主人公如何用[某个方法]解决[某个具体问题]。"
*示例：《被讨厌的勇气》中3个最能引发25-35岁职场人共鸣的对话片段，比如面对同事过度索求时如何设立边界的具体案例，要求包含哲人与青年在咖啡厅辩论的逐句对话。*

**2. 痛点具象化+解决方案提取 (Concrete Pain Points + Solution Extraction)**
"提取书中解决[具体痛点，例如：拖延症、沟通障碍、情绪内耗等]的颠覆性观点，对比常规认知：例如当大多数人认为[常见误区]时，书中通过[某角色故事/具体章节内容]证明了[反常识结论]，需要包含[数据/实验结果/人物前后对比，如有则引用]等说服要素。"
*示例：在《原子习惯》中提取关于'习惯养成无需21天'的颠覆理论，对比传统认知时要求引用书中健身房会员打卡实验数据，以及女主通过2分钟法则改变作息的完整故事链。*

**3. 场景化片段+感官描写 (Scene-based Snippets + Sensory Descriptions)**
"寻找包含五感描写的关键场景：比如深夜办公室的键盘声/咖啡凉透的触感/项目失败后地铁站台的冷风，要求该片段同时展现[某种人性洞察]，类似'她发现自己拼命追逐的KPI不过是贴在墓碑上的奖状'这类隐喻。"

**4. 金句二次创作公式 (Golden Sentence Re-creation Formula)**
"将书中[某个复杂理论/核心观点]转化为'痛点+比喻+行动指令'句式：例如'当你在[具体场景]反复陷入[某种痛苦]，就像[某个隐喻物]，记住[书中解决方案提炼成具体行动步骤]，就像书中[某人物]在[某章节]的做法'。"
*示例：把《非暴力沟通》的观察-感受-需求-请求框架转化为：'当下次伴侣说“你从不关心我”时，别急着辩解（停止动作），像第三章的咨询师那样问“你感到孤独是因为希望周末一起做饭吗？”（书中方法具象化）''*

**5. 悬念结构设计 (Suspense Structure Design)**
"用书中[某个未解谜题/关键转折点]设计互动钩子：'所有人都以为[常规结局/普遍看法]，但[书中人物]在[某页码/某章节]撕碎合同时的冷笑表明...（截断在关键点），评论区猜TA如何破局/接下来会发生什么，明晚揭晓答案/一起讨论'。"

**进阶技巧 (Advanced Techniques):**

*   **认知冲突法 (Cognitive Conflict Method):** "列出书中3个违反直觉的结论，例如'拖延不是时间管理问题而是情绪调节失败'，并匹配对应的书中案例或论证片段。"
*   **时间锚点法 (Time Anchor Method):** "提取包含明确时间地点的片段增强真实感：'2016年11月8日纽约地铁站，投资人看到流浪汉举的牌子写着...这个场景如何改变了他的财富观？' （请从书中寻找类似细节）"
*   **多维度证据链 (Multi-dimensional Evidence Chain):** "请将书中某个核心理论拆解为：1个实验数据（如有）+1个企业/名人案例（如有）+1个角色故事片段+1句专家/作者访谈引语（如有）。"

**请确保最终生成的笔记:**
*   具有具体场景代入感
*   能引发认知冲突和好奇感
*   提供可视化的解决方案或启发
*   包含符合平台算法的互动要素 (如提问、悬念、引导评论)
*   语言为简体中文。
`,
});

const generateXiaoHongShuPostFlow = ai.defineFlow(
  {
    name: 'generateXiaoHongShuPostFlow',
    inputSchema: GenerateXiaoHongShuPostInputSchema,
    outputSchema: GenerateXiaoHongShuPostOutputSchema,
  },
  async input => {
    const {output} = await generateXiaoHongShuPostPrompt(input);
    return output!;
  }
);
