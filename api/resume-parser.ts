export interface ParsedWorkHistory {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

export interface ParsedResume {
  name: string;
  phone: string;
  email: string;
  location: string;
  position: string;
  education: string;
  skills: string[];
  workHistory: ParsedWorkHistory[];
}

function extractSection(text: string, header: string): string {
  const lines = text.split("\n");
  const headerIdx = lines.findIndex(l => l.trim() === header);
  if (headerIdx === -1) return "";
  const result: string[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line === header) continue;
    if (isSectionHeader(line, header)) break;
    result.push(lines[i]);
  }
  return result.join("\n");
}

function isSectionHeader(line: string, currentHeader: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (t === currentHeader) return false;
  if (t.includes("：") || t.includes(":")) return false;
  if (/^\d{4}[.\-/年]/.test(t)) return false;
  if (t.startsWith("-") || t.startsWith("·") || t.startsWith("•")) return false;
  if (t.length <= 8 && /^[\u4e00-\u9fa5a-zA-Z]+$/.test(t)) return true;
  return false;
}

function extractBasicLine(text: string, label: string): string {
  const re = new RegExp(`(?:${label})[：:]\\s*([^\\n]+)`, "u");
  const m = text.match(re);
  return m?.[1]?.trim() ?? "";
}

function parseWorkHistory(sectionText: string): ParsedWorkHistory[] {
  const entries: ParsedWorkHistory[] = [];
  const dateRangeRe = /(\d{4}\.\d{2})\s*[-–—~至]\s*(\d{4}\.\d{2}|至今)/;
  const companyLineRe =
    /^(\d{4}\.\d{2})\s*[-–—~至]\s*(.*?)\s{2,}(.*?)\s{2,}(.*)/;

  const blocks = sectionText.split(/\n(?=\d{4}\.\d{2})/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.trim().split("\n");
    const firstLine = lines[0];
    const dm = firstLine.match(dateRangeRe);
    if (!dm) continue;

    const startDate = dm[1];
    const endDate = dm[2] === "至今" ? "" : dm[2];
    const isCurrent = dm[2] === "至今";

    const afterDate = firstLine
      .slice(firstLine.indexOf(dm[0]) + dm[0].length)
      .trim();
    const parts = afterDate.split(/\s{2,}/).filter(Boolean);
    const company = parts[0] || "";
    const position = parts[1] || "";

    const descLines = lines
      .slice(1)
      .map(l => l.replace(/^[-·•]\s*/, "").trim())
      .filter(Boolean);
    const description = descLines.join("；");

    if (company && position) {
      entries.push({
        company,
        position,
        startDate,
        endDate,
        description,
        isCurrent,
      });
    }
  }
  return entries;
}

export function parseResumeText(text: string): ParsedResume {
  const basicSection = extractSection(text, "基本信息");

  return {
    name: extractBasicLine(basicSection, "姓名"),
    phone: extractBasicLine(basicSection, "电话|手机"),
    email: extractBasicLine(basicSection, "邮箱|Email"),
    location: extractBasicLine(basicSection, "所在地|地点"),
    position: extractBasicLine(basicSection, "求职意向|应聘职位"),
    education: extractSection(text, "教育背景").split("\n")[0]?.trim() || "",
    skills: extractSection(text, "技能专长")
      .split("\n")
      .map(l => l.replace(/^[-·•]\s*/, "").trim())
      .filter(Boolean)
      .map(l => l.replace(/：.*$/, "").trim())
      .filter(l => l.length < 30 && l.length > 1),
    workHistory: parseWorkHistory(extractSection(text, "工作经历")),
  };
}
