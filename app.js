(() => {
  "use strict";

  const STORAGE_KEY = "sanyuan.personal-workbench.v1";
  const LEGACY_STORAGE_KEY = "qinghe.personal-workbench.v1";
  const TYPES = ["work", "learning", "media", "ideas", "habits", "moods"];
  const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const LIFECYCLE_STAGES = ["讨论调研", "规划立项", "决策评审", "设计", "研发协同", "测试验收", "上线发布", "培训赋能", "运营推广", "复盘"];
  const FULL_SOP = [
    { stage: "讨论调研", title: "完成 30 分钟用户/数据调研纪要", offset: 0, estimate: 0.5 },
    { stage: "规划立项", title: "登记需求池，明确目标、范围与优先级", offset: 1, estimate: 1 },
    { stage: "规划立项", title: "召开业务沟通/KO 会，确认场景与里程碑", offset: 2, estimate: 2 },
    { stage: "决策评审", title: "组织需求评审，记录结论与待办", offset: 3, estimate: 2 },
    { stage: "决策评审", title: "评审后 48 小时内完成修改对齐", offset: 4, estimate: 1.5, key: "reviewAlign" },
    { stage: "设计", title: "完成设计侧/UI 评审与问题闭环", offset: 6, estimate: 2 },
    { stage: "研发协同", title: "完成技术方案评审与排期确认", offset: 7, estimate: 2 },
    { stage: "研发协同", title: "对齐接口字段并排期联调", offset: 8, estimate: 4 },
    { stage: "测试验收", title: "组织测试用例评审", offset: 11, estimate: 1.5 },
    { stage: "研发协同", title: "确认提测日期，完成联调与冒烟", offset: 12, estimate: 3 },
    { stage: "测试验收", title: "完成 UAT 说明会与结果反馈闭环", offset: 14, estimate: 2 },
    { stage: "测试验收", title: "输出验收报告并收口问题", offset: 16, estimate: 2 },
    { stage: "上线发布", title: "召开发布准备会并确认发布清单", offset: 18, estimate: 1.5, key: "releasePrep" },
    { stage: "上线发布", title: "周一上线并输出上线说明", offset: 20, estimate: 1, key: "launch" },
    { stage: "培训赋能", title: "输出操作说明并开展分层培训", offset: 22, estimate: 3 },
    { stage: "运营推广", title: "准备运营货盘/推广清单并收口运营需求", offset: 24, estimate: 2 },
    { stage: "复盘", title: "上线两周内复盘并回流需求池", offset: 35, estimate: 1.5, key: "retrospective" }
  ];
  const T5T_DEFAULT = {
    enabled: true, time: "18:30", workdaysOnly: true, notify: false,
    lastRunDate: "", lastSkippedDate: "", holidays: [], makeupDays: [],
    dingTalk: { date: "", logs: "", calendar: "" }
  };

  const LIGHT_SOP = [
    { stage: "讨论调研", title: "补齐用户/数据证据并输出调研纪要", offset: 0, estimate: 0.5 },
    { stage: "规划立项", title: "完成需求池登记、KO 与里程碑排期", offset: 2, estimate: 2 },
    { stage: "决策评审", title: "完成需求评审及 48 小时修改对齐", offset: 4, estimate: 2 },
    { stage: "设计", title: "完成设计侧/UI 评审", offset: 6, estimate: 2 },
    { stage: "研发协同", title: "完成技术评审、接口对齐、联调与提测", offset: 8, estimate: 5 },
    { stage: "测试验收", title: "完成测试用例、UAT 与验收报告", offset: 12, estimate: 3 },
    { stage: "上线发布", title: "完成发布准备、周一上线与上线说明", offset: 16, estimate: 2, key: "launch" },
    { stage: "培训赋能", title: "完成操作说明与分层培训", offset: 18, estimate: 2 },
    { stage: "运营推广", title: "完成运营货盘与推广清单", offset: 20, estimate: 2 },
    { stage: "复盘", title: "上线两周内完成复盘并回流需求池", offset: 31, estimate: 1.5, key: "retrospective" }
  ];

  const modules = {
    work: {
      label: "工作", singular: "工作任务", icon: "work", kicker: "WORK & PROJECTS",
      description: "收拢任务、优先级与截止日期，让下一步始终清晰。",
      search: "搜索任务、项目或标签…",
      statuses: [["todo", "待开始"], ["doing", "进行中"], ["done", "已完成"]],
      fields: [
        { name: "title", label: "任务名称", type: "text", required: true, full: true, placeholder: "例如：完成季度复盘初稿" },
        { name: "project", label: "所属项目", type: "text", placeholder: "例如：官网改版" },
        { name: "stage", label: "生命周期阶段", type: "select", options: LIFECYCLE_STAGES.map(stage => [stage, stage]), default: "规划立项" },
        { name: "owner", label: "负责人", type: "text", placeholder: "例如：朱萍萍" },
        { name: "priority", label: "优先级", type: "select", options: [["high", "高优先级"], ["medium", "中优先级"], ["low", "低优先级"]], default: "medium" },
        { name: "status", label: "任务状态", type: "select", options: [["todo", "待开始"], ["doing", "进行中"], ["done", "已完成"]], default: "todo" },
        { name: "startDate", label: "开始日期", type: "date" },
        { name: "dueDate", label: "截止日期", type: "date", required: true },
        { name: "estimate", label: "预计工时（小时）", type: "number", min: 0, step: 0.5, default: 1 },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔，例如：产品, 复盘" },
        { name: "notes", label: "任务备注", type: "textarea", full: true, placeholder: "补充目标、协作人或下一步…" },
        { name: "completed", label: "标记为已完成", type: "checkbox" }
      ]
    },
    learning: {
      label: "学习", singular: "学习记录", icon: "learning", kicker: "LEARNING JOURNEY",
      description: "记录学习主题、投入与进度，把积累变成看得见的成长。",
      search: "搜索主题、平台或分类…",
      statuses: [["active", "进行中"], ["paused", "已暂停"], ["done", "已完成"]],
      fields: [
        { name: "title", label: "学习主题", type: "text", required: true, full: true, placeholder: "例如：数据可视化基础" },
        { name: "category", label: "学习分类", type: "text", placeholder: "例如：产品 / 技术" },
        { name: "platform", label: "学习平台", type: "text", placeholder: "例如：得到 / B站 / 纸质书" },
        { name: "status", label: "学习状态", type: "select", options: [["active", "进行中"], ["paused", "已暂停"], ["done", "已完成"]], default: "active" },
        { name: "progress", label: "当前进度（%）", type: "number", min: 0, max: 100, default: 0 },
        { name: "minutes", label: "累计投入（分钟）", type: "number", min: 0, default: 0 },
        { name: "nextDate", label: "下次学习日期", type: "date" },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔" },
        { name: "notes", label: "学习笔记", type: "textarea", full: true, placeholder: "记录一个值得回顾的知识点…" },
        { name: "completed", label: "标记为已完成", type: "checkbox" }
      ]
    },
    media: {
      label: "自媒体", singular: "内容记录", icon: "media", kicker: "CONTENT STUDIO",
      description: "从选题到发布追踪内容进展，并沉淀每一份内容反馈。",
      search: "搜索标题、平台或选题…",
      statuses: [["idea", "选题"], ["draft", "创作中"], ["scheduled", "待发布"], ["published", "已发布"]],
      fields: [
        { name: "title", label: "内容标题", type: "text", required: true, full: true, placeholder: "例如：我的高效晨间流程" },
        { name: "channel", label: "发布平台", type: "text", placeholder: "例如：小红书 / 公众号" },
        { name: "format", label: "内容形式", type: "select", options: [["图文", "图文"], ["短视频", "短视频"], ["长视频", "长视频"], ["播客", "播客"], ["文章", "文章"]], default: "图文" },
        { name: "topic", label: "内容选题", type: "text", full: true, placeholder: "内容所属主题或系列" },
        { name: "status", label: "发布状态", type: "select", options: [["idea", "选题"], ["draft", "创作中"], ["scheduled", "待发布"], ["published", "已发布"]], default: "idea" },
        { name: "publishDate", label: "计划/实际发布日期", type: "date" },
        { name: "views", label: "阅读/播放量", type: "number", min: 0, default: 0 },
        { name: "likes", label: "点赞数", type: "number", min: 0, default: 0 },
        { name: "comments", label: "评论数", type: "number", min: 0, default: 0 },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔" },
        { name: "notes", label: "创作备注", type: "textarea", full: true, placeholder: "记录大纲、素材或复盘结论…" },
        { name: "completed", label: "确认已发布", type: "checkbox" }
      ]
    },
    ideas: {
      label: "灵感", singular: "灵感", icon: "idea", kicker: "IDEA GARDEN",
      description: "先收集，再孵化；不让任何一闪而过的想法轻易丢失。",
      search: "搜索灵感、分类或内容…",
      statuses: [["new", "新收集"], ["incubating", "孵化中"], ["converted", "已转化"]],
      fields: [
        { name: "title", label: "灵感标题", type: "text", required: true, full: true, placeholder: "用一句话概括这个想法" },
        { name: "category", label: "灵感分类", type: "text", placeholder: "例如：产品 / 内容 / 生活" },
        { name: "score", label: "潜力评分（1–5）", type: "number", min: 1, max: 5, default: 3 },
        { name: "status", label: "孵化状态", type: "select", options: [["new", "新收集"], ["incubating", "孵化中"], ["converted", "已转化"]], default: "new" },
        { name: "content", label: "灵感内容", type: "textarea", required: true, full: true, placeholder: "具体想法、触发场景、可以如何行动…" },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔" },
        { name: "notes", label: "补充备注", type: "textarea", full: true },
        { name: "completed", label: "标记为已转化", type: "checkbox" }
      ]
    },
    habits: {
      label: "习惯", singular: "习惯", icon: "habit", kicker: "DAILY RHYTHM",
      description: "关注重复而非完美，用轻量打卡维护自己的节奏。",
      search: "搜索习惯或标签…",
      statuses: [["active", "进行中"], ["paused", "已暂停"], ["checked", "今日已打卡"], ["unchecked", "今日未打卡"]],
      fields: [
        { name: "name", label: "习惯名称", type: "text", required: true, full: true, placeholder: "例如：阅读 30 分钟" },
        { name: "frequency", label: "频率", type: "select", options: [["daily", "每天"], ["weekdays", "工作日"], ["weekly", "每周灵活安排"]], default: "daily" },
        { name: "target", label: "每周目标次数", type: "number", min: 1, max: 7, required: true, default: 7 },
        { name: "unit", label: "打卡单位", type: "text", placeholder: "例如：次 / 天 / 页", default: "次" },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔" },
        { name: "notes", label: "习惯说明", type: "textarea", full: true, placeholder: "为什么想坚持？最小行动是什么？" },
        { name: "active", label: "启用这个习惯", type: "checkbox", default: true }
      ]
    },
    moods: {
      label: "情绪记录", singular: "情绪记录", icon: "mood", kicker: "EMOTIONAL JOURNAL",
      description: "不评判情绪，只诚实观察它、理解它，然后照顾好自己。",
      search: "搜索情绪、触发因素或备注…",
      statuses: [["开心", "开心"], ["充实", "充实"], ["平静", "平静"], ["焦虑", "焦虑"], ["疲惫", "疲惫"], ["低落", "低落"]],
      fields: [
        { name: "date", label: "记录日期", type: "date", required: true },
        { name: "mood", label: "主要情绪", type: "select", options: [["开心", "开心"], ["充实", "充实"], ["平静", "平静"], ["焦虑", "焦虑"], ["疲惫", "疲惫"], ["低落", "低落"]], default: "平静" },
        { name: "score", label: "情绪强度（1–5）", type: "number", min: 1, max: 5, required: true, default: 3, hint: "1 表示低落，5 表示非常好" },
        { name: "energy", label: "精力水平（1–5）", type: "number", min: 1, max: 5, required: true, default: 3 },
        { name: "trigger", label: "可能的触发因素", type: "text", full: true, placeholder: "例如：项目顺利推进 / 睡眠不足" },
        { name: "tags", label: "标签", type: "text", full: true, placeholder: "用逗号分隔" },
        { name: "notes", label: "此刻想记录什么", type: "textarea", full: true, placeholder: "写下感受，不需要组织成完美的句子…" },
        { name: "completed", label: "我已经复盘了这次记录", type: "checkbox" }
      ]
    }
  };

  const priorityMap = { high: ["高优先级", "danger"], medium: ["中优先级", "warning"], low: ["低优先级", "info"] };
  const frequencyMap = { daily: "每天", weekdays: "工作日", weekly: "每周灵活" };

  const main = document.getElementById("appMain");
  const recordDialog = document.getElementById("recordDialog");
  const recordForm = document.getElementById("recordForm");
  const confirmDialog = document.getElementById("confirmDialog");
  const fileInput = document.getElementById("fileInput");
  let confirmCallback = null;
  let loadWarning = "";
  let planImport = null;
  let activeT5tReportId = "";
  let t5tTimer = null;
  let ui = {
    view: ["overview", "planning", "assistant", "automation", ...TYPES].includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview",
    planning: { project: "all", status: "active" },
    assistantDraft: "",
    filters: Object.fromEntries(TYPES.map(type => [type, { query: "", status: "all", sort: "updated" }]))
  };

  function pad(number) { return String(number).padStart(2, "0"); }
  function toDateString(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
  function offsetDate(offset) { return addDays(chinaNowParts().date, offset); }
  function addDays(value, offset) { const date = parseLocalDate(value); date.setDate(date.getDate() + offset); return toDateString(date); }
  function dayDiff(from, to) { return Math.round((parseLocalDate(to) - parseLocalDate(from)) / 86400000); }
  function nextMonday(value) { const date = parseLocalDate(value); const day = date.getDay(); const offset = day === 1 ? 0 : day === 0 ? 1 : 8 - day; date.setDate(date.getDate() + offset); return toDateString(date); }
  function chinaNowParts(date = new Date()) {
    const map = {};
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date).forEach(part => { if (part.type !== "literal") map[part.type] = part.value; });
    return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
  }
  function chinaToday() { return chinaNowParts().date; }
  function chinaClock() { return chinaNowParts().time; }
  function isMainlandWorkday(date) {
    const config = state.settings.t5t;
    if (config.makeupDays.includes(date)) return true;
    if (config.holidays.includes(date)) return false;
    const day = parseLocalDate(date).getDay();
    return day >= 1 && day <= 5;
  }
  function workdayLabel(date) {
    const parsed = parseLocalDate(date);
    return `${parsed.getMonth() + 1}月${parsed.getDate()}日 ${DAY_NAMES[parsed.getDay()]}`;
  }
  function nextT5TRun() {
    const config = state.settings.t5t;
    if (!config.enabled) return { due: false, label: "任务已暂停" };
    const today = chinaToday(), currentTime = chinaClock();
    for (let offset = 0; offset < 370; offset += 1) {
      const date = addDays(today, offset);
      if (config.workdaysOnly && !isMainlandWorkday(date)) continue;
      if (date === today && config.lastRunDate === today) continue;
      if (date === today && currentTime >= config.time) return { due: true, date, label: `今天 ${config.time} · 等待补生成` };
      return { due: false, date, label: `${offset === 0 ? "今天" : offset === 1 ? "明天" : workdayLabel(date)} ${config.time}` };
    }
    return { due: false, label: "暂无可用工作日" };
  }
  function parseImportedDate(value) {
    if (value == null || value === "") return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateString(value);
    if (typeof value === "number" || /^\d{5}(\.\d+)?$/.test(text(value).trim())) {
      const serial = number(value);
      if (serial > 20000 && serial < 80000) { const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000); return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`; }
    }
    const normalized = text(value).trim().replace(/[年月.]/g, "-").replace(/日/g, "").replace(/\//g, "-");
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return "";
    const date = new Date(number(match[1]), number(match[2]) - 1, number(match[3]), 12);
    return Number.isNaN(date.getTime()) ? "" : toDateString(date);
  }
  function isoOffset(offset, hour = 10) { const date = new Date(); date.setDate(date.getDate() + offset); date.setHours(hour, 20, 0, 0); return date.toISOString(); }
  function now() { return new Date().toISOString(); }
  function uid(type) { return `${type}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }
  function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, number(value, min))); }
  function text(value) { return value == null ? "" : String(value); }
  function escapeHtml(value) { return text(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
  function icon(name, className = "") { return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
  function checked(value) { return value ? "checked" : ""; }
  function selected(value, expected) { return value === expected ? "selected" : ""; }
  function formatNumber(value) { return number(value).toLocaleString("zh-CN"); }
  function parseLocalDate(value) { return new Date(`${value}T12:00:00`); }
  function formatDate(value, withYear = false) {
    if (!value) return "未设日期";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return "日期待定";
    return date.toLocaleDateString("zh-CN", withYear ? { year: "numeric", month: "short", day: "numeric" } : { month: "short", day: "numeric" });
  }
  function friendlyDate(value) {
    if (!value) return "未设日期";
    if (value === offsetDate(0)) return "今天";
    if (value === offsetDate(1)) return "明天";
    if (value === offsetDate(-1)) return "昨天";
    return formatDate(value);
  }
  function relativeTime(value) {
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff)) return "最近";
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 172800000) return "昨天";
    return formatDate(toDateString(new Date(value)));
  }
  function getTitle(type, item) { return item.title || item.name || `${item.mood || "情绪"} · ${formatDate(item.date)}`; }
  function getStatusLabel(type, status) { return modules[type].statuses.find(([value]) => value === status)?.[1] || status || "未设置"; }
  function isComplete(type, item) { return type === "habits" ? item.checkins.includes(offsetDate(0)) : Boolean(item.completed); }
  function normalizeTags(value) { return Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split(/[,，]/).map(tag => tag.trim()).filter(Boolean); }

  function sampleData() {
    const stamp = now();
    const data = {
      work: [
        { id: "work-1", title: "完成产品季度复盘初稿", project: "Q4 产品规划", priority: "high", status: "doing", dueDate: offsetDate(0), estimate: 3, tags: ["产品", "复盘"], notes: "整理核心指标、关键项目得失与下一季度机会点。", completed: false, createdAt: isoOffset(-4), updatedAt: isoOffset(0, 9), completedAt: null },
        { id: "work-2", title: "确认新版首页交互走查问题", project: "官网改版", priority: "high", status: "todo", dueDate: offsetDate(1), estimate: 1.5, tags: ["设计", "协作"], notes: "优先检查移动端导航与表单错误状态。", completed: false, createdAt: isoOffset(-2), updatedAt: isoOffset(-1), completedAt: null },
        { id: "work-3", title: "整理用户访谈纪要", project: "用户研究", priority: "medium", status: "done", dueDate: offsetDate(-1), estimate: 2, tags: ["研究"], notes: "已提炼 5 条共性需求并同步团队。", completed: true, createdAt: isoOffset(-5), updatedAt: isoOffset(-1), completedAt: isoOffset(-1, 17) },
        { id: "work-4", title: "准备下周一项目例会材料", project: "Q4 产品规划", priority: "medium", status: "todo", dueDate: offsetDate(3), estimate: 1, tags: ["会议"], notes: "更新里程碑、风险与需要决策的事项。", completed: false, createdAt: isoOffset(-1), updatedAt: isoOffset(-1), completedAt: null },
        { id: "work-5", title: "清理本周邮件与待办", project: "个人运营", priority: "low", status: "done", dueDate: offsetDate(-3), estimate: 0.5, tags: ["整理"], notes: "收件箱已清零。", completed: true, createdAt: isoOffset(-4), updatedAt: isoOffset(-3), completedAt: isoOffset(-3, 18) }
      ],
      learning: [
        { id: "learning-1", title: "数据可视化：从图表到叙事", category: "产品设计", platform: "在线课程", status: "active", progress: 62, minutes: 320, nextDate: offsetDate(0), tags: ["设计", "数据"], notes: "重点复习图表选择与视觉编码，尝试用真实数据练习。", completed: false, createdAt: isoOffset(-12), updatedAt: isoOffset(0, 8) },
        { id: "learning-2", title: "《纳瓦尔宝典》重读", category: "阅读", platform: "微信读书", status: "active", progress: 38, minutes: 180, nextDate: offsetDate(1), tags: ["阅读", "长期主义"], notes: "记录关于专长、杠杆与判断力的段落。", completed: false, createdAt: isoOffset(-8), updatedAt: isoOffset(-1), completedAt: null },
        { id: "learning-3", title: "JavaScript 数组方法复习", category: "技术", platform: "MDN", status: "done", progress: 100, minutes: 95, nextDate: "", tags: ["前端"], notes: "已完成 map、filter、reduce 的练习。", completed: true, createdAt: isoOffset(-10), updatedAt: isoOffset(-2), completedAt: isoOffset(-2, 21) },
        { id: "learning-4", title: "播客：AI 时代的工作流", category: "行业认知", platform: "小宇宙", status: "paused", progress: 20, minutes: 45, nextDate: offsetDate(4), tags: ["AI"], notes: "待整理其中关于个人知识库的部分。", completed: false, createdAt: isoOffset(-3), updatedAt: isoOffset(-3), completedAt: null }
      ],
      media: [
        { id: "media-1", title: "不追求完美的 5 个微习惯", channel: "小红书", format: "图文", topic: "自我管理", status: "published", publishDate: offsetDate(-2), views: 3280, likes: 246, comments: 31, tags: ["习惯", "复盘"], notes: "封面标题清晰，评论区对“最低行动”讨论最多。", completed: true, createdAt: isoOffset(-6), updatedAt: isoOffset(-2), completedAt: isoOffset(-2, 12) },
        { id: "media-2", title: "我的周末数字整理流程", channel: "公众号", format: "文章", topic: "数字生活", status: "scheduled", publishDate: offsetDate(2), views: 0, likes: 0, comments: 0, tags: ["效率"], notes: "还差结尾与两张步骤截图。", completed: false, createdAt: isoOffset(-3), updatedAt: isoOffset(0, 9), completedAt: null },
        { id: "media-3", title: "一张表看懂我的周复盘", channel: "视频号", format: "短视频", topic: "复盘方法", status: "draft", publishDate: offsetDate(5), views: 0, likes: 0, comments: 0, tags: ["复盘", "模板"], notes: "先录屏幕操作，再补旁白。", completed: false, createdAt: isoOffset(-2), updatedAt: isoOffset(-1), completedAt: null },
        { id: "media-4", title: "如何建立一个不留负担的灵感库", channel: "小红书", format: "图文", topic: "知识管理", status: "idea", publishDate: offsetDate(7), views: 0, likes: 0, comments: 0, tags: ["灵感"], notes: "可以从“收集不是目的，转化才是”切入。", completed: false, createdAt: isoOffset(-1), updatedAt: isoOffset(-1), completedAt: null }
      ],
      ideas: [
        { id: "idea-1", title: "做一个低压力周复盘模板", category: "产品", score: 5, status: "incubating", content: "只回答三个问题：什么值得继续、什么应该停止、下周最重要的一件事是什么。", tags: ["复盘", "模板"], notes: "可与自媒体内容联动。", completed: false, createdAt: isoOffset(-3), updatedAt: isoOffset(0, 8), completedAt: null },
        { id: "idea-2", title: "城市散步声音采集计划", category: "生活", score: 4, status: "new", content: "记录不同街区早晨的声音，做一张声音地图。", tags: ["城市", "声音"], notes: "先从家附近三条路线开始。", completed: false, createdAt: isoOffset(-1), updatedAt: isoOffset(-1), completedAt: null },
        { id: "idea-3", title: "习惯打卡的“不断档”替代方案", category: "产品", score: 4, status: "converted", content: "不强调连续天数，而是展示近 7 天完成率，减少断签挫败感。", tags: ["习惯", "设计"], notes: "已应用到当前工作台习惯卡片。", completed: true, createdAt: isoOffset(-8), updatedAt: isoOffset(-2), completedAt: isoOffset(-2, 15) },
        { id: "idea-4", title: "整理一期“独处清单”", category: "内容", score: 3, status: "new", content: "收集不需要消费、一个人也能完成的小事。", tags: ["内容", "生活"], notes: "", completed: false, createdAt: isoOffset(0, 7), updatedAt: isoOffset(0, 7), completedAt: null }
      ],
      habits: [
        { id: "habit-1", name: "阅读 30 分钟", frequency: "daily", target: 7, unit: "次", checkins: [offsetDate(-6), offsetDate(-5), offsetDate(-3), offsetDate(-2), offsetDate(-1)], active: true, tags: ["成长"], notes: "纸质书或电子书都可以，不限制主题。", createdAt: isoOffset(-20), updatedAt: isoOffset(-1) },
        { id: "habit-2", name: "晨间拉伸 10 分钟", frequency: "daily", target: 5, unit: "次", checkins: [offsetDate(-6), offsetDate(-4), offsetDate(-3), offsetDate(-1), offsetDate(0)], active: true, tags: ["健康"], notes: "醒来后不先看手机，完成拉伸再开始一天。", createdAt: isoOffset(-18), updatedAt: isoOffset(0, 7) },
        { id: "habit-3", name: "晚间复盘", frequency: "weekdays", target: 5, unit: "次", checkins: [offsetDate(-5), offsetDate(-4), offsetDate(-2)], active: true, tags: ["复盘"], notes: "写下今天完成的一件事和明天最重要的一件事。", createdAt: isoOffset(-16), updatedAt: isoOffset(-2) },
        { id: "habit-4", name: "22:30 后不看屏幕", frequency: "daily", target: 4, unit: "次", checkins: [offsetDate(-6), offsetDate(-3)], active: false, tags: ["睡眠"], notes: "本周先暂停，调整为目标 4 次后再启用。", createdAt: isoOffset(-12), updatedAt: isoOffset(-3) }
      ],
      moods: [
        { id: "mood-1", date: offsetDate(-6), mood: "平静", score: 3, energy: 3, trigger: "周末安静整理房间", tags: ["周末"], notes: "节奏慢下来后，脑子也清楚了一些。", completed: true, createdAt: isoOffset(-6, 21), updatedAt: isoOffset(-6, 21) },
        { id: "mood-2", date: offsetDate(-5), mood: "开心", score: 4, energy: 4, trigger: "和朋友散步聊天", tags: ["朋友"], notes: "被认真倾听的感觉很好。", completed: true, createdAt: isoOffset(-5, 21), updatedAt: isoOffset(-5, 21) },
        { id: "mood-3", date: offsetDate(-4), mood: "充实", score: 4, energy: 4, trigger: "完成一个阶段性任务", tags: ["工作"], notes: "专注两小时带来的正反馈很明显。", completed: false, createdAt: isoOffset(-4, 22), updatedAt: isoOffset(-4, 22) },
        { id: "mood-4", date: offsetDate(-3), mood: "焦虑", score: 2, energy: 2, trigger: "临时需求与睡眠不足", tags: ["工作", "睡眠"], notes: "先把事情拆小，今晚提前休息。", completed: true, createdAt: isoOffset(-3, 22), updatedAt: isoOffset(-3, 22) },
        { id: "mood-5", date: offsetDate(-2), mood: "平静", score: 3, energy: 3, trigger: "按计划推进，没有突发事项", tags: ["日常"], notes: "普通但稳定的一天。", completed: false, createdAt: isoOffset(-2, 21), updatedAt: isoOffset(-2, 21) },
        { id: "mood-6", date: offsetDate(-1), mood: "开心", score: 5, energy: 4, trigger: "内容收到真诚反馈", tags: ["创作"], notes: "自己的经验确实能帮助到别人。", completed: false, createdAt: isoOffset(-1, 22), updatedAt: isoOffset(-1, 22) },
        { id: "mood-7", date: offsetDate(0), mood: "充实", score: 4, energy: 3, trigger: "早晨完成拉伸和专注工作", tags: ["晨间"], notes: "先完成最重要的事，让一天有了好的开始。", completed: false, createdAt: isoOffset(0, 9), updatedAt: isoOffset(0, 9) }
      ],
      meta: { createdAt: stamp, updatedAt: stamp }
    };
    data.projects = [
      { id: "project-1", name: "Q4 产品规划", goal: "完成季度复盘与下一周期机会识别", owner: "朱萍萍", status: "active", sourceName: "示例项目", createdAt: isoOffset(-4), updatedAt: stamp },
      { id: "project-2", name: "官网改版", goal: "提升首页信息效率与移动端体验", owner: "朱萍萍", status: "active", sourceName: "示例项目", createdAt: isoOffset(-2), updatedAt: stamp }
    ];
    data.settings = { reminderTime: "09:00", notifications: false, lastNotified: "", t5t: { ...T5T_DEFAULT } };
    data.t5tReports = [];
    data.assistant = { messages: [] };
    data.work.forEach((item, index) => { item.startDate = addDays(item.dueDate, index % 2 ? -2 : -1); item.stage = item.completed ? "决策评审" : index === 0 ? "规划立项" : "设计"; item.owner = "朱萍萍"; item.projectId = item.project === "Q4 产品规划" ? "project-1" : item.project === "官网改版" ? "project-2" : ""; });
    return data;
  }

  function normalizeRecord(type, record, index) {
    if (!record || typeof record !== "object") throw new Error(`${modules[type].label}第 ${index + 1} 条记录格式不正确`);
    const item = { ...record, id: text(record.id) || uid(type), createdAt: text(record.createdAt) || now(), updatedAt: text(record.updatedAt) || now(), tags: normalizeTags(record.tags), notes: text(record.notes) };
    if (type !== "habits" && type !== "moods" && !text(item.title).trim()) throw new Error(`${modules[type].label}第 ${index + 1} 条记录缺少标题`);
    if (type === "habits") {
      if (!text(item.name).trim()) throw new Error(`习惯第 ${index + 1} 条记录缺少名称`);
      item.target = clamp(item.target || 7, 1, 7);
      item.checkins = Array.isArray(item.checkins) ? item.checkins.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) : [];
      item.active = item.active !== false;
    } else if (type === "moods") {
      item.date = /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : offsetDate(0);
      item.score = clamp(item.score || 3, 1, 5);
      item.energy = clamp(item.energy || 3, 1, 5);
      item.completed = Boolean(item.completed);
    } else {
      item.completed = Boolean(item.completed) || ["done", "published", "converted"].includes(item.status);
    }
    return item;
  }

  function validateState(candidate) {
    const source = candidate?.data || candidate;
    if (!source || typeof source !== "object") throw new Error("文件中没有可读取的数据");
    const result = {};
    for (const type of TYPES) {
      if (!Array.isArray(source[type])) throw new Error(`缺少“${modules[type].label}”数据数组`);
      result[type] = source[type].map((record, index) => normalizeRecord(type, record, index));
    }
    result.projects = Array.isArray(source.projects) ? source.projects.map((project, index) => ({
      ...project, id: text(project.id) || uid("project"), name: text(project.name).trim() || `未命名项目 ${index + 1}`,
      goal: text(project.goal), owner: text(project.owner), status: text(project.status) || "active",
      sourceName: text(project.sourceName), createdAt: text(project.createdAt) || now(), updatedAt: text(project.updatedAt) || now()
    })) : [];
    const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : {};
    const sourceT5t = sourceSettings.t5t && typeof sourceSettings.t5t === "object" ? sourceSettings.t5t : {};
    result.settings = {
      reminderTime: "09:00", notifications: false, lastNotified: "", ...sourceSettings,
      t5t: {
        ...T5T_DEFAULT, ...sourceT5t,
        holidays: Array.isArray(sourceT5t.holidays) ? sourceT5t.holidays.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) : [],
        makeupDays: Array.isArray(sourceT5t.makeupDays) ? sourceT5t.makeupDays.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) : [],
        dingTalk: { ...T5T_DEFAULT.dingTalk, ...(sourceT5t.dingTalk && typeof sourceT5t.dingTalk === "object" ? sourceT5t.dingTalk : {}) }
      }
    };
    const sourceMessages = source.assistant && Array.isArray(source.assistant.messages) ? source.assistant.messages : [];
    result.assistant = {
      messages: sourceMessages.filter(message => message && typeof message === "object").slice(-40).map((message, index) => ({
        id: text(message.id) || `msg-${index}`,
        role: message.role === "user" ? "user" : "assistant",
        kind: ["text", "file", "preview", "error"].includes(message.kind) ? message.kind : "text",
        text: text(message.text),
        at: text(message.at) || now(),
        engine: text(message.engine),
        fileName: text(message.fileName),
        tasks: Array.isArray(message.tasks) ? message.tasks : [],
        entries: Array.isArray(message.entries) ? message.entries.filter(entry => entry && text(entry.title).trim()) : [],
        project: text(message.project),
        mode: ["full", "light", "original"].includes(message.mode) ? message.mode : "",
        committed: Boolean(message.committed)
      }))
    };
    result.t5tReports = Array.isArray(source.t5tReports) ? source.t5tReports.filter(report => report && /^\d{4}-\d{2}-\d{2}$/.test(report.date) && text(report.markdown)).map((report, index) => ({
      id: text(report.id) || `report-${report.date}-${index}`, date: report.date, generatedAt: text(report.generatedAt) || now(),
      trigger: report.trigger === "auto" ? "auto" : "manual", completed: Array.isArray(report.completed) ? report.completed : [],
      next: Array.isArray(report.next) ? report.next : [], risks: Array.isArray(report.risks) ? report.risks : [],
      notes: report.notes && typeof report.notes === "object" ? { logs: text(report.notes.logs), calendar: text(report.notes.calendar) } : { logs: "", calendar: "" },
      markdown: text(report.markdown), source: text(report.source)
    })) : [];
    result.meta = { createdAt: text(source.meta?.createdAt) || now(), updatedAt: now() };
    return result;
  }

  function loadState() {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // 品牌改名迁移：旧 key 里已有的数据不能丢
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          saved = legacy;
          localStorage.setItem(STORAGE_KEY, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
      if (!saved) return sampleData();
      return validateState(JSON.parse(saved));
    } catch (error) {
      loadWarning = "本地数据读取失败，已临时载入示例数据";
      return sampleData();
    }
  }

  let state = loadState();

  function saveState(message) {
    state.meta.updatedAt = now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      document.getElementById("storageText").textContent = "已自动保存到此浏览器";
      if (message) showToast(message);
    } catch (error) {
      document.getElementById("storageText").textContent = "本地保存失败，请导出备份";
      showToast("本地保存失败，请立即导出 JSON 备份", "error");
    }
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.innerHTML = icon(type === "error" ? "help" : "check");
    const span = document.createElement("span");
    span.textContent = message;
    toast.appendChild(span);
    document.getElementById("toastRegion").appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  function showConfirm({ title, message, confirmText = "确认", onConfirm }) {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;
    document.getElementById("confirmOk").textContent = confirmText;
    confirmCallback = onConfirm;
    confirmDialog.showModal();
  }

  function weekDates() { return Array.from({ length: 7 }, (_, index) => offsetDate(index - 6)); }
  function habitWeekRate() {
    const active = state.habits.filter(item => item.active);
    const target = active.reduce((sum, item) => sum + number(item.target), 0);
    if (!target) return 0;
    const dates = new Set(weekDates());
    const actual = active.reduce((sum, item) => sum + item.checkins.filter(date => dates.has(date)).length, 0);
    return Math.min(100, Math.round(actual / target * 100));
  }
  function recentMoods() {
    const dates = weekDates();
    return state.moods.filter(item => dates.includes(item.date));
  }
  function overviewStats() {
    const pendingWork = state.work.filter(item => !item.completed);
    const learningMinutes = state.learning.reduce((sum, item) => sum + number(item.minutes), 0);
    const published = state.media.filter(item => item.status === "published").length;
    const moods = recentMoods();
    const averageMood = moods.length ? (moods.reduce((sum, item) => sum + number(item.score), 0) / moods.length).toFixed(1) : "—";
    return [
      { type: "work", label: "待办工作", value: pendingWork.length, unit: "项", meta: `${state.work.filter(item => item.completed).length} 项已完成` },
      { type: "learning", label: "学习投入", value: (learningMinutes / 60).toFixed(1), unit: "h", meta: `${state.learning.filter(item => item.status === "active").length} 项进行中` },
      { type: "media", label: "已发布内容", value: published, unit: "篇", meta: `${state.media.filter(item => item.status === "scheduled").length} 篇待发布` },
      { type: "ideas", label: "灵感收集", value: state.ideas.length, unit: "条", meta: `${state.ideas.filter(item => number(item.score) >= 4 && !item.completed).length} 条高潜力` },
      { type: "habits", label: "本周打卡率", value: habitWeekRate(), unit: "%", meta: `${state.habits.filter(item => item.active && item.checkins.includes(offsetDate(0))).length} 个习惯今日已打卡` },
      { type: "moods", label: "近 7 日情绪", value: averageMood, unit: averageMood === "—" ? "" : "/5", meta: `${moods.length} 天有记录` }
    ];
  }

  function statCard(stat) {
    const config = modules[stat.type];
    return `<button type="button" class="stat-card" data-view="${stat.type}" aria-label="查看${config.label}模块">
      <span class="stat-top"><span class="stat-label">${stat.label}</span><span class="stat-icon">${icon(config.icon)}</span></span>
      <strong class="stat-value">${stat.value}<small>${stat.unit}</small></strong>
      <span class="stat-meta">${stat.meta}</span>
    </button>`;
  }

  function activityChart() {
    const dates = weekDates();
    const data = dates.map(date => ({
      date,
      work: state.work.filter(item => item.completedAt && chinaNowParts(new Date(item.completedAt)).date === date).length,
      habits: state.habits.reduce((sum, item) => sum + (item.checkins.includes(date) ? 1 : 0), 0)
    }));
    const width = 720, height = 250, left = 34, right = 12, top = 16, bottom = 42;
    const chartHeight = height - top - bottom;
    const maxValue = Math.max(3, ...data.flatMap(item => [item.work, item.habits]));
    const step = (width - left - right) / 7;
    const ticks = Array.from({ length: 4 }, (_, i) => Math.ceil(maxValue / 3 * i));
    const grid = ticks.map(value => {
      const y = top + chartHeight - value / maxValue * chartHeight;
      return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="var(--color-border)" stroke-width="1"/><text x="${left - 9}" y="${y + 4}" text-anchor="end" fill="var(--color-muted)" font-size="10">${value}</text>`;
    }).join("");
    const bars = data.map((item, index) => {
      const center = left + step * index + step / 2;
      const workHeight = item.work / maxValue * chartHeight;
      const habitHeight = item.habits / maxValue * chartHeight;
      const date = parseLocalDate(item.date);
      return `<g><rect x="${center - 18}" y="${top + chartHeight - workHeight}" width="14" height="${workHeight}" rx="3" fill="var(--color-primary)"><title>${formatDate(item.date)}：完成 ${item.work} 项工作</title></rect>
        <rect x="${center + 4}" y="${top + chartHeight - habitHeight}" width="14" height="${habitHeight}" rx="3" fill="#a8d9c4"><title>${formatDate(item.date)}：打卡 ${item.habits} 个习惯</title></rect>
        <text x="${center}" y="${height - 20}" text-anchor="middle" fill="var(--color-text-secondary)" font-size="10">${DAY_NAMES[date.getDay()]}</text>
        <text x="${center}" y="${height - 7}" text-anchor="middle" fill="var(--color-muted)" font-size="9">${date.getMonth() + 1}/${date.getDate()}</text></g>`;
    }).join("");
    return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="近七日完成工作与习惯打卡数量柱状图">${grid}${bars}</svg></div>`;
  }

  function moodChart() {
    const dates = weekDates();
    const data = dates.map(date => {
      const entries = state.moods.filter(item => item.date === date);
      return { date, score: entries.length ? entries.reduce((sum, item) => sum + number(item.score), 0) / entries.length : null };
    });
    if (data.every(item => item.score === null)) return `<div class="chart-empty">还没有近 7 日的情绪记录<br>记录一次后，这里会出现趋势。</div>`;
    const width = 720, height = 250, left = 34, right = 18, top = 22, bottom = 42;
    const chartHeight = height - top - bottom;
    const step = (width - left - right) / 6;
    const x = index => left + step * index;
    const y = score => top + (5 - score) / 4 * chartHeight;
    const grid = [1, 2, 3, 4, 5].map(value => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="var(--color-border)"/><text x="${left - 10}" y="${y(value) + 4}" text-anchor="end" fill="var(--color-muted)" font-size="10">${value}</text>`).join("");
    let path = "", drawing = false;
    data.forEach((item, index) => {
      if (item.score === null) { drawing = false; return; }
      path += `${drawing ? " L" : " M"} ${x(index)} ${y(item.score)}`;
      drawing = true;
    });
    const points = data.map((item, index) => {
      const date = parseLocalDate(item.date);
      const point = item.score === null ? `<circle cx="${x(index)}" cy="${y(1)}" r="2.5" fill="var(--color-border)"/>` : `<circle cx="${x(index)}" cy="${y(item.score)}" r="5" fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2.5"><title>${formatDate(item.date)}：${item.score.toFixed(1)} 分</title></circle>`;
      return `${point}<text x="${x(index)}" y="${height - 18}" text-anchor="middle" fill="var(--color-text-secondary)" font-size="10">${DAY_NAMES[date.getDay()]}</text><text x="${x(index)}" y="${height - 5}" text-anchor="middle" fill="var(--color-muted)" font-size="9">${date.getMonth() + 1}/${date.getDate()}</text>`;
    }).join("");
    return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="近七日情绪评分趋势折线图">${grid}<path d="${path}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${points}</svg></div>`;
  }

  function checkboxControl(type, item, label) {
    return `<label class="check-control" title="${label}"><input type="checkbox" data-action="toggle" data-type="${type}" data-id="${escapeHtml(item.id)}" aria-label="${label}" ${checked(isComplete(type, item))}><span class="check-ui">${icon("check")}</span></label>`;
  }

  function focusList() {
    const tasks = state.work.filter(item => !item.completed).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 4);
    if (!tasks.length) return `<div class="chart-empty">今日待办已清空，给自己一点余白。</div>`;
    return `<div class="focus-list">${tasks.map(item => `<div class="focus-item">${checkboxControl("work", item, `完成${item.title}`)}<div class="focus-content"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.project || "未分组")} · ${friendlyDate(item.dueDate)}</small></div><span class="status-pill ${priorityMap[item.priority]?.[1] || "info"}">${priorityMap[item.priority]?.[0] || "未设优先级"}</span></div>`).join("")}</div>`;
  }

  function recentList() {
    const records = TYPES.flatMap(type => state[type].map(item => ({ type, item }))).sort((a, b) => new Date(b.item.updatedAt) - new Date(a.item.updatedAt)).slice(0, 5);
    if (!records.length) return `<div class="chart-empty">暂无最近记录</div>`;
    return `<div class="recent-list">${records.map(({ type, item }) => `<div class="recent-item"><span class="recent-icon">${icon(modules[type].icon)}</span><div class="recent-content"><strong>${escapeHtml(getTitle(type, item))}</strong><small>${modules[type].label} · ${getStatusLabel(type, type === "habits" ? (item.active ? "active" : "paused") : type === "moods" ? item.mood : item.status)}</small></div><span class="recent-time">${relativeTime(item.updatedAt)}</span></div>`).join("")}</div>`;
  }

  function getReminders() {
    const today = offsetDate(0);
    const reminders = [];
    state.work.filter(item => !item.completed).forEach(item => {
      if (item.dueDate) {
        const diff = dayDiff(today, item.dueDate);
        if (diff < 0) reminders.push({ id: `due-${item.id}`, taskId: item.id, severity: "danger", label: `逾期 ${-diff} 天`, title: item.title, meta: `${item.project || "未分组"} · ${formatDate(item.dueDate)} 到期`, date: item.dueDate, order: 0 });
        else if (diff === 0) reminders.push({ id: `due-${item.id}`, taskId: item.id, severity: "warning", label: "今日到期", title: item.title, meta: `${item.project || "未分组"} · ${item.stage || "执行"}`, date: item.dueDate, order: 1 });
        else if (item.startDate === today) reminders.push({ id: `start-${item.id}`, taskId: item.id, severity: "success", label: "今日启动", title: item.title, meta: `${item.project || "未分组"} · ${formatDate(item.dueDate)} 到期`, date: item.dueDate, order: 2 });
        else if (diff > 0 && diff <= 3) reminders.push({ id: `due-${item.id}`, taskId: item.id, severity: "info", label: `${diff} 天后到期`, title: item.title, meta: `${item.project || "未分组"} · ${item.owner || "待认领"}`, date: item.dueDate, order: 3 });
      }
      if (item.stage === "上线发布" && item.dueDate && parseLocalDate(item.dueDate).getDay() === 5) reminders.push({ id: `friday-${item.id}`, taskId: item.id, severity: "danger", label: "周五不发布", title: item.title, meta: "与你的发布纪律冲突，建议调整到周一", date: item.dueDate, order: -1 });
    });
    return reminders.sort((a, b) => a.order - b.order || text(a.date).localeCompare(text(b.date)));
  }

  function reminderItemsHtml(limit = 0) {
    const reminders = getReminders();
    const visible = limit ? reminders.slice(0, limit) : reminders;
    if (!visible.length) return `<div class="chart-empty">今日没有紧急工作提醒。<br>可以先看看下一步计划，或给自己留一点余白。</div>`;
    return `<div class="reminder-list">${visible.map(item => `<div class="reminder-item ${item.severity}">${icon(item.severity === "danger" ? "bell" : item.severity === "success" ? "project" : "clock")}<div class="reminder-content"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.meta)}</small></div><span class="reminder-tag">${escapeHtml(item.label)}</span></div>`).join("")}</div>${limit && reminders.length > limit ? `<button class="text-btn" data-view="planning">还有 ${reminders.length - limit} 项，查看全部${icon("arrow")}</button>` : ""}`;
  }

  function reminderSettingsHtml() {
    const settings = state.settings;
    return `<div class="reminder-settings"><label for="reminderTime">每日提醒时间</label><input id="reminderTime" type="time" value="${escapeHtml(settings.reminderTime || "09:00")}"><button class="btn btn-secondary btn-small" data-action="enable-notifications">${icon("bell")}${settings.notifications ? "系统通知已启用" : "启用浏览器通知"}</button></div><p class="notification-hint">页面打开时按设定时间发送一次系统通知；页面内提醒始终自动更新。关闭浏览器后不会后台推送。</p>`;
  }

  function checkDailyNotification() {
    const settings = state.settings;
    if (!settings.notifications || !("Notification" in window) || Notification.permission !== "granted" || settings.lastNotified === offsetDate(0)) return;
    const current = `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
    if (current < (settings.reminderTime || "09:00")) return;
    const reminders = getReminders();
    if (!reminders.length) return;
    const notification = new Notification(`三院工作台：今日 ${reminders.length} 项工作提醒`, { body: reminders.slice(0, 3).map(item => `${item.label}｜${item.title}`).join("\n"), tag: `sanyuan-${offsetDate(0)}` });
    notification.onclick = () => { window.focus(); setView("planning"); };
    settings.lastNotified = offsetDate(0);
    saveState();
  }

  function completedOn(task, date) {
    if (!task.completed || !task.completedAt) return false;
    const completed = new Date(task.completedAt);
    return !Number.isNaN(completed.getTime()) && chinaNowParts(completed).date === date;
  }

  function generateT5TReport(trigger = "manual") {
    const today = chinaToday();
    const tomorrow = addDays(today, 1);
    const config = state.settings.t5t;
    const priorityRank = { high: 0, medium: 1, low: 2 };
    const completedTasks = state.work
      .filter(task => completedOn(task, today))
      .sort((a, b) => (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2) || text(b.completedAt).localeCompare(text(a.completedAt)))
      .slice(0, 5);
    const nextCandidates = state.work.filter(task => !task.completed && (
      (task.dueDate && task.dueDate <= tomorrow) ||
      (task.startDate && task.startDate <= tomorrow) ||
      (task.priority === "high" && task.dueDate && task.dueDate <= addDays(today, 7))
    ));
    const seen = new Set();
    const nextTasks = nextCandidates
      .sort((a, b) => text(a.dueDate || "9999").localeCompare(text(b.dueDate || "9999")) || (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2))
      .filter(task => { if (seen.has(task.id)) return false; seen.add(task.id); return true; })
      .slice(0, 5);
    const completed = completedTasks.map(task => ({
      title: task.title,
      meta: [task.project, task.stage, task.completed ? "已闭环" : "", task.dueDate ? `截止 ${formatDate(task.dueDate)}` : ""].filter(Boolean).join(" · "),
      evidence: "工作台"
    }));
    const next = nextTasks.map(task => {
      const overdue = task.dueDate && task.dueDate < today;
      return {
        title: task.title,
        meta: [task.project, task.stage, overdue ? `已逾期 ${formatDate(task.dueDate)}` : task.dueDate ? `截止 ${friendlyDate(task.dueDate)}` : "待排期", task.owner || "待认领"].filter(Boolean).join(" · "),
        evidence: "工作台"
      };
    });
    const overdue = state.work.filter(task => !task.completed && task.dueDate && task.dueDate < today);
    const fridayLaunch = state.work.filter(task => !task.completed && task.stage === "上线发布" && task.dueDate && parseLocalDate(task.dueDate).getDay() === 5);
    const launchWithoutReview = state.work.filter(task => task.completed && task.stage === "上线发布" && !state.work.some(other => other.project === task.project && other.stage === "复盘"));
    const risks = [];
    if (overdue.length) risks.push(`有 ${overdue.length} 项任务已逾期，优先处理：${overdue.slice(0, 3).map(task => task.title).join("、")}`);
    if (fridayLaunch.length) risks.push(`有 ${fridayLaunch.length} 项上线任务排在周五，违反“周五不发布”纪律，应调整到周一`);
    if (launchWithoutReview.length) risks.push(`项目「${launchWithoutReview[0].project || "未分组"}」已上线但未发现复盘任务，请在上线两周内补齐`);
    if (!state.work.length) risks.push("工作台暂无任务数据，T5T 证据不足，请先导入或新建工作项目");
    const dingTalk = config.dingTalk?.date === today ? config.dingTalk : { logs: "", calendar: "" };
    const notes = { logs: text(dingTalk.logs).trim(), calendar: text(dingTalk.calendar).trim() };
    const sources = ["三院工作台任务"];
    if (notes.logs) sources.push("钉钉日志摘录");
    if (notes.calendar) sources.push("钉钉日历摘录");
    const report = {
      id: `t5t-${today}-${Date.now()}`, date: today, generatedAt: now(), trigger,
      completed, next, risks, notes, source: sources.join(" / ")
    };
    report.markdown = buildT5TMarkdown(report);
    state.t5tReports = [report, ...state.t5tReports.filter(item => item.date !== today)].slice(0, 60);
    config.lastRunDate = today;
    saveState();
    if (config.notify && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`T5T 日结已生成｜${today}`, { body: `今日完成 ${completed.length} 项，次日待办 ${next.length} 项。${risks.length ? `需关注：${risks[0]}` : ""}`, tag: `t5t-${today}` });
      } catch (error) { /* Notification can be unavailable on file:// */ }
    }
    if (ui.view === "automation" || ui.view === "overview") render();
    showToast(trigger === "auto" ? "定时任务已生成今日 T5T 日报" : "T5T 日报已生成");
    return report;
  }

  function buildT5TMarkdown(report) {
    const lines = [
      `# ${report.date} T5T 工作日报`,
      "",
      `> ${report.source} · 生成于 ${new Date(report.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}`,
      "",
      "## 今日完成 Top 5",
      ""
    ];
    if (report.completed.length) report.completed.forEach((item, index) => lines.push(`${index + 1}. **${item.title}** — ${item.meta} <span class="report-source">${item.evidence}</span>`));
    else lines.push("暂无足够证据证明今日完成事项，请补充任务完成记录或钉钉日志。");
    lines.push("", "## 次日待办 Top 5", "");
    if (report.next.length) report.next.forEach((item, index) => lines.push(`${index + 1}. **${item.title}** → ${item.meta} <span class=\"report-source\">${item.evidence}</span>`));
    else lines.push("暂无可识别的次日排期任务。");
    lines.push("", "## 风险与未闭环", "");
    if (report.risks.length) report.risks.forEach(item => lines.push(`- ${item}`));
    else lines.push("- 暂未发现明确风险。");
    if (report.notes?.logs) lines.push("", "## 钉钉日志摘录", "", report.notes.logs);
    if (report.notes?.calendar) lines.push("", "## 钉钉日历摘录", "", report.notes.calendar);
    lines.push("", "## 数据完整度", "", `- 任务来源：三院工作台（${state.work.length} 项）`, `- 钉钉补充：${report.notes?.logs || report.notes?.calendar ? "已手动填入" : "未填入；浏览器无法直接读取钉钉接口"}`, "- 本报告由本地工作台生成，不修改任何外部系统。");
    return lines.join("\n");
  }

  function reportListHtml() {
    const reports = state.t5tReports.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!reports.length) return `<div class="report-empty">还没有 T5T 日报。可以点击“立即生成”，或等到设定时间自动生成。</div>`;
    return `<div class="history-list">${reports.map(report => `<div class="history-item"><div class="history-date">${formatDate(report.date)}</div><div class="history-content"><strong>${report.date} T5T 日报 <span class="status-pill ${report.trigger === "auto" ? "success" : "info"}">${report.trigger === "auto" ? "定时生成" : "手动生成"}</span></strong><small>完成 ${report.completed.length} 项 · 次日 ${report.next.length} 项 · ${relativeTime(report.generatedAt)}</small></div><div class="history-actions"><button class="icon-btn" data-action="view-t5t" data-report-id="${escapeHtml(report.id)}" aria-label="查看 ${report.date} T5T 日报" title="查看">${icon("file")}</button><button class="icon-btn" data-action="export-t5t" data-report-id="${escapeHtml(report.id)}" aria-label="导出 ${report.date} T5T 日报" title="导出">${icon("download")}</button><button class="icon-btn danger" data-action="delete-t5t" data-report-id="${escapeHtml(report.id)}" aria-label="删除 ${report.date} T5T 日报" title="删除">${icon("trash")}</button></div></div>`).join("")}</div>`;
  }

  function automationViewHtml() {
    const config = state.settings.t5t;
    const today = chinaToday();
    const next = nextT5TRun();
    const isWorkday = isMainlandWorkday(today);
    const latest = state.t5tReports.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    const completedToday = state.work.filter(task => completedOn(task, today)).length;
    const tomorrow = addDays(today, 1);
    const dueTomorrow = state.work.filter(task => !task.completed && task.dueDate && task.dueDate <= tomorrow).length;
    const hasDingTalkToday = config.dingTalk?.date === today && Boolean(config.dingTalk.logs || config.dingTalk.calendar);
    return `<section class="module-intro"><div><p class="eyebrow">LOCAL DAILY AUTOMATION</p><h2>定时任务</h2><p>按你的工作日节奏自动整理 T5T；任务运行、暂停和日报都留在工作台内。</p></div><div class="planning-actions"><button class="btn btn-primary" data-action="generate-t5t">${icon("play")}立即生成 T5T</button></div></section>
      <section class="module-summary"><div class="summary-item"><span>任务状态</span><strong>${config.enabled ? "运行中" : "已暂停"}</strong></div><div class="summary-item"><span>下次运行</span><strong style="font-size:15px">${escapeHtml(next.label)}</strong></div><div class="summary-item"><span>已生成日报</span><strong>${state.t5tReports.length}<small>份</small></strong></div><div class="summary-item"><span>最近生成</span><strong style="font-size:15px">${latest ? formatDate(latest.date) : "尚未生成"}</strong></div></section>
      <section class="automation-grid"><article class="automation-card"><div class="automation-hero"><span class="automation-icon">${icon("timer")}</span><div class="automation-hero-content"><h3>每日 T5T 日结</h3><p>工作台内的本地定时任务，不上传数据</p></div><span class="automation-state ${config.enabled ? "" : "paused"}">${config.enabled ? "运行中" : "已暂停"}</span></div><form class="automation-form" id="t5tSettingsForm"><div class="schedule-row"><div class="schedule-field"><label for="t5tTime">每天执行时间</label><input id="t5tTime" type="time" value="${escapeHtml(config.time)}"></div><div class="schedule-field"><label for="t5tMode">执行日期</label><select id="t5tMode"><option value="workdays" ${!config.workdaysOnly ? "" : "selected"}>中国大陆工作日</option><option value="daily" ${config.workdaysOnly ? "" : "selected"}>每天执行</option></select></div></div><div class="schedule-toggle"><div><strong>生成 T5T 工作日报</strong><small>从工作台的任务完成记录生成今日 Top 5 与次日待办 Top 5；日报保存在本地浏览器。</small></div><label class="switch-control" title="启用或暂停任务"><input id="t5tEnabled" type="checkbox" ${checked(config.enabled)} aria-label="启用每日 T5T 任务"><span class="switch-ui"></span></label></div><div class="schedule-toggle"><div><strong>系统通知</strong><small>页面打开时，生成日报后发送一条浏览器通知；需先允许通知权限。</small></div><label class="switch-control"><input id="t5tNotify" type="checkbox" ${checked(config.notify)} aria-label="T5T 生成后发送浏览器通知"><span class="switch-ui"></span></label></div><div class="local-limit-note">这是一个纯本地定时任务：只有工作台页面处于打开状态时才会自动执行；关闭浏览器后不会后台运行。重新打开页面且已过执行时间时，会补生成当天日报一次。</div><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="toggle-t5t">${icon(config.enabled ? "pause" : "play")}${config.enabled ? "暂停定时任务" : "启用定时任务"}</button><div style="display:flex;gap:8px"><button type="button" class="btn btn-secondary" data-action="enable-t5t-notifications">${icon("bell")}授权通知</button><button type="submit" class="btn btn-primary">${icon("check")}保存设置</button></div></div><details class="holiday-config"><summary>工作日例外设置（${config.holidays.length} 个节假日 / ${config.makeupDays.length} 个调休上班日）</summary><div class="schedule-row"><div class="schedule-field"><label for="t5tHolidays">法定节假日 / 休息日</label><textarea id="t5tHolidays" placeholder="每行一个日期，例如：&#10;2026-01-01&#10;2026-10-01">${escapeHtml(config.holidays.join("\n"))}</textarea></div><div class="schedule-field"><label for="t5tMakeupDays">调休上班日</label><textarea id="t5tMakeupDays" placeholder="每行一个需要上班的周末日期">${escapeHtml(config.makeupDays.join("\n"))}</textarea></div></div></details><details class="holiday-config"><summary>钉钉补充数据（可选）</summary><textarea id="t5tDingTalkLogs" class="plan-paste" placeholder="可粘贴今日钉钉日志/T5T内容；浏览器不能直接调用钉钉接口。">${escapeHtml(config.dingTalk?.date === today ? config.dingTalk.logs : "")}</textarea><textarea id="t5tDingTalkCalendar" class="plan-paste" style="margin-top:8px" placeholder="可粘贴今日/明日钉钉日程。">${escapeHtml(config.dingTalk?.date === today ? config.dingTalk.calendar : "")}</textarea></details></form></article><div class="automation-side"><section class="automation-card"><div class="panel-header"><div><div class="panel-title">${icon("calendar")}<h3>下一次运行</h3></div><p class="panel-subtitle">按 Asia/Shanghai 时区判断</p></div></div><div class="schedule-next">${icon("clock")}<span>${escapeHtml(next.label)}</span></div><div class="workday-state" style="margin-top:12px">${icon(isWorkday ? "check" : "calendar")}<div><strong>${isWorkday ? "今天是工作日" : "今天是非工作日"}</strong><small>${workdayLabel(today)} · ${config.workdaysOnly ? "中国工作日模式" : "每天执行模式"}</small></div></div><p class="notification-hint">默认按周一至周五判断；法定节假日与调休上班日需在上方“工作日例外设置”中维护，避免节假日误生成。</p></section><section class="automation-card"><div class="panel-header"><div><div class="panel-title">${icon("chart")}<h3>今日可用数据</h3></div><p class="panel-subtitle">T5T 只引用当前工作台中的任务</p></div></div><div class="source-stat"><div><span>今日完成</span><strong>${completedToday} 项</strong></div><div><span>次日截止/启动</span><strong>${dueTomorrow} 项</strong></div></div><div class="source-list"><div class="source-item">${icon("work")}工作任务、项目阶段、截止日期与完成记录</div><div class="source-item">${icon("bell")}${hasDingTalkToday ? "今天已填入钉钉日志/日程补充" : "钉钉日志与日历：浏览器无法直连，可手动粘贴"}</div><div class="source-item">${icon("project")}项目流程门禁、周五发布与复盘风险检查</div></div></section></div></section><section class="automation-card history-panel"><div class="panel-header"><div><div class="panel-title">${icon("file")}<h3>日报历史</h3></div><p class="panel-subtitle">本机保存，最多保留最近 60 份</p></div><button class="text-btn" data-action="generate-t5t">生成今日日报${icon("arrow")}</button></div>${reportListHtml()}</section>`;
  }

  function openT5TReport(reportId) {
    const report = state.t5tReports.find(item => item.id === reportId);
    if (!report) return;
    activeT5tReportId = reportId;
    document.getElementById("t5tReportTitle").textContent = `${report.date} T5T 工作日报`;
    document.getElementById("t5tReportMeta").textContent = `${report.trigger === "auto" ? "定时生成" : "手动生成"} · ${new Date(report.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })} · ${report.source}`;
    const list = (items, empty) => items.length ? `<ol>${items.map(item => `<li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.meta)} <span class="report-source">${escapeHtml(item.evidence)}</span></li>`).join("")}</ol>` : `<p>${empty}</p>`;
    document.getElementById("t5tReportBody").innerHTML = `<article class="report-document"><h1>${report.date} T5T 工作日报</h1><blockquote>由三院工作台生成 · ${escapeHtml(report.source)}</blockquote><h2>今日完成 Top 5</h2>${list(report.completed, "暂无足够证据证明今日完成事项。")}<h2>次日待办 Top 5</h2>${list(report.next, "暂无可识别的次日排期任务。")}<h2>风险与未闭环</h2>${report.risks.length ? `<ul>${report.risks.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>暂未发现明确风险。</p>"}${report.notes?.logs ? `<h2>钉钉日志摘录</h2><p>${escapeHtml(report.notes.logs).replace(/\n/g, "<br>")}</p>` : ""}${report.notes?.calendar ? `<h2>钉钉日历摘录</h2><p>${escapeHtml(report.notes.calendar).replace(/\n/g, "<br>")}</p>` : ""}<h2>数据完整度</h2><p>本地任务已读取；${report.notes?.logs || report.notes?.calendar ? "钉钉补充为手动填入。" : "钉钉接口未直连，未引用外部自动数据。"}</p></article>`;
    document.getElementById("t5tReportDialog").showModal();
  }

  function downloadReport(report) {
    if (!report) return;
    const blob = new Blob([report.markdown], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `T5T-${report.date}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  /* ==================== AI 对话拆解 ==================== */

  const ASSISTANT_MODEL_KEY = "sanyuan.assistant.model.v1";
  // AI 直接拆解：模型一次性规划完整任务列表，本地只做格式校验，不套固定模板。
  const AI_DIRECT_SYSTEM_PROMPT = [
    "你是资深产品经理的 AI 规划搭档。用户会用自然语言描述规划、需求或事项，你直接产出一份可执行的完整任务列表。",
    "只输出一个 JSON 对象，不要输出解释文字、不要使用 markdown 代码块。",
    "JSON 结构：{\"reply\":\"用两三句话说明你的规划思路和关键安排\",\"tasks\":[{\"title\":\"具体任务\",\"stage\":\"讨论调研|规划立项|决策评审|设计|研发协同|测试验收|上线发布|培训赋能|运营推广|复盘 或 空字符串\",\"project\":\"项目名\",\"owner\":\"负责人\",\"priority\":\"high|medium|low\",\"startDate\":\"YYYY-MM-DD\",\"dueDate\":\"YYYY-MM-DD\",\"estimate\":天数}]}",
    "规划原则（按输入内容智能取舍，不要机械套用）：",
    "1. 任务数量由内容决定：一句话小事项可能 1～3 条任务就够；大型项目才需要完整链路。不要生成与输入无关的填充任务，也不要漏掉用户明确提到的事项。",
    "2. 阶段是标签不是骨架：用户提到的每个事项都要落到具体任务；stage 从给定枚举里选最贴切的一个，判断不了就用空字符串。",
    "3. 结合用户的工作纪律安排日期：需求/设计评审通过后 48 小时内要有修改对齐动作；上线日期避开周五（顺延到下周一）；上线后两周内安排复盘；正式立项前如果有明显未知，先安排一次 30 分钟左右的用户/数据调研；上线前安排自测与验收报告，上线后安排操作说明与分层培训。",
    "4. 日期都是真实日历日期（YYYY-MM-DD）。用户说「下周一」「本月底」时按今天日期推算；推算不了或用户没说就用空字符串，不要编造。",
    "5. 项目名、负责人、优先级尊重用户输入；用户没说就留空字符串，不要编造。",
    "6. 如果用户是对上一版任务列表提出调整（如「精简点」「详细点」「去掉测试环节」「增加合规审查」「按原样」），返回调整后的完整新列表：「按原样」表示只保留输入中明确提到的任务，不要扩展。",
    "7. 你无法访问链接、附件或外部页面。如果用户输入只有链接、文件名或问候语而没有具体事项，不要编造任务：tasks 返回空数组，并在 reply 里说明识别不了的原因、请用户粘贴具体内容（要做什么、时间、负责人）。",
    "今天的日期是"
  ].join("");
  // 模型没按要求输出 JSON 时的自动重试提示（合并进最后一条用户消息，保持两种协议的消息角色交替）
  const AI_JSON_RETRY_HINT = "上一次回复不符合要求：必须只输出一个 JSON 对象（含 reply 与 tasks 两个字段，tasks 每项含 title/stage/project/owner/priority/startDate/dueDate/estimate），不要输出任何解释文字、思维链或 markdown 代码块标记。";

  function loadModelConfig() {
    try {
      const raw = localStorage.getItem(ASSISTANT_MODEL_KEY);
      if (!raw) return { endpoint: "", model: "", apiKey: "", style: "" };
      const parsed = JSON.parse(raw) || {};
      return {
        endpoint: text(parsed.endpoint),
        model: text(parsed.model),
        apiKey: text(parsed.apiKey),
        style: ["anthropic", "openai"].includes(parsed.style) ? parsed.style : ""
      };
    } catch (error) {
      return { endpoint: "", model: "", apiKey: "", style: "" };
    }
  }

  function saveModelConfig(config) {
    try {
      if (!config.endpoint && !config.model && !config.apiKey) localStorage.removeItem(ASSISTANT_MODEL_KEY);
      else localStorage.setItem(ASSISTANT_MODEL_KEY, JSON.stringify({
        endpoint: text(config.endpoint),
        model: text(config.model),
        apiKey: text(config.apiKey),
        style: ["anthropic", "openai"].includes(config.style) ? config.style : ""
      }));
    } catch (error) { /* localStorage 不可用时静默降级 */ }
  }

  function modelConfigured() {
    const config = loadModelConfig();
    return Boolean(config.endpoint && config.model);
  }

  // ---------- 中文日期表达解析 ----------
  function weekdayNumber(char) {
    return { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }[char];
  }

  function resolveDateWord(word, base) {
    const value = text(word).trim();
    if (!value) return "";
    if (/^(今天|今日|本日)$/.test(value)) return base;
    if (/^(明天|明日)$/.test(value)) return addDays(base, 1);
    if (/^(后天)$/.test(value)) return addDays(base, 2);
    if (/^(大后天)$/.test(value)) return addDays(base, 3);
    if (/^(昨天|昨日)$/.test(value)) return addDays(base, -1);
    let match = value.match(/^(\d{1,2})\s*天(?:之)?后$/);
    if (match) return addDays(base, number(match[1]));
    match = value.match(/^(\d{1,2})\s*(?:周|星期|礼拜)(?:之)?后$/);
    if (match) return addDays(base, number(match[1]) * 7);
    match = value.match(/^(下下|下|这|本|此)?\s*(?:周|星期|礼拜)\s*([一二三四五六日天])$/);
    if (match) {
      const target = weekdayNumber(match[2]);
      const baseDate = parseLocalDate(base);
      const current = baseDate.getDay();
      const weekStart = 1; // 以周一为一周起点
      if (!match[1] || match[1] === "这" || match[1] === "本" || match[1] === "此") {
        const delta = (target - current + 7) % 7;
        return addDays(base, delta === 0 ? 7 : delta);
      }
      const toNextMonday = ((weekStart - current) + 7) % 7 || 7;
      const anchor = addDays(base, toNextMonday);
      const offset = match[1] === "下下" ? 7 : 0;
      const anchorDay = parseLocalDate(anchor).getDay();
      const delta = (target - anchorDay + 7) % 7;
      return addDays(anchor, offset + delta);
    }
    if (/^(本|这个|下个)?月(底|末)$/.test(value)) {
      const date = parseLocalDate(base);
      const monthOffset = value.startsWith("下") ? 1 : 0;
      const end = new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0, 12);
      return toDateString(end);
    }
    return "";
  }

  const DATE_PATTERN = /(\d{4})\s*[-/年.]\s*(\d{1,2})\s*[-/月.]\s*(\d{1,2})\s*日?|(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]|(?:^|[^\d])(\d{1,2})\s*[-/]\s*(\d{1,2})(?!\d)|(今天|今日|明天|明日|后天|大后天|昨天|昨日|\d{1,2}\s*天(?:之)?后|\d{1,2}\s*(?:周|星期|礼拜)(?:之)?后|(?:下下|下|这|本|此)?\s*(?:周|星期|礼拜)\s*[一二三四五六日天]|(?:本|这个|下个)?月(?:底|末))/g;

  function findDatesInText(raw, base) {
    const content = text(raw);
    const found = [];
    DATE_PATTERN.lastIndex = 0;
    let match;
    while ((match = DATE_PATTERN.exec(content)) !== null) {
      let iso = "";
      if (match[1]) {
        iso = `${match[1]}-${pad(number(match[2]))}-${pad(number(match[3]))}`;
      } else if (match[4]) {
        const year = parseLocalDate(base).getFullYear();
        iso = `${year}-${pad(number(match[4]))}-${pad(number(match[5]))}`;
      } else if (match[6]) {
        const year = parseLocalDate(base).getFullYear();
        iso = `${year}-${pad(number(match[6]))}-${pad(number(match[7]))}`;
      } else if (match[8]) {
        iso = resolveDateWord(match[8], base);
      }
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
      const checked = parseLocalDate(iso);
      if (!checked || Number.isNaN(checked.getTime()) || toDateString(checked) !== iso) continue;
      if (found.some(item => item.iso === iso && item.index === match.index)) continue;
      found.push({ iso, index: match.index, raw: match[0].trim() });
    }
    return found;
  }

  // ---------- 文本 → 任务条目 ----------
  function splitTaskSegments(input) {
    const segments = [];
    text(input).split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const stripped = trimmed.replace(/^(?:[-*•+·]|\(?\d{1,2}[).、]|[①②③④⑤⑥⑦⑧⑨⑩])\s*/, "").trim();
      if (!stripped) return;
      const parts = [];
      stripped.split(/[;；]+/).forEach(piece => piece.split(/。+/).forEach(sub => parts.push(sub)));
      parts.forEach(part => {
        const clean = part.trim().replace(/^[，,、\s：:]+/, "");
        if (clean.replace(/\s/g, "").length < 2) return;
        // 「项目：X」这类纯声明交由标题清洗判定，清洗后为空自然被跳过
        segments.push(clean);
      });
    });
    return segments;
  }

  function cleanEntryTitle(segment) {
    let title = text(segment)
      .replace(/项目(?:名称|名)?\s*[:：]\s*[^，,；;。\n]+/g, "")
      .replace(/(?:负责人|责任人|Owner)\s*[:：]?\s*[\u4e00-\u9fa5A-Za-z0-9_]{2,6}(?=[\s，,；;。、]|$)/gi, "")
      .replace(/(?:负责人|责任人|Owner)\s*[:：]\s*[^，,；;。\n]+/gi, "")
      .replace(/@[\u4e00-\u9fa5A-Za-z0-9_]{1,12}/g, "")
      .replace(/(?:优先级|重要程度)\s*[:：]?\s*(?:最高|高|中|低|紧急)?/g, "")
      .replace(/^(?:需求|事项|任务|日程|安排|上线时间|发布时间|时间|上线|发布)\s*[:：]\s*/, "");
    title = title
      .replace(/(?:定在|定于|计划在|安排在|排期在|预计在?)\s*/g, " ")
      .replace(DATE_PATTERN, " ")
      .replace(/^[\s，,、：:]+/, "")
      .replace(/[\s，,、：:]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    // 只剩动作词（如「上线」）说明这句只表达了时间意图，返回 null 交给项目兜底
    if (/^(?:上线|发布|完成|交付|验收|评审|立项|启动|做|搞)$/.test(title)) return null;
    return title;
  }

  function cleanProjectName(value) {
    return text(value)
      .replace(/\s*(?:负责人|责任人|优先级|重要程度|当前阶段|阶段|开始|截止|工期).*$/, "")
      .replace(/[\s，,、：:。;；]+$/, "")
      .trim();
  }

  function detectDefaultProject(raw) {
    const content = text(raw);
    let match = content.match(/项目(?:名称|名)?\s*[:：]\s*([^，,；;。\n]+)/);
    if (match) return cleanProjectName(match[1]);
    match = content.match(/【([^】]{2,20})】/);
    if (match) return match[1].trim();
    return "";
  }

  // 兜底清洗：只去掉标签，保留用户原话，避免整行被判成空
  function mildEntryTitle(segment) {
    return text(segment)
      .replace(/项目(?:名称|名)?\s*[:：]\s*/g, "")
      .replace(/(?:负责人|责任人|Owner)\s*[:：]\s*/gi, "")
      .replace(/(?:优先级|重要程度)\s*[:：]?\s*(?:最高|高|中|低|紧急)?/g, "")
      .replace(/@[\u4e00-\u9fa5A-Za-z0-9_]{1,12}/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function detectOwner(raw) {
    const content = text(raw);
    let match = content.match(/负责人\s*[:：]\s*([^\s，,；;。\n]+)/);
    if (match) return match[1].trim();
    match = content.match(/@([\u4e00-\u9fa5A-Za-z0-9_]{1,12})/);
    return match ? match[1].trim() : "";
  }

  function detectPriority(raw) {
    const content = text(raw);
    if (/(?:p0|p1|最高优先级|紧急|优先级高|高优先级)/i.test(content)) return "high";
    if (/(?:p3|低优先级|优先级低|不急)/i.test(content)) return "low";
    return "medium";
  }

  function decomposeFromText(input, options = {}) {
    const base = chinaToday();
    const mode = options.mode || "full";
    const segments = splitTaskSegments(input);
    if (!segments.length) throw new Error("没读到可拆解的内容，请用一行一件事的方式描述");
    const defaultProject = options.projectName || detectDefaultProject(input) || `对话拆解 ${base.slice(5)}`;
    const entries = segments.map(segment => {
      const dates = findDatesInText(segment, base);
      let startDate = "";
      let dueDate = "";
      if (dates.length >= 2) {
        startDate = dates[0].iso;
        dueDate = dates[dates.length - 1].iso;
        if (startDate > dueDate) [startDate, dueDate] = [dueDate, startDate];
      } else if (dates.length === 1) {
        const isLaunch = /(上线|发布|release)/i.test(segment);
        dueDate = dates[0].iso;
        startDate = isLaunch && dueDate > base ? addDays(dueDate, -18) : base;
        if (startDate > dueDate) startDate = base;
      } else {
        startDate = base;
        dueDate = addDays(base, mode === "full" ? 30 : 21);
      }
      const ownerInSegment = detectOwner(segment);
      const stageHit = LIFECYCLE_STAGES.find(stage => segment.includes(stage)) || "";
      let title = cleanEntryTitle(segment);
      if (title === "") {
        const mild = mildEntryTitle(segment);
        const isProjectOnly = mild && mild.replace(/\s/g, "") === defaultProject.replace(/\s/g, "");
        if (mild && !isProjectOnly) title = mild;
      }
      if (title === null) title = "";
      // 只剩「12 月 15 日上线」这类纯时间意图时，用「项目 + 动作」兜底
      if (!title) title = /(上线|发布)/.test(segment) ? `${defaultProject} 上线` : stageHit ? `${defaultProject} ${stageHit}` : "";
      if (!title) return null;
      return {
        title,
        project: "",
        startDate,
        dueDate,
        stageText: stageHit,
        owner: ownerInSegment,
        priority: detectPriority(segment),
        sourceNote: "来源：AI 对话拆解",
        detail: ""
      };
    }).filter(Boolean);
    if (!entries.length) throw new Error("没读到可拆解的事项，请补充一句具体要做什么");
    return { entries, defaultProject, mode, segments: entries.length };
  }

  // 从「输入里有没有说粒度」推断：默认完整，用户说了才听用户的
  function detectGranularity(input) {
    const line = text(input);
    if (/(不要拆|别拆|原样|保留原任务|照抄|只记录|就记一下)/.test(line)) return "original";
    if (/(精简|简单点|简单些|粗略|粗一点|每阶段一个|不要那么细|不要这么细|别那么细)/.test(line)) return "light";
    return "full";
  }

  // 短句追问（如「精简点」「按原样」）用于调整上一条未入库的预览
  function granularityFromFollowUp(input) {
    const line = text(input).replace(/[\s。！!，,、~]/g, "");
    if (!line || line.length > 10) return "";
    const bare = line.replace(/^(?:再|按|改|换|用|给我)+/, "");
    if (/^(原样|保留原任务|不要拆了?|别拆了?)$/.test(bare)) return "original";
    if (/^(精简|简单|粗略|粗)(一?[点些下])?$/.test(bare)) return "light";
    if (/^(详细|完整|展开|全一点|全一些)(一?[点些下])?$/.test(bare)) return "full";
    return "";
  }

  function buildTasksFromEntries(entries, project, mode) {
    const tasks = [];
    (entries || []).forEach(entry => tasks.push(...expandEntry(entry, { mode, scope: "all", defaultProject: project })));
    if (!tasks.length) throw new Error("没有生成任务，请补充具体事项名称");
    return tasks;
  }

  function pushPreview({ entries, project, mode, engine, text: line }) {
    const tasks = buildTasksFromEntries(entries, project, mode);
    pushAssistantMessage({
      role: "assistant", kind: "preview", engine, text: line,
      tasks, entries, project, mode
    });
  }

  function setPreviewMode(messageId, mode) {
    const message = (state.assistant?.messages || []).find(item => item.id === messageId);
    if (!message || message.committed) return;
    if (!Array.isArray(message.entries) || !message.entries.length) {
      showToast("这条预览是旧版本生成的，无法切换粒度，重新发一次即可", "error");
      return;
    }
    if (message.mode === mode) return;
    try {
      message.tasks = buildTasksFromEntries(message.entries, message.project, mode);
      message.mode = mode;
      saveState();
      renderAssistantLog();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  // ---------- 模型调用 ----------
  function parseModelJson(content) {
    let raw = text(content).trim();
    // 部分模型（尤其经中转的推理模型）会在正文外带 <think> 思维链，先剥掉再提取
    raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      const snippet = raw.replace(/\s+/g, " ").slice(0, 120);
      const error = new Error(`模型返回的内容不是 JSON${snippet ? `（返回片段：${snippet}）` : "（返回内容为空）"}`);
      error.parseFailure = true;
      throw error;
    }
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch (cause) {
      const snippet = raw.replace(/\s+/g, " ").slice(start, start + 120);
      const error = new Error(`模型返回的 JSON 不完整或格式有误（返回片段：${snippet}）`);
      error.parseFailure = true;
      throw error;
    }
  }

  function normalizeModelItem(item) {
    const stage = LIFECYCLE_STAGES.includes(text(item.stage)) ? text(item.stage) : "";
    const isoDate = value => {
      const parsed = parseImportedDate(value);
      return parsed;
    };
    return {
      title: text(item.title || item.name).trim(),
      project: text(item.project).trim(),
      startDate: isoDate(item.startDate),
      dueDate: isoDate(item.dueDate),
      stageText: stage,
      owner: text(item.owner).trim(),
      priority: ["high", "medium", "low"].includes(text(item.priority)) ? text(item.priority) : "medium",
      sourceNote: "来源：AI 对话拆解（模型）",
      detail: ""
    };
  }

  // AI 直接拆解：模型返回的就是最终任务，本地只做格式校验与字段对齐，不进模板展开
  function normalizeModelTask(task, fallbackProject) {
    const title = text(task.title || task.name).trim();
    if (!title) return null;
    const stage = LIFECYCLE_STAGES.includes(text(task.stage)) ? text(task.stage) : "";
    const startDate = parseImportedDate(task.startDate) || offsetDate(0);
    const dueDate = parseImportedDate(task.dueDate);
    const estimate = Number(task.estimate);
    return {
      project: text(task.project).trim() || fallbackProject,
      stage: stage || "规划立项",
      owner: text(task.owner).trim(),
      priority: ["high", "medium", "low"].includes(text(task.priority)) ? text(task.priority) : "medium",
      status: "todo",
      completed: false,
      estimate: Number.isFinite(estimate) && estimate > 0 ? Math.round(estimate) : 2,
      title,
      startDate,
      dueDate: dueDate && dueDate >= startDate ? dueDate : startDate,
      tags: ["AI 拆解", stage || "规划立项"].filter(Boolean),
      notes: "来源：AI 对话拆解（模型直接生成）"
    };
  }

  function looksLikeHtml(body) {
    return /^\s*(?:<!doctype\s+html|<html\b|<head\b|<body\b|<div\b|<title\b|<script\b)/i.test(body || "");
  }

  function modelRequestError(message, details) {
    const error = new Error(message);
    error.modelDetails = details || {};
    return error;
  }

  function isAnthropicEndpoint(endpoint) {
    const raw = String(endpoint || "").trim();
    if (!raw) return false;
    return /api\.anthropic\.com/i.test(raw) || /\/v1\/messages$/i.test(raw);
  }

  function normalizeWithStyle(endpoint, style) {
    const raw0 = String(endpoint || "").trim().replace(/\/+$/, "");
    if (!raw0) return raw0;
    // 压缩协议头之外的连续斜杠（如 //proxy/），避免转发路径畸形；https:// 中的 // 不受影响
    const m = raw0.match(/^[a-z][a-z0-9+.-]*:\/\//i);
    const prefix = m ? m[0] : "";
    const raw = prefix + raw0.slice(prefix.length).replace(/([^:])\/{2,}/g, "$1/");
    // 先剥掉已有的 API 路径后缀（/chat/completions、/v1/messages、末尾 /v1），再按目标格式补全
    const base = raw.replace(/\/(v1\/)?(?:chat\/completions|messages)$/i, "").replace(/\/v1$/i, "");
    return style === "anthropic" ? `${base}/v1/messages` : `${base}/v1/chat/completions`;
  }

  function normalizeModelEndpoint(endpoint) {
    return normalizeWithStyle(endpoint, isAnthropicEndpoint(endpoint) ? "anthropic" : "openai");
  }

  function resolveStyle(config) {
    if (config.style === "anthropic") return "anthropic";
    if (config.style === "openai") return "openai";
    return isAnthropicEndpoint(config.endpoint) ? "anthropic" : "openai";
  }

  function anthropicContent(data) {
    const blocks = Array.isArray(data?.content) ? data.content : [];
    return blocks.filter(block => block?.type === "text").map(block => text(block?.text)).join("");
  }

  async function postChat(config, messages, { timeout = 30000, maxTokens } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const anthropic = resolveStyle(config) === "anthropic";
    let headers;
    let payload;
    if (anthropic) {
      const systemParts = messages.filter(item => item.role === "system").map(item => item.content).join("\n");
      headers = {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey || "",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      };
      payload = {
        model: config.model,
        max_tokens: maxTokens || 1024,
        temperature: 0.2,
        ...(systemParts ? { system: systemParts } : {}),
        messages: messages.filter(item => item.role !== "system")
      };
    } else {
      headers = {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      };
      payload = {
        model: config.model,
        temperature: 0.2,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        messages
      };
    }
    let response;
    try {
      response = await fetch(config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    let body = "";
    try { body = await response.text(); } catch (error) { body = ""; }
    const details = {
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      finalUrl: response.url || "",
      redirected: Boolean(response.redirected),
      snippet: body.trim().replace(/\s+/g, " ").slice(0, 160)
    };

    if (!response.ok) {
      throw modelRequestError(`模型接口返回 HTTP ${response.status}`, {
        ...details, kind: looksLikeHtml(body) ? "html" : "http"
      });
    }
    if (looksLikeHtml(body)) {
      throw modelRequestError("接口返回了 HTML 网页，不是 JSON", { ...details, kind: "html" });
    }
    if (!body.trim()) {
      throw modelRequestError("接口返回了空内容", { ...details, kind: "empty" });
    }
    let data;
    try { data = JSON.parse(body); }
    catch (error) {
      throw modelRequestError("接口返回内容不是合法 JSON", { ...details, kind: "json" });
    }
    const content = anthropic ? anthropicContent(data) : data?.choices?.[0]?.message?.content;
    if (!content) {
      throw modelRequestError(
        anthropic ? "返回 JSON 缺少 content 文本块" : "返回 JSON 缺少 choices[0].message.content",
        { ...details, kind: "shape" }
      );
    }
    return content;
  }

  async function requestModelDecomposition(history) {
    const config = loadModelConfig();
    if (!config.endpoint || !config.model) throw new Error("尚未配置模型");
    const weekday = parseLocalDate(chinaToday()).toLocaleDateString("zh-CN", { weekday: "long" });
    const systemContent = `${AI_DIRECT_SYSTEM_PROMPT} ${chinaToday()}（${weekday}）。`;
    // 真模型直接规划任务列表时输出较长：Anthropic 协议必须给足 max_tokens（默认 1024 会截断 JSON），中转站生成分给足超时
    const callOptions = { timeout: 90000, maxTokens: 4096 };
    const toResult = content => {
      const parsed = parseModelJson(content);
      const reply = text(parsed.reply);
      if (Array.isArray(parsed.tasks) && parsed.tasks.length) {
        const lastUser = [...history].reverse().find(item => item.role === "user");
        const fallbackProject = detectDefaultProject(text(lastUser?.content)) || `对话拆解 ${chinaToday()}`;
        const tasks = parsed.tasks.map(task => normalizeModelTask(task, fallbackProject)).filter(Boolean);
        if (!tasks.length) throw new Error("模型返回的任务列表没有可执行条目");
        return { tasks, reply, direct: true };
      }
      // 兼容模型仍返回旧「条目」结构的情况：条目走本地十阶段展开
      const items = Array.isArray(parsed.items) ? parsed.items.map(normalizeModelItem).filter(item => item.title) : [];
      if (items.length) return { items, reply, direct: false };
      // 合法 JSON 但没有任务：常见于只发了链接/问候语，模型已按要求在 reply 里说明原因
      return { reply, tasks: [], direct: true, empty: true };
    };
    try {
      const content = await postChat(config, [
        { role: "system", content: systemContent },
        ...history
      ], callOptions);
      return toResult(content);
    } catch (error) {
      // 网络 / HTTP / 超时类失败重试无意义；仅当模型没按要求输出 JSON 时，带一句强约束追问自动重试一次
      if (error.name === "AbortError" || error.modelDetails || !error.parseFailure) throw error;
      const lastUser = [...history].reverse().find(item => item.role === "user");
      const retryHistory = lastUser
        ? history.slice(0, history.lastIndexOf(lastUser)).concat([{ role: "user", content: `${text(lastUser.content)}\n\n（补充要求）${AI_JSON_RETRY_HINT}` }])
        : history.concat([{ role: "user", content: AI_JSON_RETRY_HINT }]);
      const content = await postChat(config, [
        { role: "system", content: systemContent },
        ...retryHistory
      ], callOptions);
      return toResult(content);
    }
  }

  // ---------- 消息与视图 ----------
  function pushAssistantMessage(message) {
    if (!state.assistant) state.assistant = { messages: [] };
    state.assistant.messages.push({
      id: uid("msg"),
      role: message.role || "assistant",
      kind: message.kind || "text",
      text: text(message.text),
      at: now(),
      engine: text(message.engine),
      fileName: text(message.fileName),
      tasks: Array.isArray(message.tasks) ? message.tasks : [],
      entries: Array.isArray(message.entries) ? message.entries : [],
      project: text(message.project),
      mode: ["full", "light", "original"].includes(message.mode) ? message.mode : "",
      committed: false
    });
    if (state.assistant.messages.length > 40) state.assistant.messages = state.assistant.messages.slice(-40);
    saveState();
    renderAssistantLog();
  }

  function assistantPreviewHtml(message) {
    const tasks = message.tasks || [];
    const projects = [...new Set(tasks.map(task => task.project))];
    const rows = tasks.slice(0, 60).map(task => `<tr><td>${escapeHtml(task.project)}</td><td>${escapeHtml(task.title)}</td><td>${escapeHtml(task.stage || "")}</td><td>${escapeHtml(task.owner || "—")}</td><td>${escapeHtml(friendlyDate(task.dueDate))}</td></tr>`).join("");
    const more = tasks.length > 60 ? `<p class="chat-more">仅展示前 60 项，全部 ${tasks.length} 项都会写入工作台。</p>` : "";
    return `<article class="chat-preview">
      <header class="chat-preview-head"><span class="chat-preview-badge">${icon("spark")}${escapeHtml(message.engine || "拆解结果")}</span><span class="chat-preview-meta">${tasks.length} 项任务 · ${projects.length} 个项目</span></header>
      <div class="chat-preview-body"><table class="chat-task-table"><thead><tr><th>项目</th><th>任务</th><th>阶段</th><th>负责人</th><th>截止</th></tr></thead><tbody>${rows}</tbody></table>${more}</div>
      <footer class="chat-preview-foot">${message.committed ? `<span class="chat-committed">${icon("check")}已加入工作台</span><button class="btn btn-secondary btn-small" data-action="assistant-goto">查看甘特图</button>` : `${Array.isArray(message.entries) && message.entries.length ? `<div class="mode-switch" role="group" aria-label="拆解粒度">${[["full", "完整"], ["light", "精简"], ["original", "原样"]].map(([value, label]) => `<button type="button" data-action="assistant-mode" data-msg="${escapeHtml(message.id)}" data-mode="${value}" class="${(message.mode || "full") === value ? "active" : ""}" aria-pressed="${(message.mode || "full") === value}">${label}</button>`).join("")}</div>` : `<span class="chat-ai-hint">${icon("spark")}AI 直接拆解 · 回复如「精简点」「去掉测试环节」可调整</span>`}<button class="btn btn-primary btn-small" data-action="assistant-commit" data-msg="${escapeHtml(message.id)}">${icon("check")}加入工作台</button>`}</footer>
    </article>`;
  }

  function assistantMessageHtml(message) {
    if (message.role === "user") {
      const body = message.kind === "file"
        ? `<span class="chat-file">${icon("table")}${escapeHtml(message.fileName || "表格")}</span>`
        : escapeHtml(message.text).replace(/\n/g, "<br>");
      return `<div class="chat-row user"><div class="chat-bubble">${body}</div></div>`;
    }
    if (message.kind === "preview") {
      return `<div class="chat-row assistant"><span class="chat-avatar">${icon("spark")}</span><div class="chat-stack">${assistantPreviewHtml(message)}</div></div>`;
    }
    const className = message.kind === "error" ? "chat-bubble error" : "chat-bubble";
    return `<div class="chat-row assistant"><span class="chat-avatar">${icon("spark")}</span><div class="chat-stack"><div class="${className}">${escapeHtml(message.text).replace(/\n/g, "<br>")}</div></div></div>`;
  }

  function assistantWelcomeHtml() {
    const config = loadModelConfig();
    const examples = [
      "项目：会员端 V2。下周一开始需求评审，本周三先做 30 分钟用户调研",
      "上线：企业码 V2.2 定在 12 月 15 日，负责人朱萍萍，优先级高",
      "1. 整理 1688 货盘接口字段\n2. 下周一上线天猫优品大客集采\n3. 上线两周内做复盘"
    ];
    return `<div class="chat-welcome">
      <div class="chat-welcome-icon">${icon("spark")}</div>
      <h3>把规划表或一句话丢进来，我拆成可执行任务</h3>
      <p class="chat-engine-note">${config.endpoint && config.model ? `已接入模型 <strong>${escapeHtml(config.model)}</strong>：拆解由 AI 直接规划——结合你的工作纪律（评审后 48 小时对齐、上线避开周五、上线两周复盘等），按内容决定任务数量，不再是固定模板。` : "当前使用<strong>本地规则拆解</strong>（固定十阶段模板，未调用模型）；可在右上角接入自己的模型接口，接入后改为 AI 直接规划。"}</p>
      <div class="chat-examples">${examples.map(example => `<button class="chat-example" data-action="assistant-example" data-text="${escapeHtml(example)}">${escapeHtml(example.replace(/\n/g, " / "))}</button>`).join("")}</div>
    </div>`;
  }

  function assistantLogHtml() {
    const messages = state.assistant?.messages || [];
    return messages.length ? messages.map(assistantMessageHtml).join("") : assistantWelcomeHtml();
  }

  function renderAssistantLog() {
    const log = document.getElementById("assistantLog");
    if (!log) return;
    log.innerHTML = assistantLogHtml();
    log.scrollTop = log.scrollHeight;
  }

  function assistantViewHtml() {
    const config = loadModelConfig();
    const connected = Boolean(config.endpoint && config.model);
    const draft = escapeHtml(ui.assistantDraft || "");
    return `<section class="assistant-panel">
      <div class="assistant-head">
        <div class="assistant-head-main"><span class="assistant-mark">${icon("spark")}</span><div><h2>AI 对话拆解</h2><p>上传任务表或直接说人话，自动拆成十阶段任务</p></div></div>
        <div class="assistant-head-actions">
          <span class="engine-chip ${connected ? "connected" : ""}">${icon("cpu")}${connected ? escapeHtml(config.model) : "本地规则"}</span>
          <button class="btn btn-secondary btn-small" data-action="assistant-settings">${icon("cpu")}模型设置</button>
          <button class="icon-btn" data-action="assistant-clear" title="清空对话" aria-label="清空对话">${icon("trash")}</button>
        </div>
      </div>
      <div class="assistant-log" id="assistantLog" aria-live="polite">${assistantLogHtml()}</div>
      <form class="assistant-composer" id="assistantForm">
        <textarea id="assistantInput" rows="2" placeholder="例如：项目：会员端 V2，12 月 15 日上线，负责人朱萍萍，优先级高。也可以直接粘贴多行任务。">${draft}</textarea>
        <div class="composer-bar">
          <div class="composer-left">
            <button type="button" class="text-btn" data-action="assistant-upload">${icon("upload")}上传任务表</button>
            <span class="composer-hint">${connected ? "AI 直接拆解：按内容规划任务与日期，随时回复「精简点」「去掉 xx」调整" : "本地模板拆解：默认完整十阶段，结果里可随时切换粒度"}</span>
          </div>
          <button type="submit" class="btn btn-primary btn-small">${icon("send")}拆解</button>
        </div>
      </form>
    </section>`;
  }

  async function handleAssistantFile(file) {
    if (!file) return;
    pushAssistantMessage({ role: "user", kind: "file", fileName: file.name || "粘贴表格" });
    try {
      if (!window.SpreadsheetReader) throw new Error("表格解析器未加载，请刷新页面");
      const parsed = await window.SpreadsheetReader.parse(file);
      const mapping = autoMapping(parsed.headers);
      if (!mapping.title) throw new Error("表格里没识别到「规划事项 / 需求」列，请到「项目规划 → 导入规划表」手动指定列名后再拆解");
      const fallbackProject = file.name.replace(/\.[^.]+$/, "") || "对话拆解";
      const entries = [];
      parsed.rows.forEach((row, rowIndex) => {
        const title = text(row[mapping.title]).trim();
        if (!title) return;
        entries.push({
          title,
          project: text(mapping.project ? row[mapping.project] : "").trim() || fallbackProject,
          startDate: parseImportedDate(row[mapping.start]),
          dueDate: parseImportedDate(row[mapping.due]),
          stageText: text(mapping.stage ? row[mapping.stage] : ""),
          owner: text(mapping.owner ? row[mapping.owner] : "").trim(),
          priority: priorityFrom(mapping.priority ? row[mapping.priority] : ""),
          initialStatus: statusFrom(mapping.status ? row[mapping.status] : "", false),
          sourceNote: `来源：${file.name} 第 ${rowIndex + 2} 行`,
          detail: text(mapping.description ? row[mapping.description] : "")
        });
      });
      if (!entries.length) throw new Error("表格里没有可拆解的行");
      pushPreview({ entries, project: fallbackProject, mode: "full", engine: "表格导入拆解", text: `已识别 ${parsed.rows.length} 行规划。` });
    } catch (error) {
      pushAssistantMessage({ role: "assistant", kind: "error", text: `表格拆解失败：${error.message || "格式不正确"}` });
    }
  }

  function assistantHistoryForModel() {
    const messages = state.assistant?.messages || [];
    const parts = messages
      .filter(message => message.role === "user" || (message.role === "assistant" && message.kind === "text"))
      .slice(-8)
      .map(message => ({ role: message.role, content: message.kind === "file" ? `上传了表格：${message.fileName}` : message.text }));
    // 把当前未入库的拆解结果（无论模板展开还是 AI 直接生成）注入上下文，模型才能做「精简点/去掉xx」这类追问调整
    const lastPending = [...messages].reverse().find(message => message.kind === "preview" && !message.committed && Array.isArray(message.tasks) && message.tasks.length);
    if (lastPending) {
      const digest = lastPending.tasks.slice(0, 40).map(({ title, project, stage, owner, priority, startDate, dueDate }) =>
        ({ title, project, stage, owner, priority, startDate, dueDate }));
      parts.push({ role: "assistant", content: `当前未入库的拆解任务列表（JSON，共 ${lastPending.tasks.length} 项）：\n${JSON.stringify(digest)}` });
    }
    return parts;
  }

  // 贴链接自动读正文：抓取输入中的 URL，提取 HTML 正文拼进模型上下文（仅对允许跨域的站点生效，读不到不阻塞拆解）
  async function fetchLinkContexts(input) {
    const urls = [...new Set((text(input).match(/https?:\/\/[^\s<>"'（）「」【】《》，。；：？！、]+/gi) || []).map(url => url.replace(/[),.;:]+$/, "")))].slice(0, 3);
    if (!urls.length) return { note: "", context: "" };
    const parts = [];
    const notes = [];
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) { notes.push(`${url} → HTTP ${response.status}`); continue; }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll("script, style, noscript, svg, iframe, nav, footer").forEach(el => el.remove());
        const body = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
        if (!body) { notes.push(`${url} → 页面没有可读正文`); continue; }
        const taken = body.slice(0, 6000);
        parts.push(`【链接正文】${url}\n${taken}`);
        notes.push(`${url} → 已读取 ${taken.length} 字正文`);
      } catch (error) {
        notes.push(`${url} → 读取失败（对方站点不允许跨域或网络不可达）`);
      }
    }
    return { note: notes.join("；"), context: parts.join("\n\n") };
  }

  async function sendAssistantMessage(raw) {
    const input = text(raw).trim();
    if (!input) { showToast("先说一句要拆解的规划", "error"); return; }
    ui.assistantDraft = "";
    const inputEl = document.getElementById("assistantInput");
    if (inputEl) inputEl.value = "";
    pushAssistantMessage({ role: "user", kind: "text", text: input });

    // 短句追问：若上一条预览是模板展开（有 entries），本地直接重算；AI 直接拆解的预览走模型重生成
    const followUp = granularityFromFollowUp(input);
    let aiFollowUpPreview = null;
    if (followUp) {
      const lastPreview = [...(state.assistant?.messages || [])].reverse().find(item => item.kind === "preview" && !item.committed && Array.isArray(item.entries) && item.entries.length);
      if (lastPreview) {
        setPreviewMode(lastPreview.id, followUp);
        pushAssistantMessage({
          role: "assistant", kind: "text",
          text: `已按「${followUp === "full" ? "完整十阶段" : followUp === "light" ? "每阶段一个动作" : "保留原任务"}」重新拆解，共 ${lastPreview.tasks.length} 项任务。`
        });
        return;
      }
      aiFollowUpPreview = [...(state.assistant?.messages || [])].reverse().find(item => item.kind === "preview" && !item.committed && Array.isArray(item.tasks) && item.tasks.length && !item.entries?.length) || null;
    }

    if (modelConfigured()) {
      const log = document.getElementById("assistantLog");
      const pending = document.createElement("div");
      pending.className = "chat-row assistant";
      pending.innerHTML = `<span class="chat-avatar">${icon("spark")}</span><div class="chat-stack"><div class="chat-bubble thinking">正在请求模型拆解…</div></div>`;
      log?.appendChild(pending);
      if (log) log.scrollTop = log.scrollHeight;
      try {
        // 输入里带了链接就先抓正文（读不到不阻塞），连同正文一起交给模型拆解
        const { note: linkNote, context: linkContext } = await fetchLinkContexts(input);
        if (linkNote) pushAssistantMessage({ role: "assistant", kind: "text", text: linkNote });
        const lastContent = linkContext ? `${input}\n\n[以下是输入中链接的正文，供拆解参考]\n${linkContext}` : input;
        const result = await requestModelDecomposition([...assistantHistoryForModel(), { role: "user", content: lastContent }]);
        const config = loadModelConfig();
        pending.remove();
        if (result.reply) pushAssistantMessage({ role: "assistant", kind: "text", text: result.reply });
        if (result.direct) {
          // 模型没识别出可拆解的任务（常见于只发链接/问候语）：上屏模型说明即可，不回退本地模板硬拆
          if (result.empty) {
            if (!result.reply) pushAssistantMessage({ role: "assistant", kind: "text", text: "模型没有从这句话里识别出可拆解的任务。如果输入里有链接或附件，模型读不了它们——把具体事项直接打字或粘贴进来（要做什么、时间、负责人）再试。" });
            return;
          }
          // AI 直接拆解：原地更新追问的预览，新规划则生成新预览卡
          const target = followUp ? aiFollowUpPreview : null;
          if (target) {
            target.tasks = result.tasks;
            saveState();
            renderAssistantLog();
            render();
          } else {
            pushAssistantMessage({ role: "assistant", kind: "preview", engine: `模型：${config.model} · AI 直接拆解`, tasks: result.tasks, entries: [], project: "", mode: "" });
          }
          return;
        }
        const entryProject = result.items.find(item => item.project)?.project || detectDefaultProject(input) || `对话拆解 ${chinaToday()}`;
        const normalized = result.items.map(item => ({ ...item, project: item.project || entryProject }));
        pushPreview({ entries: normalized, project: entryProject, mode: detectGranularity(input), engine: `模型：${config.model}` });
        return;
      } catch (error) {
        pending.remove();
        pushAssistantMessage({ role: "assistant", kind: "error", text: `模型调用失败：${describeFetchError(error, true)}。已自动改用本地规则拆解。` });
      }
    }

    try {
      const result = decomposeFromText(input);
      pushPreview({
        entries: result.entries, project: result.defaultProject, mode: detectGranularity(input),
        engine: modelConfigured() ? "本地规则拆解（模型失败后回退）" : "本地规则拆解",
        text: `识别到 ${result.segments} 条规划。`
      });
    } catch (error) {
      pushAssistantMessage({ role: "assistant", kind: "error", text: error.message });
    }
  }

  function commitAssistantMessage(messageId) {
    const message = (state.assistant?.messages || []).find(item => item.id === messageId);
    if (!message) return;
    if (message.committed) { setView("planning"); return; }
    const tasks = message.tasks.map(task => ({ ...task, id: uid("task") }));
    const ok = commitTasks(tasks, "AI 对话拆解", { stay: true });
    if (!ok) return;
    message.committed = true;
    saveState();
    renderAssistantLog();
    render();
  }

  function describeFetchError(error, brief = false) {
    if (error.name === "AbortError") return "请求超时，接口没在限定时间内响应";
    const raw = text(error.message);
    if (/Failed to fetch|NetworkError|Load failed/i.test(raw)) return "网络不可达或被跨域（CORS）策略拦截，浏览器不允许页面直连该接口";
    const d = error.modelDetails;
    if (!d || !d.kind) return raw || "未知错误";

    const lines = [];
    if (d.kind === "html") {
      lines.push("接口返回的是 HTML 网页，不是模型接口的 JSON —— 请求打到了一个页面，而不是 API。");
      if (!brief) lines.push("常见原因：① 接口地址填成了网站首页或后台地址，缺少 API 路径（OpenAI 兼容为 /chat/completions，Claude 为 /v1/messages）；② 被登录页、SSO 或网关拦截后跳转；③ 路径写错，服务端返回了 404 页面。");
    } else if (d.kind === "json") {
      lines.push("接口返回的不是合法 JSON，可能经过了代理或被替换成报错内容。");
    } else if (d.kind === "http") {
      lines.push(`接口返回 HTTP ${d.status}，通常是 API Key 无效、模型名不存在或接口路径不对。`);
    } else if (d.kind === "empty") {
      lines.push("接口返回了空内容，可能是网关拦截或请求方式不被支持。");
    } else if (d.kind === "shape") {
      lines.push("接口回了 JSON，但既不是 OpenAI 兼容结构（choices[0].message.content），也不是 Anthropic 结构（content 文本块）。");
    } else {
      lines.push(raw);
    }
    if (!brief) {
      const facts = [];
      if (d.status) facts.push(`HTTP ${d.status}`);
      if (d.contentType) facts.push(`Content-Type: ${d.contentType}`);
      if (d.redirected) facts.push(`发生了重定向 → ${d.finalUrl || "另一个地址"}`);
      if (d.snippet) facts.push(`响应开头：${d.snippet.slice(0, 90)}`);
      if (facts.length) lines.push(`实际拿到：${facts.join(" · ")}`);
    }
    return lines.join(brief ? " " : "\n");
  }

  async function testModelConnection() {
    const box = document.getElementById("modelTestResult");
    const endpointInput = document.getElementById("modelEndpoint");
    if (!box || !endpointInput) return;
    const base = {
      endpoint: endpointInput.value.trim(),
      model: document.getElementById("modelName").value.trim(),
      apiKey: document.getElementById("modelKey").value.trim(),
      style: loadModelConfig().style
    };
    if (!base.endpoint || !base.model) {
      box.className = "model-test-result error";
      box.textContent = "先把接口地址和模型名称填上，再测。";
      return;
    }
    const probe = [{ role: "user", content: "只回复两个字：收到" }];
    const tidy = value => text(value).replace(/[。.！!；;]\s*$/, "");
    const styleLabel = style => style === "anthropic" ? "Anthropic 原生（/v1/messages）" : "OpenAI 兼容（/chat/completions）";
    // 依次尝试：填写的原始地址 → 按地址特征补全路径 → 切换另一种接口格式
    const judgeStyle = isAnthropicEndpoint(base.endpoint) ? "anthropic" : "openai";
    const attempts = [{ style: judgeStyle, endpoint: base.endpoint, note: "" }];
    for (const style of [judgeStyle, judgeStyle === "anthropic" ? "openai" : "anthropic"]) {
      const endpoint = normalizeWithStyle(base.endpoint, style);
      if (endpoint && !attempts.some(item => item.endpoint === endpoint)) {
        attempts.push({
          style,
          endpoint,
          note: endpoint !== base.endpoint
            ? (style === judgeStyle ? `已自动补全接口路径 · 实际接口地址：${endpoint}` : `已自动切换接口格式重试 · 实际接口地址：${endpoint}`)
            : `已自动切换接口格式重试`
        });
      }
    }
    const showOk = (attempt, reply, ms) => {
      const finalConfig = { ...base, endpoint: attempt.endpoint, style: attempt.style };
      saveModelConfig(finalConfig);
      endpointInput.value = attempt.endpoint;
      box.className = "model-test-result ok";
      box.textContent = `连接成功 · ${ms} ms · 模型回："${text(reply).trim().slice(0, 24)}" · 接口格式：${styleLabel(attempt.style)}${attempt.note ? ` · ${attempt.note}` : ""} · 配置已保存`;
      render();
    };
    box.className = "model-test-result pending";
    box.textContent = "正在发一次最小请求…";
    const started = Date.now();
    const results = [];
    for (const attempt of attempts) {
      box.textContent = attempt === attempts[0]
        ? "正在发一次最小请求…"
        : `正在按 ${styleLabel(attempt.style)} 尝试 ${attempt.endpoint}…`;
      try {
        const reply = await postChat({ ...base, endpoint: attempt.endpoint, style: attempt.style }, probe, { timeout: attempt === attempts[0] ? 20000 : 15000, maxTokens: 16 });
        showOk(attempt, reply, Date.now() - started);
        return;
      } catch (error) {
        results.push({ attempt, error });
        if (error.name === "AbortError") break;
        // CORS 拦截（Failed to fetch）只影响当前地址，继续尝试下一个
      }
    }
    box.className = "model-test-result error";
    const lines = results.map(({ attempt, error }) => {
      const d = error.modelDetails;
      const facts = [];
      if (d && d.status) facts.push(`HTTP ${d.status}`);
      if (d && d.snippet) facts.push(`返回：${d.snippet.slice(0, 70)}`);
      const suffix = facts.length ? `（${facts.join(" · ")}）` : "";
      return `- ${attempt.endpoint} → ${tidy(describeFetchError(error, true))}${suffix}`;
    });
    // 自建转发层返回「用法：/proxy/…」提示时，说明地址少了转发前缀，给出正确格式而不是泛泛的排查建议
    const proxyMissing = results.some(({ attempt, error }) => /用法|\/proxy\//i.test(error?.modelDetails?.snippet || "") && !attempt.endpoint.includes("/proxy/"));
    box.textContent = `连接失败，各地址实际返回：\n${lines.join("\n")}\n${proxyMissing ? "看起来是自建转发（Worker）地址少了 /proxy/ 前缀，正确格式：https://<worker域名>/proxy/<完整目标URL>，例如 https://xxx.workers.dev/proxy/https://api.3366.ai/v1/messages。\n" : ""}都返回网页，说明地址打到了网站页面（核对 API 域名，注意 api. 前缀）；返回 401/403 则核对 API Key 与模型名。当前仍会使用本地规则拆解。`;
  }

  function openModelDialog() {
    const config = loadModelConfig();
    document.getElementById("modelEndpoint").value = config.endpoint || "";
    document.getElementById("modelName").value = config.model || "";
    document.getElementById("modelKey").value = config.apiKey || "";
    const box = document.getElementById("modelTestResult");
    if (box) {
      const styleName = config.style === "anthropic" ? "Anthropic 原生" : config.style === "openai" ? "OpenAI 兼容" : "";
      box.className = "model-test-result";
      box.textContent = config.endpoint && config.model
        ? `当前已保存：${config.model}${styleName ? `（${styleName}格式）` : ""}。想确认真的通，点「测试连接」。`
        : "还没配置。点一下「测试连接」会真发一次最小请求，直接看通不通。";
    }
    document.getElementById("modelDialog").showModal();
  }

  function clearAssistantHistory() {
    showConfirm({ title: "清空对话记录？", message: "对话与拆解预览会被清空，已经加入工作台的任务不受影响。", confirmText: "确认清空", onConfirm: () => {
      state.assistant = { messages: [] };
      ui.assistantDraft = "";
      saveState("对话已清空");
      render();
    } });
  }

  function renderOverview() {
    const hour = new Date().getHours();
    const greeting = hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
    return `<section class="welcome-row"><div><p class="eyebrow">MY DAILY OVERVIEW</p><h2>${greeting}，把今天过得清楚一点。</h2><p class="subtitle">重要的事有序推进，微小的感受也值得被认真记录。</p></div><span class="date-chip">${icon("calendar")}${parseLocalDate(chinaToday()).toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</span></section>
      <section class="stats-grid" aria-label="个人数据概览">${overviewStats().map(statCard).join("")}</section>
      <section class="overview-grid">
        <article class="panel"><div class="panel-header"><div><div class="panel-title">${icon("chart")}<h3>近 7 日行动节奏</h3></div><p class="panel-subtitle">完成工作与习惯打卡，来自你的实时记录</p></div><div class="chart-legend"><span><i class="legend-dot"></i>完成工作</span><span><i class="legend-dot light"></i>习惯打卡</span></div></div>${activityChart()}</article>
        <article class="panel"><div class="panel-header"><div><div class="panel-title">${icon("mood")}<h3>情绪天气</h3></div><p class="panel-subtitle">1–5 分 · 观察而不评判</p></div><button class="text-btn" data-view="moods">查看记录${icon("arrow")}</button></div>${moodChart()}</article>
      </section>
      <section class="overview-grid">
        <article class="panel focus-panel"><div class="panel-header"><div><div class="panel-title">${icon("work")}<h3>接下来要做</h3></div><p class="panel-subtitle">按截止日期排列的未完成任务</p></div><button class="text-btn" data-view="work">全部任务${icon("arrow")}</button></div>${focusList()}</article>
        <article class="panel recent-panel"><div class="panel-header"><div><div class="panel-title">${icon("bell")}<h3>今日工作提醒</h3></div><p class="panel-subtitle">按逾期、今日到期、启动与临期自动排序</p></div><button class="text-btn" data-view="planning">项目计划${icon("arrow")}</button></div>${reminderItemsHtml(5)}</article>
      </section>`;
  }

  function moduleStats(type) {
    const items = state[type];
    if (type === "work") return [
      ["未完成任务", items.filter(item => !item.completed).length, "项"],
      ["进行中", items.filter(item => item.status === "doing").length, "项"],
      ["今日到期", items.filter(item => !item.completed && item.dueDate === offsetDate(0)).length, "项"],
      ["预计剩余投入", items.filter(item => !item.completed).reduce((sum, item) => sum + number(item.estimate), 0), "h"]
    ];
    if (type === "learning") return [
      ["累计学习", (items.reduce((sum, item) => sum + number(item.minutes), 0) / 60).toFixed(1), "h"],
      ["进行中", items.filter(item => item.status === "active").length, "项"],
      ["平均进度", items.length ? Math.round(items.reduce((sum, item) => sum + number(item.progress), 0) / items.length) : 0, "%"],
      ["已完成", items.filter(item => item.completed).length, "项"]
    ];
    if (type === "media") return [
      ["已发布", items.filter(item => item.status === "published").length, "篇"],
      ["创作与待发布", items.filter(item => ["draft", "scheduled"].includes(item.status)).length, "篇"],
      ["累计阅读/播放", formatNumber(items.reduce((sum, item) => sum + number(item.views), 0)), ""],
      ["累计互动", formatNumber(items.reduce((sum, item) => sum + number(item.likes) + number(item.comments), 0)), ""]
    ];
    if (type === "ideas") return [
      ["灵感总数", items.length, "条"],
      ["高潜力灵感", items.filter(item => number(item.score) >= 4).length, "条"],
      ["孵化中", items.filter(item => item.status === "incubating").length, "条"],
      ["已转化", items.filter(item => item.completed).length, "条"]
    ];
    if (type === "habits") return [
      ["启用习惯", items.filter(item => item.active).length, "个"],
      ["今日已打卡", items.filter(item => item.active && item.checkins.includes(offsetDate(0))).length, "个"],
      ["本周打卡率", habitWeekRate(), "%"],
      ["累计打卡", items.reduce((sum, item) => sum + item.checkins.length, 0), "次"]
    ];
    const average = key => items.length ? (items.reduce((sum, item) => sum + number(item[key]), 0) / items.length).toFixed(1) : "—";
    return [["情绪记录", items.length, "条"], ["平均情绪", average("score"), "/5"], ["平均精力", average("energy"), "/5"], ["已复盘", items.filter(item => item.completed).length, "条"]];
  }

  function filteredRecords(type) {
    const filter = ui.filters[type];
    const query = filter.query.trim().toLowerCase();
    const items = state[type].filter(item => {
      const matchesQuery = !query || Object.values(item).join(" ").toLowerCase().includes(query);
      let matchesStatus = filter.status === "all";
      if (!matchesStatus && type === "habits") {
        if (["active", "paused"].includes(filter.status)) matchesStatus = filter.status === "active" ? item.active : !item.active;
        if (filter.status === "checked") matchesStatus = item.checkins.includes(offsetDate(0));
        if (filter.status === "unchecked") matchesStatus = !item.checkins.includes(offsetDate(0));
      } else if (!matchesStatus && type === "moods") matchesStatus = item.mood === filter.status;
      else if (!matchesStatus) matchesStatus = item.status === filter.status;
      return matchesQuery && matchesStatus;
    });
    return items.sort((a, b) => {
      if (filter.sort === "title") return getTitle(type, a).localeCompare(getTitle(type, b), "zh-CN");
      if (filter.sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
      if (filter.sort === "date") {
        const key = { work: "dueDate", learning: "nextDate", media: "publishDate", moods: "date" }[type];
        const aDate = key ? a[key] : a.createdAt;
        const bDate = key ? b[key] : b.createdAt;
        return text(aDate || "9999").localeCompare(text(bDate || "9999"));
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  function statusPill(type, item) {
    let status = item.status, label = getStatusLabel(type, status), className = "";
    if (type === "work") { label = priorityMap[item.priority]?.[0] || label; className = priorityMap[item.priority]?.[1] || ""; }
    if (type === "habits") { label = item.active ? "进行中" : "已暂停"; className = item.active ? "success" : ""; }
    if (type === "moods") { label = item.mood; className = number(item.score) >= 4 ? "success" : number(item.score) <= 2 ? "warning" : "info"; }
    if (["done", "published", "converted"].includes(status)) className = "success";
    if (["doing", "draft", "incubating"].includes(status)) className = "info";
    if (["scheduled"].includes(status)) className = "warning";
    return `<span class="status-pill ${className}">${escapeHtml(label)}</span>`;
  }

  function tagsHtml(tags) { return `<div class="tag-list">${(tags || []).slice(0, 3).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`; }
  function scoreDots(score) { return `<span class="score-dots" aria-label="评分 ${score} 分">${Array.from({ length: 5 }, (_, index) => `<i class="score-dot ${index < number(score) ? "filled" : ""}"></i>`).join("")}</span>`; }
  function actionButtons(type, item) {
    const title = getTitle(type, item);
    return `<div class="record-actions"><button class="icon-btn" data-action="edit" data-type="${type}" data-id="${escapeHtml(item.id)}" aria-label="编辑${escapeHtml(title)}" title="编辑">${icon("edit")}</button><button class="icon-btn danger" data-action="delete" data-type="${type}" data-id="${escapeHtml(item.id)}" aria-label="删除${escapeHtml(title)}" title="删除">${icon("trash")}</button></div>`;
  }

  function habitWeek(item) {
    return `<div class="habit-week" aria-label="${escapeHtml(item.name)}近七日打卡">${weekDates().map(date => {
      const day = parseLocalDate(date);
      const isChecked = item.checkins.includes(date);
      return `<div class="habit-day"><small>${DAY_NAMES[day.getDay()].slice(1)}</small><button class="habit-check ${isChecked ? "checked" : ""} ${date === offsetDate(0) ? "today" : ""}" data-action="habit-toggle" data-id="${escapeHtml(item.id)}" data-date="${date}" aria-label="${formatDate(date)}${isChecked ? "取消打卡" : "打卡"}" title="${formatDate(date)}">${icon("check")}</button></div>`;
    }).join("")}</div>`;
  }

  function recordCard(type, item) {
    const complete = isComplete(type, item);
    if (type === "habits") {
      const weekCount = item.checkins.filter(date => weekDates().includes(date)).length;
      return `<article class="record-card"><div class="record-head"><span class="stat-icon">${icon("habit")}</span><div class="record-heading"><h3 class="record-title">${escapeHtml(item.name)}</h3><p class="record-type">${frequencyMap[item.frequency] || "每周"} · 目标 ${item.target} 次/周</p></div>${actionButtons(type, item)}</div>${item.notes ? `<p class="record-description">${escapeHtml(item.notes)}</p>` : ""}${habitWeek(item)}<div class="record-footer"><div>${tagsHtml(item.tags)}<span class="record-type">本周 ${weekCount}/${item.target} ${escapeHtml(item.unit || "次")}</span></div>${statusPill(type, item)}</div></article>`;
    }
    if (type === "moods") {
      return `<article class="record-card ${complete ? "is-complete" : ""}"><div class="mood-card-top"><span class="mood-symbol">${icon("mood")}</span><div class="record-heading"><h3 class="record-title">${escapeHtml(item.mood)}</h3><p class="record-type">${formatDate(item.date, true)} · 精力 ${item.energy}/5</p></div>${actionButtons(type, item)}</div><div class="record-meta">${scoreDots(item.score)}<span>情绪 ${item.score}/5</span></div>${item.trigger ? `<p class="record-description"><strong>触发因素：</strong>${escapeHtml(item.trigger)}</p>` : ""}${item.notes ? `<p class="record-description">${escapeHtml(item.notes)}</p>` : ""}<div class="record-footer"><div>${tagsHtml(item.tags)}${checkboxControl(type, item, `${complete ? "取消" : "标记"}已复盘`)}</div>${statusPill(type, item)}</div></article>`;
    }
    let description = item.notes;
    let meta = "";
    let progress = "";
    if (type === "work") meta = `<span class="meta-item">${icon("project")}${escapeHtml(item.stage || "未分阶段")}</span><span class="meta-item">${icon("calendar")}${friendlyDate(item.dueDate)}</span><span class="meta-item">${icon("clock")}${number(item.estimate)}h</span><span class="meta-item">${escapeHtml(item.owner || "待认领")}</span>`;
    if (type === "learning") {
      meta = `<span class="meta-item">${icon("learning")}${escapeHtml(item.platform || "未设平台")}</span><span class="meta-item">${icon("clock")}${formatNumber(item.minutes)} 分钟</span>`;
      progress = `<div class="progress-track" aria-label="学习进度 ${number(item.progress)}%"><div class="progress-fill" style="width:${clamp(item.progress, 0, 100)}%"></div></div><p class="record-type">进度 ${number(item.progress)}% · 下次 ${friendlyDate(item.nextDate)}</p>`;
    }
    if (type === "media") {
      description = item.notes || item.topic;
      meta = `<span class="meta-item">${icon("media")}${escapeHtml(item.channel || "未设平台")} · ${escapeHtml(item.format || "内容")}</span><span class="meta-item">${icon("calendar")}${friendlyDate(item.publishDate)}</span>${item.status === "published" ? `<span class="meta-item">${formatNumber(item.views)} 阅读 · ${formatNumber(item.likes)} 赞</span>` : ""}`;
    }
    if (type === "ideas") {
      description = item.content;
      meta = `${scoreDots(item.score)}<span class="meta-item">${escapeHtml(item.category || "未分类")}</span>`;
    }
    return `<article class="record-card ${complete ? "is-complete" : ""}"><div class="record-head">${checkboxControl(type, item, `${complete ? "取消完成" : "完成"}${getTitle(type, item)}`)}<div class="record-heading"><h3 class="record-title">${escapeHtml(getTitle(type, item))}</h3><p class="record-type">${escapeHtml(type === "work" ? item.project || "未分组" : type === "learning" ? item.category || "未分类" : type === "media" ? item.topic || "未设选题" : item.category || "未分类")}</p></div>${actionButtons(type, item)}</div>${description ? `<p class="record-description">${escapeHtml(description)}</p>` : ""}<div class="record-meta">${meta}</div>${progress}<div class="record-footer">${tagsHtml(item.tags)}${statusPill(type, item)}</div></article>`;
  }

  function emptyState(type, hasFilters) {
    return `<div class="empty-state"><div><span class="empty-icon">${icon(hasFilters ? "search" : modules[type].icon)}</span><h3>${hasFilters ? "没有找到匹配的记录" : `还没有${modules[type].label}记录`}</h3><p>${hasFilters ? "试试更换关键词或状态，也可以清空当前筛选。" : `从一个简单的${modules[type].singular}开始，逐步建立你的个人节奏。`}</p><button class="btn ${hasFilters ? "btn-secondary" : "btn-primary"}" data-action="${hasFilters ? "clear-filters" : "new-record"}" data-type="${type}">${icon(hasFilters ? "reset" : "plus")}${hasFilters ? "清空筛选" : `新增${modules[type].singular}`}</button></div></div>`;
  }

  function renderModule(type) {
    const config = modules[type];
    const filter = ui.filters[type];
    const records = filteredRecords(type);
    const hasFilters = Boolean(filter.query || filter.status !== "all");
    return `<section class="module-intro"><div><p class="eyebrow">${config.kicker}</p><h2>${config.label}管理</h2><p>${config.description}</p></div><button class="btn btn-primary" data-action="new-record" data-type="${type}">${icon("plus")}新增${config.singular}</button></section>
      <section class="module-summary" aria-label="${config.label}统计">${moduleStats(type).map(([label, value, unit]) => `<div class="summary-item"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join("")}</section>
      <section class="toolbar" aria-label="筛选记录"><div class="search-box">${icon("search")}<input id="moduleSearch" type="search" value="${escapeHtml(filter.query)}" placeholder="${config.search}" aria-label="搜索${config.label}记录"></div><select id="statusFilter" class="select-control" aria-label="按状态筛选"><option value="all">全部状态</option>${config.statuses.map(([value, label]) => `<option value="${value}" ${selected(filter.status, value)}>${label}</option>`).join("")}</select><select id="sortFilter" class="select-control" aria-label="排序方式"><option value="updated" ${selected(filter.sort, "updated")}>最近更新</option><option value="created" ${selected(filter.sort, "created")}>最近创建</option><option value="date" ${selected(filter.sort, "date")}>按日期</option><option value="title" ${selected(filter.sort, "title")}>按名称</option></select>${hasFilters ? `<button class="icon-btn" data-action="clear-filters" data-type="${type}" aria-label="清空筛选" title="清空筛选">${icon("reset")}</button>` : ""}<span class="result-count">${records.length} / ${state[type].length} 条记录</span></section>
      <section class="records-grid" aria-live="polite">${records.length ? records.map(item => recordCard(type, item)).join("") : emptyState(type, hasFilters)}</section>`;
  }

  function projectNames() {
    return [...new Set([...state.projects.map(project => project.name), ...state.work.map(task => task.project).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "zh-CN"));
  }

  function taskStartDate(task) {
    return task.startDate || (task.createdAt && !Number.isNaN(new Date(task.createdAt).getTime()) ? toDateString(new Date(task.createdAt)) : task.dueDate ? addDays(task.dueDate, -1) : offsetDate(0));
  }

  function ganttHtml() {
    const names = projectNames();
    if (ui.planning.project !== "all" && !names.includes(ui.planning.project)) ui.planning.project = "all";
    const tasks = state.work.filter(task => (ui.planning.project === "all" || task.project === ui.planning.project) && (ui.planning.status === "all" || (ui.planning.status === "done" ? task.completed : !task.completed)));
    if (!tasks.length) return `<div class="empty-state"><div><span class="empty-icon">${icon("project")}</span><h3>当前筛选下没有项目任务</h3><p>导入产品规划表，或切换项目与状态筛选。</p><button class="btn btn-primary" data-action="import-plan">${icon("upload")}导入规划表</button></div></div>`;
    const normalized = tasks.map(task => {
      const start = taskStartDate(task);
      const due = task.dueDate && dayDiff(start, task.dueDate) >= 0 ? task.dueDate : start;
      return { task, start, due };
    }).sort((a, b) => a.start.localeCompare(b.start) || a.due.localeCompare(b.due));
    const today = offsetDate(0);
    const minDate = [today, ...normalized.map(item => item.start)].sort()[0];
    const maxDate = [addDays(today, 7), ...normalized.map(item => item.due)].sort().at(-1);
    const days = dayDiff(minDate, maxDate) + 1;
    const dayWidth = days > 60 ? 25 : days > 31 ? 29 : 36;
    const timelineWidth = days * dayWidth;
    const style = `--timeline-width:${timelineWidth}px;--day-width:${dayWidth}px`;
    const headerDays = Array.from({ length: days }, (_, index) => {
      const date = addDays(minDate, index), parsed = parseLocalDate(date);
      return `<div class="gantt-day ${date === today ? "is-today" : ""}">${index === 0 || parsed.getDate() === 1 || days <= 31 ? `${parsed.getMonth() + 1}/${parsed.getDate()}` : parsed.getDate()}<br>${DAY_NAMES[parsed.getDay()].slice(1)}</div>`;
    }).join("");
    const rows = normalized.slice(0, 120).map(({ task, start, due }) => {
      const left = dayDiff(minDate, start) * dayWidth;
      const width = (dayDiff(start, due) + 1) * dayWidth - 4;
      const overdue = !task.completed && due < today;
      const todayLine = `<i class="gantt-today-line" style="left:${dayDiff(minDate, today) * dayWidth + dayWidth / 2}px"></i>`;
      return `<div class="gantt-row" style="${style}"><div class="gantt-label"><strong title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</strong><small>${escapeHtml(task.project || "未分组")} · ${escapeHtml(task.stage || "执行")} · ${escapeHtml(task.owner || "待认领")}</small></div><div class="gantt-track">${todayLine}<button class="gantt-bar ${task.completed ? "done" : overdue ? "overdue" : ""}" style="left:${left + 2}px;width:${Math.max(12, width)}px" data-action="edit" data-type="work" data-id="${escapeHtml(task.id)}" title="${escapeHtml(task.title)}｜${formatDate(start)}–${formatDate(due)}">${width > 105 ? escapeHtml(task.title) : ""}</button></div></div>`;
    }).join("");
    return `<div class="gantt-scroll"><div class="gantt-inner"><div class="gantt-row header" style="${style}"><div class="gantt-label">任务 / 阶段 / 负责人</div><div class="gantt-days">${headerDays}</div></div>${rows}</div></div>${normalized.length > 120 ? `<p class="notification-hint">为保证流畅度，当前显示前 120 条，请按项目筛选。</p>` : ""}`;
  }

  function projectCardsHtml() {
    const names = projectNames();
    if (!names.length) return `<div class="chart-empty">导入规划表后，这里会出现项目阶段进度。</div>`;
    return `<div class="project-list">${names.map(name => {
      const tasks = state.work.filter(task => task.project === name);
      const done = tasks.filter(task => task.completed).length;
      const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
      const project = state.projects.find(item => item.name === name);
      const stages = LIFECYCLE_STAGES.map(stage => {
        const stageTasks = tasks.filter(task => task.stage === stage);
        const className = stageTasks.length && stageTasks.every(task => task.completed) ? "done" : stageTasks.some(task => !task.completed && (task.status === "doing" || taskStartDate(task) <= offsetDate(0))) ? "active" : "";
        return `<span class="stage-node ${className}" title="${stage}：${stageTasks.length} 项任务">${stage}</span>`;
      }).join("");
      return `<article class="project-card"><div class="project-card-head"><div><h4>${escapeHtml(name)}</h4><p>${escapeHtml(project?.goal || `${tasks.length} 项任务 · ${project?.owner || "负责人待确认"}`)}</p></div><span class="status-pill ${progress === 100 ? "success" : "info"}">${progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div><div class="stage-flow">${stages}</div></article>`;
    }).join("")}</div>`;
  }

  function renderPlanning() {
    const activeTasks = state.work.filter(task => !task.completed);
    const reminders = getReminders();
    const average = state.work.length ? Math.round(state.work.filter(task => task.completed).length / state.work.length * 100) : 0;
    return `<section class="module-intro"><div><p class="eyebrow">PRODUCT LIFECYCLE WORKFLOW</p><h2>产品规划执行台</h2><p>按你的十阶段生命周期拆解任务，让规划、评审、上线与复盘形成闭环。</p></div><div class="planning-actions"><button class="btn btn-secondary" data-action="download-template">${icon("download")}下载表格模板</button><button class="btn btn-primary" data-action="import-plan">${icon("upload")}导入规划表</button></div></section>
      <section class="module-summary"><div class="summary-item"><span>进行中项目</span><strong>${projectNames().length}<small>个</small></strong></div><div class="summary-item"><span>未完成任务</span><strong>${activeTasks.length}<small>项</small></strong></div><div class="summary-item"><span>任务完成率</span><strong>${average}<small>%</small></strong></div><div class="summary-item"><span>今日需关注</span><strong>${reminders.length}<small>项</small></strong></div></section>
      <section class="panel gantt-panel"><div class="panel-header"><div><div class="panel-title">${icon("project")}<h3>项目甘特图</h3></div><p class="panel-subtitle">点击任务条可编辑日期与阶段；红色表示已逾期</p></div><div class="planning-toolbar"><select id="projectFilter" class="select-control" aria-label="筛选项目"><option value="all">全部项目</option>${projectNames().map(name => `<option value="${escapeHtml(name)}" ${selected(ui.planning.project, name)}>${escapeHtml(name)}</option>`).join("")}</select><select id="ganttStatus" class="select-control" aria-label="筛选任务状态"><option value="active" ${selected(ui.planning.status, "active")}>未完成</option><option value="done" ${selected(ui.planning.status, "done")}>已完成</option><option value="all" ${selected(ui.planning.status, "all")}>全部任务</option></select></div></div><div class="gantt-legend" style="padding:0 22px 15px"><span><i></i>计划任务</span><span><i class="done"></i>已完成</span><span>竖线表示今天</span></div>${ganttHtml()}</section>
      <section class="planning-lower"><article class="panel"><div class="panel-header"><div><div class="panel-title">${icon("chart")}<h3>十阶段项目进度</h3></div><p class="panel-subtitle">绿色为已闭环，描边为当前进行中</p></div></div>${projectCardsHtml()}</article><article class="panel" id="dailyReminders"><div class="panel-header"><div><div class="panel-title">${icon("bell")}<h3>每日工作提醒</h3></div><p class="panel-subtitle">包含周五发布纪律等流程提醒</p></div></div>${reminderItemsHtml()}${reminderSettingsHtml()}</article></section>`;
  }

  function render() {
    const isOverview = ui.view === "overview";
    const isPlanning = ui.view === "planning";
    const isAssistant = ui.view === "assistant";
    const isAutomation = ui.view === "automation";
    const config = isOverview || isPlanning || isAssistant || isAutomation ? null : modules[ui.view];
    document.getElementById("viewTitle").textContent = isOverview ? "今日总览" : isPlanning ? "项目规划" : isAssistant ? "AI 对话拆解" : isAutomation ? "定时任务" : config.label;
    document.getElementById("viewKicker").textContent = isOverview ? "PERSONAL WORKSPACE" : isPlanning ? "PRODUCT LIFECYCLE WORKFLOW" : isAssistant ? "CONVERSATIONAL PLANNING" : isAutomation ? "LOCAL DAILY AUTOMATION" : config.kicker;
    document.querySelector("#addBtn span").textContent = isOverview ? "快速新增" : isPlanning ? "导入规划表" : isAssistant ? "上传任务表" : isAutomation ? "立即生成 T5T" : `新增${config.singular}`;
    document.querySelectorAll(".main-nav .nav-item[data-view]").forEach(button => {
      const active = button.dataset.view === ui.view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    const pending = state.work.filter(item => !item.completed).length;
    const reminderCount = getReminders().length;
    document.querySelector('[data-count="work"]').textContent = pending || "";
    document.querySelector('[data-count="planning"]').textContent = reminderCount || "";
    document.getElementById("reminderBadge").textContent = reminderCount || "";
    document.getElementById("reminderBtn").setAttribute("aria-label", `查看今日工作提醒，${reminderCount} 项待关注`);
    const automationDot = document.getElementById("automationNavStatus");
    automationDot.classList.toggle("paused", !state.settings.t5t.enabled);
    automationDot.title = state.settings.t5t.enabled ? "T5T 定时任务运行中" : "T5T 定时任务已暂停";
    main.innerHTML = isOverview ? renderOverview() : isPlanning ? renderPlanning() : isAssistant ? assistantViewHtml() : isAutomation ? automationViewHtml() : renderModule(ui.view);
    if (isAssistant) {
      const log = document.getElementById("assistantLog");
      if (log) log.scrollTop = log.scrollHeight;
    }
  }

  function setView(view) {
    if (!["overview", "planning", "assistant", "automation"].includes(view) && !modules[view]) return;
    ui.view = view;
    document.body.classList.remove("nav-open");
    try { history.replaceState(null, "", `#${view}`); } catch (error) { /* file:// browsers can restrict history updates */ }
    render();
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function defaultValue(field, type) {
    if (field.default !== undefined) return field.default;
    if (field.type === "date") return offsetDate(0);
    if (field.type === "number") return 0;
    if (field.type === "checkbox") return false;
    return "";
  }

  function fieldHtml(field, item, type) {
    const value = item ? item[field.name] : defaultValue(field, type);
    const required = field.required ? "required" : "";
    const requiredMark = field.required ? '<span class="required">*</span>' : "";
    if (field.type === "checkbox") return `<div class="form-checkbox"><input id="field-${field.name}" name="${field.name}" type="checkbox" ${checked(value)}><label for="field-${field.name}">${field.label}</label></div>`;
    const classes = `form-field ${field.full ? "full" : ""}`;
    const hint = field.hint ? `<small>${field.hint}</small>` : "";
    if (field.type === "textarea") return `<div class="${classes}"><label for="field-${field.name}">${field.label}${requiredMark}</label><textarea id="field-${field.name}" name="${field.name}" placeholder="${escapeHtml(field.placeholder || "")}" ${required}>${escapeHtml(value)}</textarea>${hint}</div>`;
    if (field.type === "select") return `<div class="${classes}"><label for="field-${field.name}">${field.label}${requiredMark}</label><select id="field-${field.name}" name="${field.name}" ${required}>${field.options.map(([option, label]) => `<option value="${option}" ${selected(value, option)}>${label}</option>`).join("")}</select>${hint}</div>`;
    return `<div class="${classes}"><label for="field-${field.name}">${field.label}${requiredMark}</label><input id="field-${field.name}" name="${field.name}" type="${field.type}" value="${escapeHtml(field.name === "tags" ? (value || []).join(", ") : value)}" placeholder="${escapeHtml(field.placeholder || "")}" ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.max !== undefined ? `max="${field.max}"` : ""} ${field.step !== undefined ? `step="${field.step}"` : ""} ${required}>${hint}</div>`;
  }

  function openRecordModal(type, id = null) {
    const config = modules[type];
    const item = id ? state[type].find(record => record.id === id) : null;
    recordForm.dataset.type = type;
    recordForm.dataset.id = id || "";
    document.getElementById("recordDialogEyebrow").textContent = item ? "EDIT RECORD" : "NEW RECORD";
    document.getElementById("recordDialogTitle").textContent = `${item ? "编辑" : "新增"}${config.singular}`;
    document.getElementById("recordFields").innerHTML = config.fields.map(field => fieldHtml(field, item, type)).join("");
    recordDialog.showModal();
    setTimeout(() => recordDialog.querySelector("input:not([type=checkbox]), textarea, select")?.focus(), 50);
  }

  const PLANNING_FIELDS = [
    { key: "project", label: "项目名称", aliases: ["项目", "项目名称", "产品", "产品名称", "规划项目"] },
    { key: "title", label: "规划事项/需求", required: true, aliases: ["任务", "任务名称", "需求", "需求名称", "功能", "功能点", "事项", "规划内容", "内容", "需求描述"] },
    { key: "stage", label: "当前阶段", aliases: ["阶段", "生命周期", "当前阶段", "里程碑"] },
    { key: "owner", label: "负责人", aliases: ["负责人", "责任人", "owner", "跟进人"] },
    { key: "priority", label: "优先级", aliases: ["优先级", "重要程度", "priority", "级别"] },
    { key: "start", label: "开始日期", aliases: ["开始日期", "开始时间", "启动日期", "计划开始", "开始"] },
    { key: "due", label: "截止/上线日期", aliases: ["截止日期", "结束日期", "完成日期", "计划完成", "交付日期", "上线日期", "截止", "结束"] },
    { key: "status", label: "当前状态", aliases: ["状态", "任务状态", "进度"] },
    { key: "goal", label: "业务目标", aliases: ["目标", "业务目标", "项目目标", "规划目标"] },
    { key: "description", label: "描述/备注", aliases: ["描述", "说明", "备注", "需求描述", "任务说明", "规划说明"] }
  ];

  function normalizeHeader(value) {
    return text(value).toLowerCase().replace(/[\s_\-—/（）()【】[\]]/g, "");
  }

  function autoMapping(headers) {
    const mapping = {};
    const used = new Set();
    PLANNING_FIELDS.forEach(field => {
      const match = headers.find(header => {
        if (used.has(header)) return false;
        const normalized = normalizeHeader(header);
        return field.aliases.some(alias => normalized === normalizeHeader(alias) || normalized.includes(normalizeHeader(alias)));
      });
      if (match) { mapping[field.key] = match; used.add(match); }
    });
    return mapping;
  }

  function openPlanningImport() {
    planImport = { step: "upload", fileName: "", sheetName: "", headers: [], rows: [], mapping: {}, options: { projectName: "", mode: "full", scope: "all" }, tasks: [] };
    renderPlanImport();
    document.getElementById("planImportDialog").showModal();
  }

  function planSteps(active) {
    const steps = [["1", "选择表格"], ["2", "确认字段"], ["3", "调整拆解"]];
    return `<div class="import-steps">${steps.map(([number, label], index) => `<span class="${index === active ? "active" : ""}"><b>${index < active ? "✓" : number}</b>${label}</span>${index < steps.length - 1 ? "→" : ""}`).join("")}</div>`;
  }

  function planUploadHtml() {
    return `${planSteps(0)}<label class="file-drop" id="planFileDrop"><span class="empty-icon">${icon("table")}</span><h3>选择或拖入产品规划表</h3><p>支持 XLSX、CSV、TSV；旧版 XLS 请先另存为 XLSX 或 CSV</p><input type="file" id="planningFileInput" accept=".xlsx,.csv,.tsv,.txt" hidden></label><div class="paste-divider">或者直接粘贴表格</div><textarea class="plan-paste" id="planPasteText" placeholder="从 Excel 复制单元格后粘贴到这里，可包含表头。例：&#10;项目名称&#9;规划事项&#9;负责人&#9;开始日期&#9;截止日期&#10;会员端改造&#9;AI 规划助手&#9;朱萍萍&#9;2026-11-24&#9;2026-12-31"></textarea><div class="import-actions"><button class="text-btn" data-plan-action="template">${icon("download")}下载标准模板</button><div><button class="btn btn-secondary" data-plan-action="parse-paste">${icon("table")}解析粘贴内容</button></div></div>`;
  }

  function mappingSelect(field) {
    return `<div class="mapping-field"><label for="map-${field.key}">${field.label}${field.required ? '<span class="required"> *</span>' : ""}</label><select id="map-${field.key}" data-plan-map="${field.key}"><option value="">不导入</option>${planImport.headers.map(header => `<option value="${escapeHtml(header)}" ${selected(planImport.mapping[field.key], header)}>${escapeHtml(header)}</option>`).join("")}</select></div>`;
  }

  function rawPreviewHtml() {
    return `<div class="table-preview"><table><thead><tr>${planImport.headers.slice(0, 8).map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${planImport.rows.slice(0, 4).map(row => `<tr>${planImport.headers.slice(0, 8).map(header => `<td title="${escapeHtml(row[header])}">${escapeHtml(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function planMappingHtml() {
    return `${planSteps(1)}<div class="import-summary"><span>文件：<strong>${escapeHtml(planImport.fileName)}</strong></span><span>工作表：<strong>${escapeHtml(planImport.sheetName)}</strong></span><span>识别到 <strong>${planImport.rows.length}</strong> 行规划</span></div><div class="mapping-grid">${PLANNING_FIELDS.map(mappingSelect).join("")}</div><div class="decompose-options"><div><label for="planProjectName">默认项目名</label><input id="planProjectName" data-plan-option="projectName" value="${escapeHtml(planImport.options.projectName)}" placeholder="项目列缺失时使用"></div><div><label for="planMode">拆解方式</label><select id="planMode" data-plan-option="mode"><option value="full" ${selected(planImport.options.mode, "full")}>完整十阶段 SOP</option><option value="light" ${selected(planImport.options.mode, "light")}>每阶段一个关键动作</option><option value="original" ${selected(planImport.options.mode, "original")}>保留原任务，不拆解</option></select></div><div><label for="planScope">生成范围</label><select id="planScope" data-plan-option="scope"><option value="all" ${selected(planImport.options.scope, "all")}>生成全部阶段</option><option value="forward" ${selected(planImport.options.scope, "forward")}>当前阶段及后续</option><option value="current" ${selected(planImport.options.scope, "current")}>仅当前阶段</option></select></div></div><div class="workflow-note">${icon("idea")}<span>完整 SOP 内置：30 分钟调研纪要、评审后 48 小时对齐、周五自测 / 周一上线（周五不发布）、上线说明与分层培训、两周复盘回流。当前阶段缺失时按全流程生成。</span></div>${rawPreviewHtml()}<div class="import-actions"><button class="btn btn-secondary" data-plan-action="back-upload">${icon("arrow")}重新选择</button><div><button class="btn btn-primary" data-plan-action="generate">${icon("project")}生成任务拆解</button></div></div>`;
  }

  function stageIndexFrom(value) {
    const raw = text(value);
    if (!raw) return -1;
    const aliases = { "调研": 0, "立项": 1, "规划": 1, "评审": 2, "决策": 2, "设计": 3, "研发": 4, "开发": 4, "测试": 5, "验收": 5, "上线": 6, "发布": 6, "培训": 7, "运营": 8, "推广": 8, "复盘": 9 };
    const exact = LIFECYCLE_STAGES.findIndex(stage => raw.includes(stage) || stage.includes(raw));
    if (exact >= 0) return exact;
    const key = Object.keys(aliases).find(item => raw.includes(item));
    return key ? aliases[key] : -1;
  }

  function priorityFrom(value) {
    const raw = text(value).toLowerCase();
    if (/p0|p1|高|紧急|重要/.test(raw)) return "high";
    if (/p3|低|不急/.test(raw)) return "low";
    return "medium";
  }

  function statusFrom(value, completed) {
    if (completed) return { status: "done", completed: true };
    const raw = text(value);
    if (/完成|已上线|已验收|关闭/.test(raw)) return { status: "done", completed: true };
    if (/进行|开发中|测试中|评审中|处理中/.test(raw)) return { status: "doing", completed: false };
    return { status: "todo", completed: false };
  }

  // 单条规划事项 → 十阶段任务序列。表格导入与 AI 对话拆解共用同一套规则，保证口径一致。
  function expandEntry(entry, options) {
    const mode = options.mode || "full";
    const scope = options.scope || "all";
    const title = text(entry.title).trim();
    if (!title) return [];
    const project = text(entry.project).trim() || text(options.defaultProject).trim() || "未命名项目";
    const start = entry.startDate || offsetDate(0);
    const dueRaw = text(entry.dueDate);
    const due = dueRaw && dueRaw >= start ? dueRaw : addDays(start, mode === "full" ? 35 : 31);
    const currentStage = stageIndexFrom(entry.stageText);
    const owner = text(entry.owner).trim();
    const priority = entry.priority || priorityFrom(entry.priorityText);
    const initialStatus = entry.initialStatus || statusFrom("", false);
    const sourceNote = text(entry.sourceNote);
    const detail = text(entry.detail);
    let templates = mode === "full" ? FULL_SOP : mode === "light" ? LIGHT_SOP : [];
    if (mode !== "original" && currentStage >= 0 && scope !== "all") {
      templates = templates.filter(template => scope === "forward" ? LIFECYCLE_STAGES.indexOf(template.stage) >= currentStage : LIFECYCLE_STAGES.indexOf(template.stage) === currentStage);
    }
    if (!templates.length) templates = [{ stage: LIFECYCLE_STAGES[currentStage] || "规划立项", title: "", offset: 0, estimate: 2 }];
    const offsetBase = templates[0].offset;
    const offsetSpan = Math.max(1, templates[templates.length - 1].offset - offsetBase);
    const dateSpan = Math.max(0, dayDiff(start, due));
    const generated = [];
    const taskTitle = label => (label ? `${title}｜${label}` : title);
    templates.forEach((template, templateIndex) => {
      const relativeOffset = templateIndex === 0 ? 0 : Math.round((template.offset - offsetBase) / offsetSpan * dateSpan);
      const nextOffset = templateIndex >= templates.length - 1 ? dateSpan : Math.round((templates[templateIndex + 1].offset - offsetBase) / offsetSpan * dateSpan);
      const startDate = addDays(start, relativeOffset);
      let dueDate = addDays(start, Math.max(relativeOffset, nextOffset - 1));
      if (template.key === "launch") dueDate = nextMonday(dueDate);
      if (template.key === "reviewAlign" && generated.length) {
        generated[generated.length - 1].status = "doing";
        generated[generated.length - 1].completed = false;
      }
      const base = {
        id: uid("task"), project, stage: template.stage, owner, priority,
        status: initialStatus.status, completed: initialStatus.completed, estimate: template.estimate
      };
      if (template.key === "retrospective") {
        const launch = generated.find(task => task._templateKey === "launch");
        const launchDate = launch?.dueDate || addDays(start, dateSpan);
        const retroDue = addDays(launchDate, 14);
        generated.push({
          ...base, title: taskTitle(template.title), startDate: addDays(retroDue, -1), dueDate: retroDue,
          tags: ["产品规划", template.stage, "复盘"],
          notes: [sourceNote, "上线两周内固定复盘", detail].filter(Boolean).join("；"), _templateKey: template.key
        });
        return;
      }
      generated.push({
        ...base, title: taskTitle(template.title), startDate, dueDate,
        tags: ["产品规划", template.stage],
        notes: [sourceNote, detail].filter(Boolean).join("；"), _templateKey: template.key
      });
      if (template.key === "reviewAlign" && generated.length >= 2) {
        const review = generated[generated.length - 2];
        generated[generated.length - 1].startDate = addDays(review.dueDate, 1);
        generated[generated.length - 1].dueDate = addDays(review.dueDate, 2);
      }
    });
    return generated.map(task => { delete task._templateKey; return task; });
  }

  function buildDecomposition() {
    if (!planImport.mapping.title) throw new Error("请先指定“规划事项/需求”对应的列");
    const mode = planImport.options.mode;
    const fallbackProject = planImport.options.projectName.trim() || planImport.fileName.replace(/\.[^.]+$/, "") || "未命名项目";
    const tasks = [];
    planImport.rows.forEach((row, rowIndex) => {
      const title = text(row[planImport.mapping.title]).trim();
      if (!title) return;
      const project = text(planImport.mapping.project ? row[planImport.mapping.project] : "").trim() || fallbackProject;
      tasks.push(...expandEntry({
        title,
        project,
        startDate: parseImportedDate(row[planImport.mapping.start]),
        dueDate: parseImportedDate(row[planImport.mapping.due]),
        stageText: text(planImport.mapping.stage ? row[planImport.mapping.stage] : ""),
        owner: text(planImport.mapping.owner ? row[planImport.mapping.owner] : "").trim(),
        priority: priorityFrom(planImport.mapping.priority ? row[planImport.mapping.priority] : ""),
        initialStatus: statusFrom(planImport.mapping.status ? row[planImport.mapping.status] : "", false),
        sourceNote: `来源：${planImport.fileName} 第 ${rowIndex + 2} 行`,
        detail: text(planImport.mapping.description ? row[planImport.mapping.description] : "")
      }, { mode, scope: planImport.options.scope, defaultProject: fallbackProject }));
    });
    if (!tasks.length) throw new Error("没有生成任务，请检查规划事项列是否为空");
    planImport.tasks = tasks;
    planImport.step = "preview";
    renderPlanImport();
  }

  function planPreviewHtml() {
    const projects = [...new Set(planImport.tasks.map(task => task.project))];
    return `${planSteps(2)}<div class="import-summary"><span>将创建 <strong>${planImport.tasks.length}</strong> 项任务</span><span>涉及 <strong>${projects.length}</strong> 个项目</span><span>任务字段可直接修改，保存后进入工作台</span></div><div class="table-preview"><table class="task-preview-table"><thead><tr><th>项目</th><th>任务名称</th><th>阶段</th><th>负责人</th><th>优先级</th><th>开始</th><th>截止</th><th>操作</th></tr></thead><tbody>${planImport.tasks.map((task, index) => `<tr><td><input data-task-index="${index}" data-task-field="project" value="${escapeHtml(task.project)}" aria-label="第 ${index + 1} 项任务项目"></td><td><input class="task-title-input" data-task-index="${index}" data-task-field="title" value="${escapeHtml(task.title)}" aria-label="第 ${index + 1} 项任务名称"></td><td><select data-task-index="${index}" data-task-field="stage" aria-label="第 ${index + 1} 项任务阶段">${LIFECYCLE_STAGES.map(stage => `<option ${selected(task.stage, stage)}>${stage}</option>`).join("")}</select></td><td><input data-task-index="${index}" data-task-field="owner" value="${escapeHtml(task.owner || "")}" aria-label="第 ${index + 1} 项任务负责人"></td><td><select data-task-index="${index}" data-task-field="priority" aria-label="第 ${index + 1} 项任务优先级"><option value="high" ${selected(task.priority, "high")}>高</option><option value="medium" ${selected(task.priority, "medium")}>中</option><option value="low" ${selected(task.priority, "low")}>低</option></select></td><td><input type="date" data-task-index="${index}" data-task-field="startDate" value="${escapeHtml(task.startDate)}" aria-label="第 ${index + 1} 项任务开始日期"></td><td><input type="date" data-task-index="${index}" data-task-field="dueDate" value="${escapeHtml(task.dueDate)}" aria-label="第 ${index + 1} 项任务截止日期"></td><td><button class="icon-btn danger" data-plan-action="remove-task" data-task-index="${index}" aria-label="移除第 ${index + 1} 项任务" title="移除">${icon("trash")}</button></td></tr>`).join("")}</tbody></table></div><div class="import-actions"><div><button class="btn btn-secondary" data-plan-action="back-mapping">${icon("arrow")}返回字段</button><button class="btn btn-secondary" data-plan-action="add-task">${icon("plus")}补一项任务</button></div><div><button class="btn btn-primary" data-plan-action="commit">${icon("check")}保存 ${planImport.tasks.length} 项任务</button></div></div>`;
  }

  function renderPlanImport() {
    if (!planImport) return;
    document.getElementById("planImportSubtitle").textContent = planImport.step === "upload" ? "从表格到可执行任务，入库前每一步都可调整。" : planImport.step === "mapping" ? "确认列名对应关系，并选择符合当前项目阶段的拆解方式。" : "预览拆解结果，调整后再写入工作台。";
    document.getElementById("planImportBody").innerHTML = planImport.step === "upload" ? planUploadHtml() : planImport.step === "mapping" ? planMappingHtml() : planPreviewHtml();
  }

  async function handlePlanningFile(file) {
    if (!file) return;
    try {
      if (!window.SpreadsheetReader) throw new Error("表格解析器未加载，请刷新页面");
      const parsed = await window.SpreadsheetReader.parse(file);
      planImport.fileName = file.name || "粘贴表格";
      planImport.sheetName = parsed.sheetName;
      planImport.headers = parsed.headers;
      planImport.rows = parsed.rows;
      planImport.mapping = autoMapping(parsed.headers);
      planImport.options.projectName = "";
      planImport.step = "mapping";
      renderPlanImport();
      if (!planImport.mapping.title) showToast("已读取表格，请手动指定“规划事项/需求”列", "error");
      else showToast(`已识别 ${parsed.rows.length} 行规划`);
    } catch (error) {
      showToast(`表格读取失败：${error.message || "格式不正确"}`, "error");
      planImport.step = "upload";
      renderPlanImport();
    }
  }

  async function handlePlanPaste() {
    const textarea = document.getElementById("planPasteText");
    const content = textarea?.value.trim();
    if (!content) { showToast("请先粘贴表格内容", "error"); return; }
    try {
      const parsed = window.SpreadsheetReader.parseText(content);
      planImport.fileName = "粘贴表格";
      planImport.sheetName = "粘贴内容";
      planImport.headers = parsed.headers;
      planImport.rows = parsed.rows;
      planImport.mapping = autoMapping(parsed.headers);
      planImport.options.projectName = "";
      planImport.step = "mapping";
      renderPlanImport();
      if (!planImport.mapping.title) showToast("请手动指定“规划事项/需求”列", "error");
    } catch (error) {
      showToast(`粘贴内容解析失败：${error.message}`, "error");
    }
  }

  function downloadPlanningTemplate() {
    const headers = ["项目名称", "规划事项", "业务目标", "当前阶段", "负责人", "优先级", "开始日期", "截止日期", "状态", "描述"];
    const rows = [
      ["会员端 AI 规划助手", "支持自然语言拆解产品任务", "缩短从规划到执行的时间", "规划立项", "朱萍萍", "高", offsetDate(0), addDays(offsetDate(0), 35), "进行中", "示例数据，可删除"],
      ["官网改版", "重构首页信息架构", "提升移动端转化率", "讨论调研", "朱萍萍", "中", addDays(offsetDate(0), 1), addDays(offsetDate(0), 28), "待开始", ""]
    ];
    const csv = `\uFEFF${[headers, ...rows].map(row => row.map(cell => `"${text(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "三院-产品规划导入模板.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("产品规划模板已下载");
  }

  function commitTasks(tasks, sourceName, options = {}) {
    if (!tasks?.length) { showToast("没有可保存的任务", "error"); return false; }
    const invalid = tasks.find(task => !text(task.title).trim() || !text(task.project).trim() || !task.dueDate || task.startDate > task.dueDate);
    if (invalid) { showToast(`请检查“${invalid.title || "未命名任务"}”的项目、名称和日期范围`, "error"); return false; }
    const touched = new Set();
    tasks.forEach(task => {
      let project = state.projects.find(item => item.name === task.project.trim());
      if (!project) {
        project = { id: uid("project"), name: task.project.trim(), goal: "", owner: task.owner || "", status: "active", sourceName: sourceName || "", createdAt: now(), updatedAt: now() };
        state.projects.push(project);
      }
      touched.add(project.id);
      state.work.unshift({
        id: task.id || uid("work"), title: task.title.trim(), project: project.name, projectId: project.id,
        stage: task.stage || "规划立项", owner: task.owner || "", priority: task.priority || "medium",
        status: task.status || "todo", startDate: task.startDate, dueDate: task.dueDate, estimate: number(task.estimate, 2),
        tags: task.tags || ["产品规划", task.stage], notes: task.notes || "", completed: Boolean(task.completed),
        completedAt: task.completed ? now() : "", createdAt: now(), updatedAt: now()
      });
    });
    state.projects.filter(project => touched.has(project.id)).forEach(project => {
      const projectTasks = state.work.filter(task => task.project === project.name);
      project.updatedAt = now();
      project.startDate = projectTasks.map(task => task.startDate).filter(Boolean).sort()[0] || "";
      project.endDate = projectTasks.map(task => task.dueDate).filter(Boolean).sort().at(-1) || "";
    });
    ui.planning = { project: "all", status: "active" };
    saveState(`已拆解并保存 ${tasks.length} 项任务`);
    if (options.stay) render();
    else setView("planning");
    const projectCount = [...new Set(tasks.map(task => task.project))].length;
    if (projectCount) showToast(`已加入 ${projectCount} 个项目，可继续调整甘特图`);
    return true;
  }

  function commitDecomposition() {
    if (!planImport?.tasks.length) { showToast("没有可保存的任务", "error"); return; }
    const tasks = planImport.tasks;
    const sourceName = planImport.fileName;
    document.getElementById("planImportDialog").close();
    planImport = null;
    commitTasks(tasks, sourceName);
  }

  recordForm.addEventListener("submit", event => {
    event.preventDefault();
    const type = recordForm.dataset.type;
    const id = recordForm.dataset.id;
    const config = modules[type];
    const index = state[type].findIndex(item => item.id === id);
    const existing = index >= 0 ? state[type][index] : null;
    const formData = new FormData(recordForm);
    const item = existing ? { ...existing } : { id: uid(type), createdAt: now(), tags: [], notes: "" };
    for (const field of config.fields) {
      if (field.type === "checkbox") item[field.name] = formData.has(field.name);
      else if (field.type === "number") item[field.name] = clamp(formData.get(field.name), field.min ?? 0, field.max ?? Number.MAX_SAFE_INTEGER);
      else if (field.name === "tags") item.tags = normalizeTags(formData.get(field.name));
      else item[field.name] = text(formData.get(field.name)).trim();
    }
    if (type === "work") { if (item.completed) item.status = "done"; else if (item.status === "done") item.status = "todo"; }
    if (type === "learning") { if (item.completed) { item.status = "done"; item.progress = 100; } else if (item.status === "done") item.status = "active"; }
    if (type === "media") { if (item.completed) item.status = "published"; else if (item.status === "published") item.status = "draft"; }
    if (type === "ideas") { if (item.completed) item.status = "converted"; else if (item.status === "converted") item.status = "new"; }
    if (type === "habits") item.checkins = Array.isArray(existing?.checkins) ? [...existing.checkins] : [];
    item.updatedAt = now();
    if (["work", "learning", "media", "ideas"].includes(type)) item.completedAt = item.completed ? (existing?.completedAt || now()) : null;
    if (index >= 0) state[type][index] = item; else state[type].unshift(item);
    saveState(existing ? "记录已更新" : "新记录已添加");
    recordDialog.close();
    render();
  });

  const planDialog = document.getElementById("planImportDialog");
  planDialog.addEventListener("change", event => {
    const input = event.target;
    if (input.id === "planningFileInput" && input.files?.[0]) { handlePlanningFile(input.files[0]); return; }
    if (input.dataset.planMap) {
      planImport.mapping[input.dataset.planMap] = input.value;
      return;
    }
    if (input.dataset.planOption) {
      planImport.options[input.dataset.planOption] = input.value;
      return;
    }
    if (input.dataset.taskIndex !== undefined) {
      const task = planImport.tasks[number(input.dataset.taskIndex)];
      if (task) task[input.dataset.taskField] = input.value;
    }
  });
  planDialog.addEventListener("input", event => {
    const input = event.target;
    if (input.dataset.planOption === "projectName") planImport.options.projectName = input.value;
    if (input.dataset.taskIndex !== undefined && input.dataset.taskField) {
      const task = planImport.tasks[number(input.dataset.taskIndex)];
      if (task) task[input.dataset.taskField] = input.value;
    }
  });
  planDialog.addEventListener("click", event => {
    const button = event.target.closest("[data-plan-action]");
    if (!button) return;
    const action = button.dataset.planAction;
    if (action === "template") downloadPlanningTemplate();
    if (action === "parse-paste") handlePlanPaste();
    if (action === "back-upload") { planImport.step = "upload"; renderPlanImport(); }
    if (action === "back-mapping") { planImport.step = "mapping"; renderPlanImport(); }
    if (action === "generate") {
      try { buildDecomposition(); } catch (error) { showToast(error.message, "error"); }
    }
    if (action === "remove-task") {
      planImport.tasks.splice(number(button.dataset.taskIndex), 1);
      renderPlanImport();
    }
    if (action === "add-task") {
      const existing = planImport.tasks[0];
      planImport.tasks.push({ id: uid("task"), title: "补充任务", project: existing?.project || planImport.options.projectName || planImport.fileName.replace(/\.[^.]+$/, ""), stage: "规划立项", owner: existing?.owner || "", priority: "medium", status: "todo", completed: false, startDate: offsetDate(0), dueDate: offsetDate(1), estimate: 1, tags: ["产品规划"], notes: "手动补充任务" });
      renderPlanImport();
    }
    if (action === "commit") commitDecomposition();
  });
  ["dragenter", "dragover"].forEach(type => planDialog.addEventListener(type, event => {
    if (!event.target.closest("#planFileDrop")) return;
    event.preventDefault();
    event.target.closest("#planFileDrop").classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach(type => planDialog.addEventListener(type, event => {
    if (!event.target.closest("#planFileDrop")) return;
    event.preventDefault();
    event.target.closest("#planFileDrop").classList.remove("dragging");
    if (type === "drop" && event.dataTransfer?.files?.[0]) handlePlanningFile(event.dataTransfer.files[0]);
  }));

  async function enableNotifications() {
    if (!("Notification" in window)) { showToast("此浏览器不支持系统通知，请使用页面内提醒", "error"); return; }
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      state.settings.notifications = permission === "granted";
      saveState();
      render();
      showToast(permission === "granted" ? `已启用，将在每天 ${state.settings.reminderTime} 后提醒` : "未获得通知权限，请检查浏览器设置", permission === "granted" ? "success" : "error");
    } catch (error) {
      showToast("系统通知授权失败，页面内提醒仍可正常使用", "error");
    }
  }

  async function enableT5TNotifications() {
    if (!("Notification" in window)) { showToast("此浏览器不支持系统通知，T5T 仍会正常生成", "error"); return; }
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      state.settings.t5t.notify = permission === "granted";
      saveState();
      render();
      showToast(permission === "granted" ? "T5T 系统通知已启用" : "通知权限未开启，不影响页内日报生成", permission === "granted" ? "success" : "error");
    } catch (error) {
      showToast("通知授权失败，T5T 仍会生成在日报历史中", "error");
    }
  }

  function parseExceptionDates(value) {
    const matches = text(value).match(/\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}/g) || [];
    return [...new Set(matches.map(parseImportedDate).filter(Boolean))];
  }

  function saveT5TSettings(form) {
    const config = state.settings.t5t;
    const time = form.querySelector("#t5tTime").value || "18:30";
    config.time = time;
    config.workdaysOnly = form.querySelector("#t5tMode").value === "workdays";
    config.enabled = form.querySelector("#t5tEnabled").checked;
    config.notify = form.querySelector("#t5tNotify").checked;
    config.holidays = parseExceptionDates(form.querySelector("#t5tHolidays").value);
    config.makeupDays = parseExceptionDates(form.querySelector("#t5tMakeupDays").value);
    const logs = form.querySelector("#t5tDingTalkLogs").value.trim();
    const calendar = form.querySelector("#t5tDingTalkCalendar").value.trim();
    config.dingTalk = { date: logs || calendar ? chinaToday() : "", logs, calendar };
    saveState("定时任务设置已保存");
    render();
  }

  function checkT5TSchedule() {
    const config = state.settings.t5t;
    if (!config.enabled) return;
    const today = chinaToday();
    if (config.workdaysOnly && !isMainlandWorkday(today)) {
      if (config.lastSkippedDate !== today) { config.lastSkippedDate = today; saveState(); }
      return;
    }
    if (config.lastRunDate === today) return;
    if (chinaClock() >= config.time) generateT5TReport("auto");
  }

  function startT5TScheduler() {
    if (t5tTimer) clearInterval(t5tTimer);
    t5tTimer = setInterval(checkT5TSchedule, 30000);
    setTimeout(checkT5TSchedule, 800);
  }

  function toggleRecord(type, id) {    const item = state[type].find(record => record.id === id);
    if (!item) return;
    item.completed = !Boolean(item.completed);
    if (type === "work") item.status = item.completed ? "done" : "todo";
    if (type === "learning") { item.status = item.completed ? "done" : "active"; item.progress = item.completed ? 100 : Math.min(number(item.progress), 99); }
    if (type === "media") item.status = item.completed ? "published" : "draft";
    if (type === "ideas") item.status = item.completed ? "converted" : "new";
    item.completedAt = item.completed ? now() : null;
    item.updatedAt = now();
    saveState(type === "moods" ? (item.completed ? "已标记为复盘" : "已取消复盘标记") : (item.completed ? "已完成，做得很好" : "已恢复为未完成"));
    render();
  }

  function toggleHabit(id, date) {
    const item = state.habits.find(record => record.id === id);
    if (!item) return;
    const exists = item.checkins.includes(date);
    item.checkins = exists ? item.checkins.filter(value => value !== date) : [...item.checkins, date].sort();
    item.updatedAt = now();
    saveState(exists ? "已取消这一天打卡" : "打卡成功，节奏已记录");
    render();
  }

  main.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) { setView(viewButton.dataset.view); return; }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, type, id, date, reportId } = button.dataset;
    if (action === "generate-t5t") generateT5TReport("manual");
    if (action === "toggle-t5t") {
      const config = state.settings.t5t;
      config.enabled = !config.enabled;
      saveState(config.enabled ? "T5T 定时任务已启用" : "T5T 定时任务已暂停");
      render();
      if (config.enabled) checkT5TSchedule();
    }
    if (action === "enable-t5t-notifications") enableT5TNotifications();
    if (action === "view-t5t") openT5TReport(reportId);
    if (action === "export-t5t") downloadReport(state.t5tReports.find(report => report.id === reportId));
    if (action === "delete-t5t") {
      const report = state.t5tReports.find(item => item.id === reportId);
      if (!report) return;
      showConfirm({ title: "删除这份 T5T 日报？", message: `${report.date} 的日报将从本机删除，无法撤销。`, confirmText: "确认删除", onConfirm: () => {
        state.t5tReports = state.t5tReports.filter(item => item.id !== reportId);
        saveState("T5T 日报已删除");
        render();
      } });
    }
    if (action === "new-record") openRecordModal(type);
    if (action === "edit") openRecordModal(type, id);
    if (action === "delete") {
      const item = state[type].find(record => record.id === id);
      if (!item) return;
      showConfirm({ title: `删除这条${modules[type].label}记录？`, message: `“${getTitle(type, item)}”将被永久删除，此操作无法撤销。`, confirmText: "确认删除", onConfirm: () => {
        state[type] = state[type].filter(record => record.id !== id);
        saveState("记录已删除");
        render();
      } });
    }
    if (action === "habit-toggle") toggleHabit(id, date);
    if (action === "clear-filters") { ui.filters[type] = { query: "", status: "all", sort: "updated" }; render(); }
    if (action === "import-plan") openPlanningImport();
    if (action === "download-template") downloadPlanningTemplate();
    if (action === "enable-notifications") enableNotifications();
    if (action === "assistant-settings") openModelDialog();
    if (action === "assistant-clear") clearAssistantHistory();
    if (action === "assistant-upload") document.getElementById("assistantFileInput").click();
    if (action === "assistant-goto") setView("planning");
    if (action === "assistant-example") {
      ui.assistantDraft = button.dataset.text || "";
      render();
      document.getElementById("assistantInput")?.focus();
    }
    if (action === "assistant-commit") commitAssistantMessage(button.dataset.msg);
    if (action === "assistant-mode") setPreviewMode(button.dataset.msg, button.dataset.mode);
  });

  main.addEventListener("change", event => {
    const input = event.target;
    if (input.dataset.action === "toggle") toggleRecord(input.dataset.type, input.dataset.id);
    if (input.id === "statusFilter") { ui.filters[ui.view].status = input.value; render(); }
    if (input.id === "sortFilter") { ui.filters[ui.view].sort = input.value; render(); }
    if (input.id === "projectFilter") { ui.planning.project = input.value; render(); }
    if (input.id === "ganttStatus") { ui.planning.status = input.value; render(); }
    if (input.id === "reminderTime") { state.settings.reminderTime = input.value || "09:00"; saveState(); showToast(`每日提醒时间已设为 ${state.settings.reminderTime}`); }
  });

  main.addEventListener("input", event => {
    if (event.target.id === "assistantInput") { ui.assistantDraft = event.target.value; return; }
    if (event.target.id !== "moduleSearch") return;
    ui.filters[ui.view].query = event.target.value;
    const position = event.target.selectionStart;
    render();
    const search = document.getElementById("moduleSearch");
    search.focus();
    search.setSelectionRange(position, position);
  });

  main.addEventListener("submit", event => {
    if (event.target.id === "assistantForm") {
      event.preventDefault();
      sendAssistantMessage(document.getElementById("assistantInput")?.value || "");
      return;
    }
    if (event.target.id !== "t5tSettingsForm") return;
    event.preventDefault();
    saveT5TSettings(event.target);
  });

  document.getElementById("assistantFileInput").addEventListener("change", event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) handleAssistantFile(file);
  });

  document.getElementById("modelForm").addEventListener("submit", event => {
    event.preventDefault();
    const config = {
      endpoint: document.getElementById("modelEndpoint").value.trim(),
      model: document.getElementById("modelName").value.trim(),
      apiKey: document.getElementById("modelKey").value.trim()
    };
    saveModelConfig(config);
    document.getElementById("modelDialog").close();
    showToast(config.endpoint && config.model ? `已接入模型 ${config.model}` : "模型配置已清除，回到本地规则拆解");
    render();
  });

  document.getElementById("modelTestBtn").addEventListener("click", testModelConnection);

  document.getElementById("modelClearBtn").addEventListener("click", () => {
    saveModelConfig({ endpoint: "", model: "", apiKey: "" });
    document.getElementById("modelDialog").close();
    showToast("模型配置已清除，回到本地规则拆解");
    render();
  });

  async function copyActiveT5TReport() {
    const report = state.t5tReports.find(item => item.id === activeT5tReportId);
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.markdown);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = report.markdown;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showToast("Markdown 已复制");
  }

  document.querySelectorAll(".main-nav [data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  document.getElementById("menuBtn").addEventListener("click", () => document.body.classList.add("nav-open"));
  document.getElementById("sidebarScrim").addEventListener("click", () => document.body.classList.remove("nav-open"));
  document.getElementById("addBtn").addEventListener("click", () => ui.view === "overview" ? document.getElementById("quickDialog").showModal() : ui.view === "planning" ? openPlanningImport() : ui.view === "assistant" ? document.getElementById("assistantFileInput").click() : ui.view === "automation" ? generateT5TReport("manual") : openRecordModal(ui.view));
  document.getElementById("reminderBtn").addEventListener("click", () => {
    setView("planning");
    setTimeout(() => document.getElementById("dailyReminders")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  });

  const quickGrid = document.getElementById("quickGrid");
  quickGrid.innerHTML = TYPES.map(type => `<button class="quick-item" data-type="${type}">${icon(modules[type].icon)}<strong>${modules[type].singular}</strong></button>`).join("");
  quickGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    document.getElementById("quickDialog").close();
    openRecordModal(button.dataset.type);
  });

  document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));
  document.getElementById("confirmCancel").addEventListener("click", () => { confirmCallback = null; confirmDialog.close(); });
  document.getElementById("confirmOk").addEventListener("click", () => {
    const callback = confirmCallback;
    confirmCallback = null;
    confirmDialog.close();
    callback?.();
  });
  document.getElementById("copyT5tBtn").addEventListener("click", copyActiveT5TReport);
  document.getElementById("exportT5tBtn").addEventListener("click", () => downloadReport(state.t5tReports.find(report => report.id === activeT5tReportId)));

  document.getElementById("exportBtn").addEventListener("click", () => {
    const payload = { app: "三院个人工作台", version: 1, exportedAt: now(), data: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sanyuan-workbench-${offsetDate(0)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("JSON 备份已导出");
  });

  document.getElementById("importBtn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("文件超过 5MB，请选择较小的工作台备份");
      const imported = validateState(JSON.parse(await file.text()));
      showConfirm({ title: "导入并替换当前数据？", message: `文件包含 ${TYPES.reduce((sum, type) => sum + imported[type].length, 0)} 条记录。导入会替换此浏览器中的现有数据，建议先导出备份。`, confirmText: "确认导入", onConfirm: () => {
        state = imported;
        saveState("JSON 数据导入成功");
        setView("overview");
      } });
    } catch (error) {
      showToast(`导入失败：${error.message || "文件格式不正确"}`, "error");
    }
  });

  document.getElementById("helpBtn").addEventListener("click", () => document.getElementById("helpDialog").showModal());
  document.getElementById("resetSampleBtn").addEventListener("click", () => {
    document.getElementById("helpDialog").close();
    showConfirm({ title: "恢复示例数据？", message: "当前全部记录将被示例数据替换。如需保留，请先取消并导出 JSON 备份。", confirmText: "确认恢复", onConfirm: () => {
      state = sampleData();
      saveState("已恢复示例数据");
      setView("overview");
    } });
  });

  document.getElementById("todayText").textContent = parseLocalDate(chinaToday()).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  render();
  saveState();
  checkDailyNotification();
  setInterval(checkDailyNotification, 60000);
  startT5TScheduler();
  if (loadWarning) showToast(loadWarning, "error");
})();
