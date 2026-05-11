const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen3.6-plus";

let currentMessages = []; 
let chatHistory = []; 

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const apiKeyInput = document.getElementById('api-key');
const historyList = document.getElementById('history-list');
const loading = document.getElementById('loading');

document.getElementById('send-btn').onclick = async () => {
    const text = userInput.value.trim();
    const key = apiKeyInput.value.trim();
    
    // 修改点：如果用户没输入 API KEY，拦截并提示
    if (!key) {
        alert("请输入 API KEY");
        return; 
    }
    
    if (!text) return;

    if (currentMessages.length === 0) {
        currentMessages.push({ 
            role: "system", 
            content: "你是一个专业的笔记整理助手。将用户输入整理为摘要、知识点和复习题。支持后续微调修改。" 
        });
    }

    currentMessages.push({ role: "user", content: text });
    renderMsg('user', text);
    userInput.value = '';
    userInput.style.height = 'auto'; // 发送后重置高度
    
    loading.classList.remove('hidden');
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${key}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ model: MODEL, messages: currentMessages })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "请求失败");

        const aiText = data.choices[0].message.content;
        currentMessages.push({ role: "assistant", content: aiText });
        renderMsg('ai', aiText);

        if (currentMessages.filter(m => m.role === 'user').length === 1) {
            addToHistoryList(text);
        }
    } catch (err) {
        renderMsg('ai', "❌ 错误: " + err.message);
    } finally {
        loading.classList.add('hidden');
    }
};

function renderMsg(role, content) {
    if (document.querySelector('.welcome-screen')) chatWindow.innerHTML = '';
    const div = document.createElement('div');
    div.className = `msg ${role}-msg`;
    div.innerHTML = `<strong>${role === 'user' ? '📝 笔记/建议' : '🤖 助手'}</strong><br>${content.replace(/\n/g, '<br>')}`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addToHistoryList(firstNote) {
    const chatID = Date.now();
    const chatData = { id: chatID, title: firstNote.substring(0, 15) + '...', msgs: [...currentMessages] };
    chatHistory.push(chatData);

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = `📄 ${chatData.title}`;
    item.onclick = () => {
        const target = chatHistory.find(c => c.id === chatID);
        currentMessages = [...target.msgs];
        chatWindow.innerHTML = '';
        currentMessages.forEach(m => { if(m.role !== 'system') renderMsg(m.role, m.content); });
    };
    historyList.prepend(item);
}

document.getElementById('clear-btn').onclick = () => {
    currentMessages = [];
    userInput.value = '';
    userInput.style.height = 'auto';
    chatWindow.innerHTML = `
        <div class="welcome-screen">
            <h2>📝 学习笔记整理助手</h2>
            <p>输入原始笔记开始整理，或输入指令进行修改</p>
        </div>`;
};

document.getElementById('new-chat-btn').onclick = () => {
    document.getElementById('clear-btn').click();
};

// 自动调整输入框高度
userInput.oninput = function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
};