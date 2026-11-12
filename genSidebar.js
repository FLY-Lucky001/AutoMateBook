const fs = require("fs");
const path = require("path");

// 项目根目录（脚本所在目录）
const rootDir = __dirname;

// 要扫描生成侧边栏的目录（docsify 通常是根目录，你可改成 "docs"）
const scanDir = rootDir;

// 自动忽略的目录
const ignoreDirs = ["node_modules", ".git", "assets", "img", "images"];

// 递归收集所有 .md 文件（排除 _ 开头和 README.md 单独处理）
// 返回 [{ file: "相对路径", depth: 层级深度 }]
function collectMd(dir, base = "", depth = 0) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (ignoreDirs.includes(item.name)) continue;               // 跳过忽略目录
    if (item.name.startsWith("_")) continue;                    // 跳过 _sidebar 等
    if (item.isDirectory()) {
      results = results.concat(collectMd(path.join(dir, item.name), path.join(base, item.name), depth + 1));
    } else if (item.name.endsWith(".md") && item.name !== "README.md") {
      const full = path.join(base, item.name).replace(/\\/g, "/");
      results.push({ file: full, depth });
    }
  }
  return results;
}

// 把文件名变成标题（去掉 .md、把 - 变空格，可改成更友好的）
function toTitle(file) {
  const base = path.basename(file, ".md");
  return base.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// 中文数字映射表（可扩展）
const cnNum = { '一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10 };

// 从文件名提取序号（假设文件名以中文数字开头，如“一.md”“二.md”）
function getOrder(file) {
  const base = path.basename(file).replace(/\.md$/, '');
  const match = base.match(/^([一二三四五六七八九十]+)/);
  if (match) return cnNum[match[1]] || 999; // 匹配不到则排后面
  return 999;
}

// 生成 _sidebar.md 内容（按自定义序号排序，再按文件夹层级缩进）
function buildSidebar() {
  const mdFiles = collectMd(scanDir);
  mdFiles.sort((a, b) => getOrder(a.file) - getOrder(b.file)); // 按自定义序号排序

  let lines = ["- [首页](/)", ""];   // 首页固定
  for (const { file, depth } of mdFiles) {
    const indent = "  ".repeat(depth);   // 每层缩进两个空格
    lines.push(`${indent}- [${toTitle(file)}](${file})`);
  }
  return lines.join("\n");
}

// 写入 _sidebar.md
const content = buildSidebar();
fs.writeFileSync(path.join(rootDir, "_sidebar.md"), content, "utf8");
console.log("✅ _sidebar.md 已生成，共包含 " + (content.split("\n").length - 2) + " 个章节");