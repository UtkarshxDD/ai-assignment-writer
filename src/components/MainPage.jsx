import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, Download } from 'lucide-react';

// Constants
const CONSTANTS = {
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 1120,
    MARGIN_BOTTOM: 50
  },
  TEMPLATES: {
    TEMPLATE1: {
      name: 'Lined',
      baseMargin: 90,
      textStartY: 120,
      lineSpacing: 30,
      redLineX: 120
    },
    TEMPLATE2: {
      name: 'Plain',
      baseMargin: 50,
      textStartY: 80
    }
  },
  FONTS: ['Font1', 'Font2', 'Font3', 'Font4', 'Font5', 'Font6', 'Font7', 'Font8', 'Font9', 'Font10'],
  API: {
    KEY: 'AIzaSyB5qhWRtv6nX3WN8LnUicmvQcdsDuMkdWI',
    URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  },
  TEXT_ANALYSIS: {
    VERY_SHORT_THRESHOLD: 50,
    SHORT_THRESHOLD: 100,
    LONG_THRESHOLD: 1000
  }
};

// Utility Functions
const textAnalyzer = {
  getWordCount: (text) => text.trim().split(/\s+/).length,
  getCharCount: (text) => text.length,
  
  getTextWarning: (text) => {
    const wordCount = textAnalyzer.getWordCount(text);
    
    if (wordCount < CONSTANTS.TEXT_ANALYSIS.VERY_SHORT_THRESHOLD) {
      return { 
        type: 'warning', 
        message: `Very short assignment (${wordCount} words). Consider adding more content.` 
      };
    } else if (wordCount < CONSTANTS.TEXT_ANALYSIS.SHORT_THRESHOLD) {
      return { 
        type: 'info', 
        message: `Short assignment (${wordCount} words). This might be suitable for a brief task.` 
      };
    } else if (wordCount > CONSTANTS.TEXT_ANALYSIS.LONG_THRESHOLD) {
      return { 
        type: 'info', 
        message: `Long assignment (${wordCount} words). This will likely span multiple pages.` 
      };
    }
    return null;
  }
};

const canvasRenderer = {
  drawTemplate: (ctx, canvas, template) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (template === 'template1') {
      // Draw horizontal lines
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      for (let y = CONSTANTS.TEMPLATES.TEMPLATE1.textStartY; y < canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM; y += CONSTANTS.TEMPLATES.TEMPLATE1.lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(CONSTANTS.TEMPLATES.TEMPLATE1.baseMargin, y);
        ctx.lineTo(canvas.width - CONSTANTS.TEMPLATES.TEMPLATE1.baseMargin, y);
        ctx.stroke();
      }
      
      // Draw red margin line
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CONSTANTS.TEMPLATES.TEMPLATE1.redLineX, 80);
      ctx.lineTo(CONSTANTS.TEMPLATES.TEMPLATE1.redLineX, canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM);
      ctx.stroke();
    }
  },

  calculateTextBounds: (template, xOffset, yOffset, canvas) => {
    const templateConfig = template === 'template1' ? CONSTANTS.TEMPLATES.TEMPLATE1 : CONSTANTS.TEMPLATES.TEMPLATE2;
    const canvasLeftEdge = 10;
    const canvasRightEdge = canvas.width - 10;
    
    const textStartX = Math.max(
      canvasLeftEdge, 
      Math.min(templateConfig.baseMargin + xOffset, canvasRightEdge - 100)
    );
    const maxWidth = Math.max(100, canvasRightEdge - textStartX);
    const startY = templateConfig.textStartY + yOffset;
    
    return { textStartX, maxWidth, startY };
  }
};

// Text Rendering Hook
const useTextRenderer = () => {
  const renderText = async (ctx, canvas, text, fontName, fontSize, lineHeight, template, xOffset, yOffset, onTextOverflow) => {
    await document.fonts.load(`${fontSize}px "${fontName}"`);
    
    ctx.fillStyle = '#1d4ed8';
    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = 'top';
    
    const { textStartX, maxWidth, startY } = canvasRenderer.calculateTextBounds(template, xOffset, yOffset, canvas);
    let y = startY;
    
    const paragraphs = text.split(/\n\s*\n/);
    let overflowText = '';
    let hasOverflow = false;

    for (let paraIdx = 0; paraIdx < paragraphs.length && !hasOverflow; paraIdx++) {
      const para = paragraphs[paraIdx];
      
      if (y >= canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM) {
        overflowText += paragraphs.slice(paraIdx).join('\n\n');
        hasOverflow = true;
        break;
      }
      
      const lines = para.split('\n');
      
      for (let lineIdx = 0; lineIdx < lines.length && !hasOverflow; lineIdx++) {
        const line = lines[lineIdx];
        
        if (y >= canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM) {
          const remainingLines = lines.slice(lineIdx).join('\n');
          const remainingParas = paragraphs.slice(paraIdx + 1);
          overflowText = [remainingLines, ...remainingParas].filter(Boolean).join('\n\n');
          hasOverflow = true;
          break;
        }
        
        if (!line.trim()) { 
          y += lineHeight; 
          continue; 
        }
        
        const words = line.split(' ');
        let currentLine = '';
        
        for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
          const word = words[wordIdx];
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            if (y >= canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM) {
              const remainingWords = words.slice(wordIdx);
              const remainingLines = lines.slice(lineIdx + 1);
              const remainingParas = paragraphs.slice(paraIdx + 1);
              overflowText = [
                currentLine + ' ' + remainingWords.join(' '),
                ...remainingLines,
                ...remainingParas
              ].filter(Boolean).join('\n');
              hasOverflow = true;
              break;
            }
            
            ctx.fillText(currentLine, textStartX, y);
            y += lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (!hasOverflow && currentLine) {
          if (y < canvas.height - CONSTANTS.CANVAS.MARGIN_BOTTOM) { 
            ctx.fillText(currentLine, textStartX, y); 
            y += lineHeight; 
          } else {
            overflowText = currentLine + '\n' + lines.slice(lineIdx + 1).join('\n') + '\n\n' + paragraphs.slice(paraIdx + 1).join('\n\n');
            hasOverflow = true;
          }
        }
      }
      
      if (!hasOverflow && paraIdx < paragraphs.length - 1) {
        y += lineHeight * 0.5;
      }
    }

    if (onTextOverflow) {
      onTextOverflow(hasOverflow ? overflowText.trim() : '');
    }
  };

  return { renderText };
};

// API Service
const aiService = {
  generateText: async (prompt) => {
    const response = await fetch(
      `${CONSTANTS.API.URL}?key=${CONSTANTS.API.KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      throw new Error('No content was generated. Please try again.');
    }
    
    return generatedContent;
  }
};

// Page Canvas Component
const PageCanvas = ({ text, fontName, fontSize, lineHeight, xOffset, yOffset, template, pageNumber, onTextOverflow }) => {
  const canvasRef = useRef(null);
  const { renderText } = useTextRenderer();

  useEffect(() => {
    const canvasContainer = canvasRef.current;
    if (!canvasContainer) return;
    
    canvasContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CONSTANTS.CANVAS.WIDTH;
    canvas.height = CONSTANTS.CANVAS.HEIGHT;
    canvasContainer.appendChild(canvas);

    const loadAndRender = () => {
      const bgImg = new Image();
      
      bgImg.onload = () => { 
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); 
        renderText(ctx, canvas, text, fontName, fontSize, lineHeight, template, xOffset, yOffset, onTextOverflow);
      };
      
      bgImg.onerror = () => { 
        canvasRenderer.drawTemplate(ctx, canvas, template); 
        renderText(ctx, canvas, text, fontName, fontSize, lineHeight, template, xOffset, yOffset, onTextOverflow);
      };
      
      bgImg.src = `/templates/${template}.jpg`;
      
      // Fallback timeout
      setTimeout(() => { 
        if (!bgImg.complete) { 
          canvasRenderer.drawTemplate(ctx, canvas, template); 
          renderText(ctx, canvas, text, fontName, fontSize, lineHeight, template, xOffset, yOffset, onTextOverflow);
        } 
      }, 300);
    };

    loadAndRender();
    return () => { canvasContainer.innerHTML = ''; };
  }, [text, fontName, fontSize, lineHeight, xOffset, yOffset, template, pageNumber, onTextOverflow, renderText]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">Page {pageNumber}</h4>
      </div>
      <div ref={canvasRef} className="w-full h-auto flex justify-center border rounded-lg bg-gray-50 p-4" />
    </div>
  );
};

// Text Warning Component
const TextWarning = ({ warning }) => {
  if (!warning) return null;
  
  return (
    <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
      warning.type === 'warning' 
        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
        : 'bg-blue-50 text-blue-800 border border-blue-200'
    }`}>
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm">{warning.message}</span>
    </div>
  );
};

// Text Generation Section Component
const TextGenerationSection = ({ prompt, setPrompt, onGenerate, isGenerating }) => (
  <section className="mb-8 bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Generate with AI</h2>
    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter topic (e.g., 'Write an essay about climate change')..."
        className="flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={onGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating...' : 'Generate Text'}
      </button>
    </div>
    {isGenerating && (
      <div className="mt-3 text-sm text-gray-600">
        Please wait while the AI generates your content...
      </div>
    )}
  </section>
);

// Text Display Section Component
const TextDisplaySection = ({ generatedText, setGeneratedText, textWarning }) => (
  <section className="mb-8 bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Generated Text</h2>
    <TextWarning warning={textWarning} />
    <textarea
      value={generatedText}
      onChange={(e) => setGeneratedText(e.target.value)}
      rows={6}
      className="w-full border rounded-lg p-4 resize-none focus:ring-2 focus:ring-indigo-500"
      placeholder="Generated text will appear here..."
    />
  </section>
);

// Preview Section Component
const PreviewSection = ({ pages, getTextForPage, handleTextOverflow, addNewPage, downloadAllPages }) => (
  <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold">Preview ({pages.length} page{pages.length > 1 ? 's' : ''})</h3>
      <div className="flex items-center space-x-2">
        <button
          onClick={addNewPage}
          className="flex items-center space-x-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Page</span>
        </button>
        <button
          onClick={downloadAllPages}
          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          <span>Download All</span>
        </button>
      </div>
    </div>
    
    <div className="space-y-6">
      {pages.map(page => (
        <PageCanvas
          key={page.id}
          text={getTextForPage(page.id)}
          fontName={page.font}
          fontSize={page.fontSize}
          lineHeight={page.lineHeight}
          xOffset={page.xOffset}
          yOffset={page.yOffset}
          template={page.template}
          pageNumber={page.id}
          onTextOverflow={(overflowText) => handleTextOverflow(page.id, overflowText)}
        />
      ))}
    </div>
  </div>
);

// Customization Panel Component
const CustomizationPanel = ({ 
  pages, 
  activePageId, 
  setActivePageId, 
  removePage, 
  updatePageSettings, 
  currentPageSettings,
  generatedText 
}) => (
  <div className="bg-white rounded-lg shadow p-6 space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Customize</h3>
      {pages.length > 1 && (
        <div className="flex items-center space-x-2">
          <label className="text-sm">Page:</label>
          <select
            value={activePageId}
            onChange={(e) => setActivePageId(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {pages.map(page => (
              <option key={page.id} value={page.id}>Page {page.id}</option>
            ))}
          </select>
          {pages.length > 1 && (
            <button
              onClick={() => removePage(activePageId)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Remove Page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Font Style</label>
      <select 
        value={currentPageSettings.font} 
        onChange={(e) => updatePageSettings(activePageId, { font: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
      >
        {CONSTANTS.FONTS.map(font => (
          <option key={font} value={font}>{font}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Paper Template</label>
      <select 
        value={currentPageSettings.template} 
        onChange={(e) => updatePageSettings(activePageId, { template: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="template1">{CONSTANTS.TEMPLATES.TEMPLATE1.name}</option>
        <option value="template2">{CONSTANTS.TEMPLATES.TEMPLATE2.name}</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Font Size: {currentPageSettings.fontSize}px</label>
      <input 
        type="range" 
        min="12" 
        max="32" 
        value={currentPageSettings.fontSize} 
        onChange={(e) => updatePageSettings(activePageId, { fontSize: +e.target.value })}
        className="w-full h-2 bg-gray-200 rounded-lg"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Line Height: {currentPageSettings.lineHeight}px</label>
      <input 
        type="range" 
        min="18" 
        max="50" 
        value={currentPageSettings.lineHeight} 
        onChange={(e) => updatePageSettings(activePageId, { lineHeight: +e.target.value })}
        className="w-full h-2 bg-gray-200 rounded-lg"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Horizontal Offset: {currentPageSettings.xOffset}px</label>
      <input 
        type="range" 
        min="-50" 
        max="150" 
        value={currentPageSettings.xOffset} 
        onChange={(e) => updatePageSettings(activePageId, { xOffset: +e.target.value })}
        className="w-full h-2 bg-gray-200 rounded-lg"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Vertical Offset: {currentPageSettings.yOffset}px</label>
      <input 
        type="range" 
        min="-50" 
        max="200" 
        value={currentPageSettings.yOffset} 
        onChange={(e) => updatePageSettings(activePageId, { yOffset: +e.target.value })}
        ClassName="w-full h-2 bg-gray-200 rounded-lg"
      />
    </div>

    <div className="pt-4 border-t">
      <div className="text-sm text-gray-600 space-y-1">
        <div>Pages: {pages.length}</div>
        <div>Words: {textAnalyzer.getWordCount(generatedText)}</div>
        <div>Characters: {textAnalyzer.getCharCount(generatedText)}</div>
      </div>
    </div>
  </div>
);

// Main Page Component
const MainPage = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('Welcome!');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pages, setPages] = useState([{
    id: 1,
    font: 'Font1',
    template: 'template1',
    fontSize: 16,
    lineHeight: 24,
    xOffset: 0,
    yOffset: 0
  }]);
  const [activePageId, setActivePageId] = useState(1);
  const [overflowTexts, setOverflowTexts] = useState({});

  const handleTextOverflow = (pageId, overflowText) => {
    setOverflowTexts(prev => ({
      ...prev,
      [pageId]: overflowText
    }));

    // Auto-create new page if there's overflow and no next page exists
    if (overflowText && !pages.find(p => p.id === pageId + 1)) {
      const currentPage = pages.find(p => p.id === pageId);
      setPages(prev => [...prev, {
        id: pageId + 1,
        font: currentPage.font,
        template: currentPage.template,
        fontSize: currentPage.fontSize,
        lineHeight: currentPage.lineHeight,
        xOffset: currentPage.xOffset,
        yOffset: currentPage.yOffset
      }]);
    }
  };

  const addNewPage = () => {
    const lastPage = pages[pages.length - 1];
    const newPage = {
      id: lastPage.id + 1,
      font: lastPage.font,
      template: lastPage.template,
      fontSize: lastPage.fontSize,
      lineHeight: lastPage.lineHeight,
      xOffset: lastPage.xOffset,
      yOffset: lastPage.yOffset
    };
    setPages(prev => [...prev, newPage]);
    setActivePageId(newPage.id);
  };

  const removePage = (pageId) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (activePageId === pageId) {
      setActivePageId(pages[0].id);
    }
  };

  const updatePageSettings = (pageId, settings) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...settings } : page
    ));
  };

  const getTextForPage = (pageId) => {
    if (pageId === 1) {
      return generatedText;
    } else {
      return overflowTexts[pageId - 1] || '';
    }
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setGeneratedText('Enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('Generating...');
    
    try {
      const content = await aiService.generateText(prompt);
      setGeneratedText(content);
      
      // Reset to single page when new text is generated
      setPages([pages[0]]);
      setOverflowTexts({});
      setActivePageId(1);
      
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedText(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllPages = () => {
    pages.forEach((page, index) => {
      const canvas = document.querySelectorAll('canvas')[index];
      if (canvas) {
        const link = document.createElement('a');
        link.download = `assignment-page-${page.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    });
  };

  const currentPageSettings = pages.find(p => p.id === activePageId) || pages[0];
  const textWarning = textAnalyzer.getTextWarning(generatedText);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Assignment Generator</h1>
          <p className="text-gray-600 mt-1">AI-powered handwritten assignments with multi-page support</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <TextGenerationSection 
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerateText}
          isGenerating={isGenerating}
        />

        <TextDisplaySection 
          generatedText={generatedText}
          setGeneratedText={setGeneratedText}
          textWarning={textWarning}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PreviewSection 
            pages={pages}
            getTextForPage={getTextForPage}
            handleTextOverflow={handleTextOverflow}
            addNewPage={addNewPage}
            downloadAllPages={downloadAllPages}
          />

          <CustomizationPanel 
            pages={pages}
            activePageId={activePageId}
            setActivePageId={setActivePageId}
            removePage={removePage}
            updatePageSettings={updatePageSettings}
            currentPageSettings={currentPageSettings}
            generatedText={generatedText}
          />
        </div>
      </main>
    </div>
  );
};

export default MainPage;