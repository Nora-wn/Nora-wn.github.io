const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_ID = "qwen3.6-plus";

let currentMessages = [];
let allHistory = [];

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const apiKeyInput = document.getElementById('api-key');
const loading = document.getElementById('loading');
const errorBanner = document.getElementById('error-banner');
const historyList = document.getElementById('history-list');

// 发送逻辑
document.getElementById('send-btn').onclick = async () => {
    const text = userInput.value.trim();
    const key = apiKeyInput.value.trim();

    // 拦截校验 (要素 2 & 7)
    if (!key) {
        alert("请输入 API KEY");
        return;
    }
    if (!text) return;

    errorBanner.classList.add('hidden');

    // 初始化系统提示词 (产品型应用：要求支持后续建议修改)
    if (currentMessages.length === 0) {
        currentMessages.push({ 
            role: "system", 
            content: "你是一个学习笔记整理专家。请将用户输入的原始笔记整理为：1.核心摘要 2.知识点清单 3.复习自测题。如果用户之后提出修改建议，请基于当前已整理的内容进行调整。" 
        });
    }

    currentMessages.push({ role: "user", content: text });
    renderMsg('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';

    loading.classList.remove('hidden');

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ model: MODEL_ID, messages: currentMessages })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "接口调用失败");

        const aiText = data.choices[0].message.content;
        currentMessages.push({ role: "assistant", content: aiText });
        renderMsg('ai', aiText);

        // 如果是该次任务的第一轮，自动存入历史侧边栏
        if (currentMessages.filter(m => m.role === 'user').length === 1) {
            saveToSidebar(text);
        }
    } catch (err) {
        errorBanner.innerText = "❌ 错误: " + err.message;
        errorBanner.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
};

// 渲染消息
function renderMsg(role, content) {
    if (document.querySelector('.welcome-screen')) chatWindow.innerHTML = '';
    const div = document.createElement('div');
    div.className = `msg ${role}-msg`;
    div.innerHTML = `<strong>${role === 'user' ? '📝 输入' : '🤖 Qwen 整理'}：</strong><br>${content.replace(/\n/g, '<br>')}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 侧边栏历史逻辑
function saveToSidebar(titleText) {
    const chatID = Date.now();
    const chatData = { id: chatID, title: titleText.substring(0, 15) + '...', msgs: [...currentMessages] };
    allHistory.push(chatData);

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = `📄 ${chatData.title}`;
    item.onclick = () => {
        const found = allHistory.find(c => c.id === chatID);
        currentMessages = [...found.msgs];
        chatWindow.innerHTML = '';
        currentMessages.forEach(m => { if(m.role !== 'system') renderMsg(m.role, m.content); });
    };
    historyList.prepend(item);
}

// 要素 8：清空对话/重新开始
document.getElementById('clear-btn').onclick = () => {
    currentMessages = [];
    errorBanner.classList.add('hidden');
    userInput.value = '';
    chatWindow.innerHTML = `
        <div class="welcome-screen">
            <div class="instruction-card">
                <h3>📖 使用指南</h3>
                <ol><li>输入 API KEY...</li><li>发送笔记...</li><li>...</li></ol>
            </div>
        </div>`;
};

document.getElementById('new-chat-btn').onclick = () => {
    document.getElementById('clear-btn').click();
};

// 输入框自动增高
userInput.oninput = function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
};