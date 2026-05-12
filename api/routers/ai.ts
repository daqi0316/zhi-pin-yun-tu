import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../../db/connection";
import { interviews, candidates } from "../../db/schema";
import { eq } from "drizzle-orm";
import { chat, type ChatMessage } from "../kimi/platform";
import { env } from "../lib/env";

const RECRUITMENT_SYSTEM_PROMPT = `你是「智聘云图」招聘管理系统中的AI招聘助手。你的职责是帮助HR和招聘经理完成以下任务：

1. **智能匹配候选人**：分析候选人画像与岗位要求的匹配度
2. **生成招聘数据报表**：解读招聘漏斗、渠道转化、人才效率等数据
3. **分析渠道转化效率**：评估不同招聘渠道的ROI和效果
4. **预警人才流失风险**：识别可能流失的候选人和关键岗位空缺
5. **面试评估辅助**：基于BARS评分生成面试评语和建议

请用专业、简洁的中文回复。对于数据分析类问题，给出具体的数据洞察和可执行的建议。`;

export const aiRouter = createRouter({
  chat: createRouter({
    send: authedQuery
      .input(
        z.object({
          message: z.string().min(1),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional(),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const apiKey = env.kimiApiKey;
        if (!apiKey) {
          throw new Error("KIMI_API_KEY 未配置，请在 .env 中设置");
        }

        const messages: ChatMessage[] = [
          {
            role: "system",
            content: input.context
              ? `${RECRUITMENT_SYSTEM_PROMPT}\n\n当前页面上下文：${input.context}`
              : RECRUITMENT_SYSTEM_PROMPT,
          },
        ];

        if (input.history) {
          for (const h of input.history.slice(-20)) {
            messages.push({ role: h.role, content: h.content });
          }
        }

        messages.push({ role: "user", content: input.message });

        const result = await chat.completions(messages, apiKey);
        if (!result || !result.choices?.[0]?.message) {
          throw new Error("Kimi API 返回空响应");
        }

        return {
          reply: result.choices[0].message.content,
          model: result.model,
        };
      }),
  }),

  interview: createRouter({
    generateFeedback: authedQuery
      .input(
        z.object({
          interviewId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const apiKey = env.kimiApiKey;
        if (!apiKey) {
          throw new Error("KIMI_API_KEY 未配置，请在 .env 中设置");
        }

        const db = getDb();
        const [iv] = await db
          .select()
          .from(interviews)
          .where(eq(interviews.id, input.interviewId))
          .limit(1);
        if (!iv) throw new Error("面试记录不存在");

        const [candidate] = await db
          .select()
          .from(candidates)
          .where(eq(candidates.id, iv.candidateId))
          .limit(1);

        const dimensions = [
          { name: "专业技能", score: iv.scoreSkill, weight: 30, descriptions: [
            "几乎不具备岗位要求的核心技能",
            "技能基础薄弱，仅停留在理论层面",
            "具备基本技能，能完成常规任务，但深度不足",
            "熟练掌握核心技能，能独立完成复杂任务",
            "对核心技能有深度理解，能回答原理性问题，有实际项目落地经验",
          ]},
          { name: "问题解决", score: iv.scoreProblem, weight: 20, descriptions: [
            "面对问题无从下手，缺乏逻辑思维",
            "只能按照既定流程解决问题，缺乏独立判断",
            "能解决常规问题，但面对复杂问题缺乏系统性",
            "能快速定位问题核心，给出合理的解决路径",
            "能系统性地拆解复杂问题，提出多套方案并权衡优劣",
          ]},
          { name: "沟通表达", score: iv.scoreCommunication, weight: 20, descriptions: [
            "沟通困难，难以理解其意图",
            "表达混乱，抓不住重点",
            "表达基本清楚，偶尔需要追问才能理解要点",
            "表达流畅，逻辑清晰，能有效传递信息",
            "表达清晰有条理，能根据听众调整表达方式，善于说服和推动",
          ]},
          { name: "团队协作", score: iv.scoreTeamwork, weight: 15, descriptions: [
            "无法融入团队，有协作冲突历史",
            "合作意识薄弱，倾向于单打独斗",
            "能完成自己分内工作，但较少主动协作",
            "良好合作者，能配合团队完成任务",
            "善于跨团队协作，能主动补位，推动团队目标达成",
          ]},
          { name: "文化匹配", score: iv.scoreCulture, weight: 15, descriptions: [
            "明显不匹配（如只看重薪资、对公司业务缺乏认同）",
            "存在一定价值观差异或动机不纯",
            "无明显冲突，但匹配度一般",
            "价值观基本一致，求职动机合理",
            "价值观高度契合，对行业有热情，职业规划与公司方向一致",
          ]},
        ];

        const scoredDims = dimensions
          .filter(d => d.score != null)
          .map(d => ({
            ...d,
            desc: d.descriptions[(d.score ?? 1) - 1] || "",
          }));

        const dimsText = scoredDims
          .map(d => `- ${d.name}(权重${d.weight}%): ${d.score}/5 — ${d.desc}`)
          .join("\n");

        const prompt = `请根据以下BARS行为锚定面试评分，生成一段专业的面试综合评语。要求：
1. 先总体评价（50字左右），概括候选人综合表现
2. 再逐维度给出具体评价（每维度1-2句）
3. 最后给出综合建议（是否推荐进入下一轮/录用）
4. 语言专业、客观，总字数200-400字

候选人：${candidate?.name || `#${iv.candidateId}`}
面试阶段：${iv.stage || "未指定"}
面试官：${iv.interviewer || "未指定"}
综合得分：${iv.totalScore || "未评分"}分

各维度评分：
${dimsText}

请生成评语：`;

        const messages: ChatMessage[] = [
          {
            role: "system",
            content: "你是一位资深的HR面试官和招聘专家，擅长撰写专业、客观的面试评估报告。",
          },
          {
            role: "user",
            content: prompt,
          },
        ];

        const result = await chat.completions(messages, apiKey);
        if (!result || !result.choices?.[0]?.message) {
          throw new Error("Kimi API 返回空响应");
        }

        const feedback = result.choices[0].message.content;

        await db
          .update(interviews)
          .set({ feedback })
          .where(eq(interviews.id, input.interviewId));

        return { feedback };
      }),
  }),
});
