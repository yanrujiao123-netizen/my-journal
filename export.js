/**
 * docx 导出功能
 * 使用 JSZip 打包 XML 文件生成 .docx
 */

// ============ Export Modal ============

function showExportModal() {
  const modal = document.getElementById('modal-export');
  const now = new Date();

  // Default date range: this month
  const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  document.getElementById('export-date-start').value = startStr;
  document.getElementById('export-date-end').value = endStr;

  // Reset checkboxes
  document.querySelectorAll('#export-options input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
  });

  modal.classList.remove('hidden');
}

function hideExportModal() {
  document.getElementById('modal-export').classList.add('hidden');
}

async function doExport() {
  const exportLogs = document.querySelector('#export-options input[value="log"]').checked;
  const exportExcerpts = document.querySelector('#export-options input[value="excerpt"]').checked;
  const startDate = document.getElementById('export-date-start').value;
  const endDate = document.getElementById('export-date-end').value;

  if (!exportLogs && !exportExcerpts) {
    showToast('请至少选择一种导出类型');
    return;
  }

  if (!startDate || !endDate) {
    showToast('请选择日期范围');
    return;
  }

  if (startDate > endDate) {
    showToast('起始日期不能晚于结束日期');
    return;
  }

  // Check JSZip availability
  if (typeof JSZip === 'undefined') {
    showToast('导出功能需要网络加载组件，请检查网络后重试');
    return;
  }

  try {
    const data = collectExportData(exportLogs, exportExcerpts, startDate, endDate);
    const blob = await generateDocx(data, startDate, endDate);
    downloadBlob(blob, `个人日志_${startDate}_${endDate}.docx`);
    hideExportModal();
    showToast('导出成功 ✓');
  } catch (err) {
    console.error('Export error:', err);
    showToast('导出失败，请重试');
  }
}

function collectExportData(exportLogs, exportExcerpts, startDate, endDate) {
  const data = { logs: [], excerpts: [] };

  if (exportLogs) {
    data.logs = getLogs().filter(l => {
      const d = formatDateStr(new Date(l.createdAt));
      return d >= startDate && d <= endDate;
    });
    data.logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (exportExcerpts) {
    data.excerpts = getExcerpts().filter(e => {
      const d = formatDateStr(new Date(e.createdAt));
      return d >= startDate && d <= endDate;
    });
    data.excerpts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return data;
}

// ============ Docx Generation ============

async function generateDocx(data, startDate, endDate) {
  const zip = new JSZip();

  // [Content_Types].xml
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  // _rels/.rels
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.folder('_rels').file('.rels', rels);

  // word/_rels/document.xml.rels
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
  zip.folder('word').folder('_rels').file('document.xml.rels', docRels);

  // word/document.xml
  const documentXml = buildDocumentXml(data, startDate, endDate);
  zip.folder('word').file('document.xml', documentXml);

  // Generate zip blob
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  return blob;
}

function buildDocumentXml(data, startDate, endDate) {
  let bodyXml = '';

  // Title
  bodyXml += `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:rFonts w:eastAsia="微软雅黑"/>
        </w:rPr>
        <w:t>📔 个人日志导出</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:color w:val="888888"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>${startDate} ~ ${endDate}</w:t>
      </w:r>
    </w:p>`;

  // Logs
  if (data.logs.length > 0) {
    bodyXml += `
    <w:p>
      <w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:rFonts w:eastAsia="微软雅黑"/>
          <w:color w:val="C07060"/>
        </w:rPr>
        <w:t>📝 个人日志</w:t>
      </w:r>
    </w:p>`;

    for (const log of data.logs) {
      const dateLabel = formatDateStr(new Date(log.createdAt)) + ' ' + formatTime(log.createdAt);
      bodyXml += buildEntryBlock(dateLabel, log.content, 'FFE4E1');
    }
  }

  // Excerpts
  if (data.excerpts.length > 0) {
    bodyXml += `
    <w:p>
      <w:pPr><w:spacing w:before="300" w:after="200"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:rFonts w:eastAsia="微软雅黑"/>
          <w:color w:val="A09030"/>
        </w:rPr>
        <w:t>📋 文字摘抄</w:t>
      </w:r>
    </w:p>`;

    for (const ex of data.excerpts) {
      const dateLabel = formatDateStr(new Date(ex.createdAt)) + ' ' + formatTime(ex.createdAt);
      bodyXml += buildEntryBlock(dateLabel, ex.content, 'FFFACD');
    }
  }

  if (data.logs.length === 0 && data.excerpts.length === 0) {
    bodyXml += `
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:color w:val="AAAAAA"/></w:rPr>
        <w:t>该日期范围内没有记录</w:t>
      </w:r>
    </w:p>`;
  }

  const fullXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`;

  return fullXml;
}

function buildEntryBlock(dateLabel, content, bgColor) {
  // Escape XML special chars
  const safeDate = escapeXml(dateLabel);
  const safeContent = escapeXml(content);

  return `
    <w:p>
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
        <w:spacing w:before="100" w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:color w:val="999999"/>
          <w:sz w:val="18"/>
        </w:rPr>
        <w:t>${safeDate}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
        <w:spacing w:after="200"/>
        <w:ind w:left="200"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
          <w:rFonts w:eastAsia="微软雅黑"/>
        </w:rPr>
        <w:t>${safeContent}</w:t>
      </w:r>
    </w:p>`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
