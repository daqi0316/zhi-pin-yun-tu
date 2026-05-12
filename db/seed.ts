import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { hashSync } from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:723319@localhost:3306/zhypx";

async function seed() {
  const pool = mysql.createPool(DATABASE_URL);
  const db = drizzle(pool, { schema, mode: "default" });

  console.log("🌱 Seeding database...");

  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length > 0) {
    console.log("ℹ️  Database already has data, skipping seed.");
    await pool.end();
    return;
  }

  await db.insert(schema.users).values({
    username: "admin",
    password: hashSync("admin123", 10),
    name: "王芳",
    role: "admin",
  });

  const candidates = [
    { name: "张明远", avatar: "/images/avatar1.jpg", phone: "138****1234", email: "zhangmy@email.com", location: "杭州", position: "高级Java工程师", company: "字节跳动", experience: 8, education: "硕士 · 浙江大学", skills: JSON.stringify(["Java", "Spring Cloud", "Redis", "MySQL", "Kafka"]), status: "在职-考虑机会", source: "猎头推荐", salary: "45-60K", matchScore: 96, intentScore: 85, stage: "offer阶段" },
    { name: "李思涵", avatar: "/images/avatar2.jpg", phone: "139****5678", email: "lish@email.com", location: "上海", position: "产品经理", company: "阿里巴巴", experience: 5, education: "本科 · 复旦大学", skills: JSON.stringify(["产品设计", "数据分析", "Axure", "用户研究", "A/B测试"]), status: "在职-积极求职", source: "内推", salary: "35-50K", matchScore: 92, intentScore: 92, stage: "终面" },
    { name: "王建国", avatar: "/images/avatar3.jpg", phone: "137****9012", email: "wangjg@email.com", location: "深圳", position: "技术总监", company: "腾讯", experience: 12, education: "硕士 · 清华大学", skills: JSON.stringify(["架构设计", "团队管理", "Go", "Kubernetes", "微服务"]), status: "在职-考虑机会", source: "主动投递", salary: "80-120K", matchScore: 89, intentScore: 72, stage: "二面" },
    { name: "陈雅婷", avatar: "/images/avatar4.jpg", phone: "136****3456", email: "chenyt@email.com", location: "北京", position: "前端技术专家", company: "美团", experience: 6, education: "本科 · 华中科技大学", skills: JSON.stringify(["React", "TypeScript", "Node.js", "Webpack", "性能优化"]), status: "离职-随时到岗", source: "LinkedIn", salary: "40-55K", matchScore: 94, intentScore: 96, stage: "一面" },
    { name: "刘浩然", avatar: "/images/avatar5.jpg", phone: "135****7890", email: "liuhr@email.com", location: "北京", position: "数据分析师", company: "滴滴出行", experience: 4, education: "硕士 · 北京大学", skills: JSON.stringify(["SQL", "Python", "Tableau", "统计学", "机器学习"]), status: "在职-考虑机会", source: "Boss直聘", salary: "30-45K", matchScore: 88, intentScore: 78, stage: "初筛" },
    { name: "赵晓萌", avatar: "/images/avatar6.jpg", phone: "134****2345", email: "zhaoxm@email.com", location: "上海", position: "UI/UX设计师", company: "小红书", experience: 5, education: "本科 · 中央美术学院", skills: JSON.stringify(["Figma", "Sketch", "交互设计", "视觉设计", "设计系统"]), status: "在职-积极求职", source: "内推", salary: "28-40K", matchScore: 90, intentScore: 88, stage: "终面" },
    { name: "孙伟强", avatar: "/images/avatar1.jpg", phone: "133****6789", email: "sunwq@email.com", location: "深圳", position: "DevOps工程师", company: "华为", experience: 7, education: "本科 · 西安电子科技大学", skills: JSON.stringify(["Docker", "K8s", "Terraform", "CI/CD", "AWS"]), status: "在职-考虑机会", source: "猎头推荐", salary: "35-50K", matchScore: 87, intentScore: 65, stage: "初筛" },
    { name: "周雨桐", avatar: "/images/avatar2.jpg", phone: "132****0123", email: "zhouyt@email.com", location: "北京", position: "算法工程师", company: "百度", experience: 4, education: "博士 · 中科院", skills: JSON.stringify(["Python", "PyTorch", "NLP", "推荐系统", "深度学习"]), status: "在职-考虑机会", source: "学术会议", salary: "50-70K", matchScore: 93, intentScore: 80, stage: "二面" },
  ];
  await db.insert(schema.candidates).values(candidates);

  const workHistories = [
    { candidateId: 1, company: "字节跳动", position: "高级Java工程师", startDate: "2022.03", description: "负责电商中台系统架构设计与核心模块开发，主导微服务拆分，团队规模15人", isCurrent: 1 },
    { candidateId: 1, company: "蚂蚁集团", position: "Java工程师", startDate: "2019.06", endDate: "2022.02", description: "参与支付核心链路开发，负责高并发场景下的系统优化", isCurrent: 0 },
    { candidateId: 1, company: "网易", position: "初级Java工程师", startDate: "2017.07", endDate: "2019.05", description: "负责后台管理系统开发与维护", isCurrent: 0 },
    { candidateId: 2, company: "阿里巴巴", position: "高级产品经理", startDate: "2023.01", description: "负责企业数字化产品规划，主导3个核心模块从0到1", isCurrent: 1 },
    { candidateId: 2, company: "美团", position: "产品经理", startDate: "2020.07", endDate: "2022.12", description: "负责商家端产品迭代，DAU提升40%", isCurrent: 0 },
    { candidateId: 2, company: "京东", position: "产品助理", startDate: "2018.06", endDate: "2020.06", description: "参与用户增长产品设计", isCurrent: 0 },
    { candidateId: 3, company: "腾讯", position: "技术总监", startDate: "2020.03", description: "负责基础架构团队管理", isCurrent: 1 },
    { candidateId: 3, company: "百度", position: "高级工程师", startDate: "2016.08", endDate: "2020.02", description: "负责搜索架构", isCurrent: 0 },
    { candidateId: 4, company: "美团", position: "前端技术专家", startDate: "2021.05", description: "负责前端架构", isCurrent: 1 },
    { candidateId: 4, company: "字节跳动", position: "前端工程师", startDate: "2018.09", endDate: "2021.04", description: "负责抖音前端", isCurrent: 0 },
    { candidateId: 5, company: "滴滴出行", position: "数据分析师", startDate: "2022.01", description: "负责出行数据分析", isCurrent: 1 },
    { candidateId: 5, company: "京东", position: "数据分析助理", startDate: "2020.07", endDate: "2021.12", description: "负责用户行为分析", isCurrent: 0 },
    { candidateId: 6, company: "小红书", position: "UI/UX设计师", startDate: "2021.06", description: "负责社区产品设计", isCurrent: 1 },
    { candidateId: 6, company: "网易", position: "视觉设计师", startDate: "2019.03", endDate: "2021.05", description: "负责游戏UI设计", isCurrent: 0 },
    { candidateId: 7, company: "华为", position: "DevOps工程师", startDate: "2019.04", description: "负责云服务CI/CD", isCurrent: 1 },
    { candidateId: 7, company: "中兴", position: "运维工程师", startDate: "2017.02", endDate: "2019.03", description: "负责服务器运维", isCurrent: 0 },
    { candidateId: 8, company: "百度", position: "算法工程师", startDate: "2022.06", description: "负责NLP算法研发", isCurrent: 1 },
    { candidateId: 8, company: "微软亚洲研究院", position: "研究实习生", startDate: "2021.03", endDate: "2022.05", description: "参与对话系统研究", isCurrent: 0 },
  ];
  await db.insert(schema.workHistories).values(workHistories);

  const interviews = [
    { candidateId: 1, stage: "技术终面", interviewer: "技术VP · 陈总", scheduledTime: "2026-04-21 14:00", type: "视频", status: "pending" },
    { candidateId: 2, stage: "HR面", interviewer: "HRD · 王芳", scheduledTime: "2026-04-21 16:00", type: "视频", status: "pending" },
    { candidateId: 3, stage: "二面", interviewer: "CTO · 李总", scheduledTime: "2026-04-20 10:00", type: "现场", status: "completed", scoreSkill: 5, scoreProblem: 5, scoreCommunication: 4, scoreTeamwork: 4, scoreCulture: 5, totalScore: 92, feedback: "技术深度优秀，架构思路清晰，领导力突出" },
    { candidateId: 4, stage: "一面", interviewer: "前端负责人 · 张伟", scheduledTime: "2026-04-22 09:30", type: "视频", status: "pending" },
    { candidateId: 5, stage: "初筛", interviewer: "数据主管 · 赵敏", scheduledTime: "2026-04-23 14:00", type: "电话", status: "pending" },
    { candidateId: 6, stage: "设计评审", interviewer: "设计总监 · 林艺", scheduledTime: "2026-04-20 15:00", type: "现场", status: "completed", scoreSkill: 4, scoreProblem: 4, scoreCommunication: 5, scoreTeamwork: 5, scoreCulture: 4, totalScore: 88, feedback: "设计思维出色，作品集质量高，沟通能力良好" },
    { candidateId: 8, stage: "技术二面", interviewer: "算法总监 · 钱进", scheduledTime: "2026-04-22 11:00", type: "视频", status: "pending" },
  ];
  await db.insert(schema.interviews).values(interviews);

  const offers = [
    { candidateId: 1, baseSalary: 52000, bonus: 3, stock: 150000, totalPackage: 774000, status: "negotiating", sentDate: "2026-04-15", deadline: "2026-04-30", recruiter: "王芳", competitorOffers: 2, acceptanceProbability: 72 },
    { candidateId: 2, baseSalary: 40000, bonus: 4, stock: 100000, totalPackage: 580000, status: "sent", sentDate: "2026-04-18", deadline: "2026-05-05", recruiter: "王芳", competitorOffers: 1, acceptanceProbability: 85 },
    { candidateId: 4, baseSalary: 48000, bonus: 3, stock: 120000, totalPackage: 696000, status: "accepted", sentDate: "2026-04-10", deadline: "2026-04-25", recruiter: "赵敏", competitorOffers: 0, acceptanceProbability: 96 },
    { candidateId: 6, baseSalary: 32000, bonus: 3, stock: 80000, totalPackage: 464000, status: "draft", recruiter: "林艺", competitorOffers: 1, acceptanceProbability: 68 },
    { candidateId: 8, baseSalary: 60000, bonus: 4, stock: 200000, totalPackage: 920000, status: "sent", sentDate: "2026-04-17", deadline: "2026-05-02", recruiter: "钱进", competitorOffers: 3, acceptanceProbability: 55 },
  ];
  await db.insert(schema.offers).values(offers);

  const channels = [
    { name: "Boss直聘", type: "招聘平台", applications: 342, interviews: 89, offers: 23, conversionRate: 6.7, cost: 15000, roi: 2.8, status: "active" },
    { name: "猎聘网", type: "猎头平台", applications: 128, interviews: 56, offers: 18, conversionRate: 14.1, cost: 28000, roi: 1.9, status: "active" },
    { name: "智联招聘", type: "招聘平台", applications: 256, interviews: 45, offers: 8, conversionRate: 3.1, cost: 8000, roi: 3.2, status: "active" },
    { name: "员工内推", type: "内部渠道", applications: 67, interviews: 34, offers: 15, conversionRate: 22.4, cost: 5000, roi: 5.6, status: "active" },
    { name: "LinkedIn", type: "社交平台", applications: 89, interviews: 28, offers: 9, conversionRate: 10.1, cost: 12000, roi: 2.1, status: "active" },
    { name: "校园招聘", type: "校园渠道", applications: 198, interviews: 42, offers: 12, conversionRate: 6.1, cost: 35000, roi: 1.2, status: "paused" },
  ];
  await db.insert(schema.channels).values(channels);

  const alerts = [
    { type: "risk", title: "候选人简历更新预警", description: "周雨桐的LinkedIn简历于昨日更新，新增了一项竞对公司的面试经历，Offer接受概率已从72%下降至55%。", candidateId: 8, isRead: 0, action: "立即跟进" },
    { type: "warning", title: "面试爽约风险", description: "刘浩然的电话面试已改期2次，建议确认候选人求职意向。", candidateId: 5, isRead: 0, action: "联系确认" },
    { type: "info", title: "Offer即将过期", description: "陈雅婷的Offer将于3天后(4月25日)到期，候选人尚未签署。", candidateId: 4, isRead: 1, action: "发送提醒" },
    { type: "success", title: "目标达成提醒", description: "本月已成功入职8人，超出月度目标(6人)33%。", isRead: 1 },
    { type: "risk", title: "竞对人才动向", description: "监控显示3名目标候选人近期访问了竞对公司招聘页面，建议激活召回流程。", isRead: 0, action: "查看详情" },
    { type: "warning", title: "渠道ROI下降", description: "智联招聘本月ROI已从3.8降至3.2，建议评估渠道投放策略。", isRead: 1, action: "优化渠道" },
  ];
  await db.insert(schema.alerts).values(alerts);

  const positions = [
    { title: "高级Java工程师", company: "智聘科技", department: "技术部", description: "负责核心业务系统架构设计与开发，主导微服务架构演进，保障系统高可用与性能优化", requiredSkills: JSON.stringify(["Java", "Spring Cloud", "MySQL", "Redis", "Kafka"]), bonusSkills: JSON.stringify(["Go", "Kubernetes", "Elasticsearch"]), minExperience: 5, maxExperience: 10, minEducation: "本科", salaryMin: 35000, salaryMax: 60000, salaryRange: "35K-60K", status: "active" },
    { title: "产品经理", company: "智聘科技", department: "产品部", description: "负责B端SaaS产品规划与迭代，推动数据驱动的产品决策，协调研发与设计团队", requiredSkills: JSON.stringify(["产品设计", "数据分析", "Axure", "用户研究"]), bonusSkills: JSON.stringify(["SQL", "A/B测试", "JIRA"]), minExperience: 3, maxExperience: 8, minEducation: "本科", salaryMin: 30000, salaryMax: 50000, salaryRange: "30K-50K", status: "active" },
    { title: "前端技术专家", company: "智聘科技", department: "技术部", description: "主导前端架构设计与技术选型，搭建前端工程化体系，推动前沿技术落地", requiredSkills: JSON.stringify(["React", "TypeScript", "Node.js", "性能优化"]), bonusSkills: JSON.stringify(["Three.js", "微前端", "Webpack"]), minExperience: 5, maxExperience: 10, minEducation: "本科", salaryMin: 35000, salaryMax: 55000, salaryRange: "35K-55K", status: "active" },
    { title: "算法工程师", company: "智聘科技", department: "AI部", description: "负责NLP和推荐系统算法研发，构建智能化人才匹配引擎", requiredSkills: JSON.stringify(["Python", "PyTorch", "NLP", "深度学习"]), bonusSkills: JSON.stringify(["推荐系统", "大模型", "TensorRT"]), minExperience: 3, maxExperience: 8, minEducation: "硕士", salaryMin: 40000, salaryMax: 70000, salaryRange: "40K-70K", status: "active" },
    { title: "UI/UX设计师", company: "智聘科技", department: "设计部", description: "负责B端产品交互与视觉设计，建设设计系统，推动设计标准化", requiredSkills: JSON.stringify(["Figma", "交互设计", "视觉设计"]), bonusSkills: JSON.stringify(["动效设计", "Design System", "前端开发"]), minExperience: 3, maxExperience: 7, minEducation: "本科", salaryMin: 25000, salaryMax: 40000, salaryRange: "25K-40K", status: "active" },
    { title: "DevOps工程师", company: "智聘科技", department: "基础架构部", description: "负责云原生基础设施运维，CI/CD流水线建设，保障服务稳定运行", requiredSkills: JSON.stringify(["Docker", "Kubernetes", "CI/CD", "AWS/阿里云"]), bonusSkills: JSON.stringify(["Terraform", "Prometheus", "Grafana"]), minExperience: 4, maxExperience: 10, minEducation: "本科", salaryMin: 30000, salaryMax: 50000, salaryRange: "30K-50K", status: "active" },
  ];
  await db.insert(schema.positions).values(positions);

  console.log("✅ Seed data inserted successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});