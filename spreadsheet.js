/* Local spreadsheet reader: no third-party library and no network calls. */
(() => {
  "use strict";

  const decoder = new TextDecoder("utf-8");
  const XML_DECODER = new DOMParser();

  function readU16(view, offset) {
    return view.getUint16(offset, true);
  }

  function readU32(view, offset) {
    return view.getUint32(offset, true);
  }

  function findEndOfCentralDirectory(view) {
    const minimum = Math.max(0, view.byteLength - 65557);
    for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
      if (readU32(view, offset) === 0x06054b50) return offset;
    }
    throw new Error("XLSX 文件结构不完整，未找到 ZIP 目录");
  }

  function parseZip(buffer) {
    const view = new DataView(buffer);
    const eocd = findEndOfCentralDirectory(view);
    const count = readU16(view, eocd + 10);
    let offset = readU32(view, eocd + 16);
    const entries = new Map();
    for (let index = 0; index < count; index += 1) {
      if (readU32(view, offset) !== 0x02014b50) throw new Error("XLSX 的 ZIP 目录项损坏");
      const method = readU16(view, offset + 10);
      const compressedSize = readU32(view, offset + 20);
      const nameLength = readU16(view, offset + 28);
      const extraLength = readU16(view, offset + 30);
      const commentLength = readU16(view, offset + 32);
      const localOffset = readU32(view, offset + 42);
      const name = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));
      entries.set(name, { name, method, compressedSize, localOffset });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return { buffer, view, entries };
  }

  async function unzipEntry(zip, name) {
    const entry = zip.entries.get(name);
    if (!entry) return null;
    if (readU32(zip.view, entry.localOffset) !== 0x04034b50) throw new Error(`XLSX 条目 ${name} 损坏`);
    const nameLength = readU16(zip.view, entry.localOffset + 26);
    const extraLength = readU16(zip.view, entry.localOffset + 28);
    const dataStart = entry.localOffset + 30 + nameLength + extraLength;
    const compressed = new Uint8Array(zip.buffer, dataStart, entry.compressedSize);
    if (entry.method === 0) return decoder.decode(compressed);
    if (entry.method !== 8) throw new Error(`暂不支持 XLSX 压缩方式 ${entry.method}`);
    if (typeof DecompressionStream === "undefined") throw new Error("当前浏览器不支持本地解压 XLSX，请升级浏览器");
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return decoder.decode(await new Response(stream).arrayBuffer());
  }

  function elements(root, name) {
    return Array.from(root.getElementsByTagNameNS("*", name));
  }

  function textContent(element, name) {
    const found = element.getElementsByTagNameNS("*", name);
    return found.length ? found[0].textContent || "" : "";
  }

  function columnIndex(reference) {
    const letters = String(reference || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "A";
    let result = 0;
    for (const char of letters) result = result * 26 + char.charCodeAt(0) - 64;
    return result - 1;
  }

  function normalizeTarget(target) {
    const clean = String(target || "").replace(/\\/g, "/");
    if (clean.startsWith("/")) return clean.slice(1);
    if (clean.startsWith("xl/")) return clean;
    return `xl/${clean.replace(/^\.\//, "")}`;
  }

  function matrixToTable(matrix, sheetName) {
    const cleanRows = matrix.filter(row => Array.isArray(row) && row.some(cell => String(cell ?? "").trim() !== ""));
    if (!cleanRows.length) throw new Error("表格中没有可读取的数据行");
    const rawHeaders = cleanRows[0].map((cell, index) => String(cell ?? "").trim() || `列 ${index + 1}`);
    const seen = new Map();
    const headers = rawHeaders.map(header => {
      if (!seen.has(header)) { seen.set(header, 1); return header; }
      const next = seen.get(header) + 1;
      seen.set(header, next);
      return `${header} (${next})`;
    });
    const rows = cleanRows.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => { item[header] = row[index] ?? ""; });
      return item;
    });
    return { headers, rows, sheetName: sheetName || "工作表 1" };
  }

  async function parseXlsx(file) {
    if (typeof DecompressionStream === "undefined") throw new Error("当前浏览器不支持 XLSX 本地解析，请改用 CSV 或升级浏览器");
    const zip = parseZip(await file.arrayBuffer());
    const workbookXml = await unzipEntry(zip, "xl/workbook.xml");
    if (!workbookXml) throw new Error("不是有效的 XLSX 工作簿");
    const workbook = XML_DECODER.parseFromString(workbookXml, "application/xml");
    const sheets = elements(workbook, "sheet");
    if (!sheets.length) throw new Error("XLSX 中没有工作表");
    let relationships = {};
    const relsXml = await unzipEntry(zip, "xl/_rels/workbook.xml.rels");
    if (relsXml) {
      const rels = XML_DECODER.parseFromString(relsXml, "application/xml");
      elements(rels, "Relationship").forEach(rel => { relationships[rel.getAttribute("Id")] = normalizeTarget(rel.getAttribute("Target")); });
    }
    let sharedStrings = [];
    const sharedXml = await unzipEntry(zip, "xl/sharedStrings.xml");
    if (sharedXml) {
      const shared = XML_DECODER.parseFromString(sharedXml, "application/xml");
      sharedStrings = elements(shared, "si").map(item => elements(item, "t").map(node => node.textContent || "").join(""));
    }
    let lastError = null;
    for (const sheet of sheets) {
      const relationId = sheet.getAttribute("r:id") || sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      let path = relationships[relationId];
      if (!path) {
        const index = sheets.indexOf(sheet) + 1;
        path = `xl/worksheets/sheet${index}.xml`;
      }
      const sheetXml = await unzipEntry(zip, path);
      if (!sheetXml) continue;
      try {
        const document = XML_DECODER.parseFromString(sheetXml, "application/xml");
        const matrix = elements(document, "row").map(row => {
          const values = [];
          elements(row, "c").forEach(cell => {
            const index = columnIndex(cell.getAttribute("r"));
            const type = cell.getAttribute("t");
            let value = "";
            if (type === "inlineStr") {
              const inline = cell.getElementsByTagNameNS("*", "is")[0];
              value = inline ? elements(inline, "t").map(node => node.textContent || "").join("") : textContent(cell, "t");
            } else {
              value = textContent(cell, "v");
              if (type === "s") value = sharedStrings[Number(value)] ?? "";
            }
            values[index] = value;
          });
          return values;
        });
        if (matrix.some(row => row.some(cell => String(cell ?? "").trim()))) return matrixToTable(matrix, sheet.getAttribute("name") || "工作表");
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("XLSX 中没有可读取的数据");
  }

  function parseDelimitedText(content, forcedDelimiter) {
    const input = content.replace(/^\uFEFF/, "");
    const firstLine = input.split(/\r?\n/, 1)[0] || "";
    const delimiter = forcedDelimiter || (firstLine.includes("\t") ? "\t" : firstLine.split(",").length >= firstLine.split(";").length ? "," : ";");
    const rows = [];
    let row = [], value = "", quoted = false;
    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      if (quoted) {
        if (char === '"' && input[index + 1] === '"') { value += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"') quoted = true;
      else if (char === delimiter) { row.push(value); value = ""; }
      else if (char === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
      else if (char !== "\r") value += char;
    }
    if (value !== "" || row.length) { row.push(value); rows.push(row); }
    return matrixToTable(rows, "粘贴表格");
  }

  async function parse(file) {
    if (!file) throw new Error("请选择表格文件");
    const name = String(file.name || "").toLowerCase();
    const extension = name.split(".").pop();
    if (extension === "xls") throw new Error("暂不支持旧版 .xls，请在 Excel 中另存为 .xlsx 或 .csv");
    if (file.size > 10 * 1024 * 1024) throw new Error("文件超过 10MB，建议按项目拆分后再导入");
    if (extension === "xlsx") return parseXlsx(file);
    if (["csv", "tsv", "txt"].includes(extension)) return parseDelimitedText(await file.text(), extension === "tsv" ? "\t" : undefined);
    throw new Error("仅支持 .xlsx、.csv、.tsv 或 .txt 文件");
  }

  window.SpreadsheetReader = { parse, parseText: content => parseDelimitedText(content) };
})();
