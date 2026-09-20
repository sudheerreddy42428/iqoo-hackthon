const fs = require('fs');
const path = './src/components/AIBotAssistant.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace state
content = content.replace(
  "const [isExtractingText, setIsExtractingText] = useState(false);",
  "const [attachedImage, setAttachedImage] = useState<string | null>(null);"
);

// Replace handleImageUpload
content = content.replace(
  /const handleImageUpload =[\s\S]*?reader\.readAsDataURL\(file\);\n  };\n/m,
  `const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };\n`
);

// Update sendMessage
content = content.replace(
  /const userMsg: Omit<PersistentChatMessage, 'id' \| 'timestamp'> = {\n      conversationId: currentConversationId,\n      role: 'user',\n      content: userText\n    };/m,
  `const userMsg: Omit<PersistentChatMessage, 'id' | 'timestamp'> = {
      conversationId: currentConversationId,
      role: 'user',
      content: userText,
      imageUrl: attachedImage || undefined
    };
    
    // Clear attached image after sending
    setAttachedImage(null);`
);

// Update history map to include imageUrl
content = content.replace(
  /const history = conversationStore.getMessages\(currentConversationId\)\.map\(m => \(\{\n        role: m\.role,\n        content: m\.content\n      \}\)\);/m,
  `const history = conversationStore.getMessages(currentConversationId).map(m => ({
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl
      }));`
);

// Render image in chat bubbles
content = content.replace(
  /<p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{msg\.content}<\/p>/m,
  `{msg.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-cyan-800/50">
                          <img src={msg.imageUrl} alt="Uploaded screenshot" className="max-w-full h-auto" />
                        </div>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>`
);

// Add attached image preview above the input box
content = content.replace(
  /<div className="p-3 bg-dark-950 border-t border-purple-500\/20 shrink-0">/m,
  `<div className="p-3 bg-dark-950 border-t border-purple-500/20 shrink-0">
            {attachedImage && (
              <div className="mb-3 relative inline-block">
                <div className="relative rounded-lg overflow-hidden border border-slate-700 w-24 h-24">
                  <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}`
);

// Fix disabled states
content = content.replace(/isExtractingText/g, "false");

fs.writeFileSync(path, content);
console.log('updated AIBotAssistant.tsx');
