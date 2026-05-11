const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_ID = "qwen3.6-plus";

let messages = []; // 用于保存对话历史实现多轮对话

const apiKeyInput = document.getElementById('api-key');
const noteInput = document.getElementById('note-input');
const chatDisplay = document.getElementById('chat-display');
const suggestInput = document.getElementById('suggest-input');
const loading = document.getElementById('loading-indicator');
const errorBox = document.getElementById('error-box');

// 统一 API 请求函数
async function fetchAIResponse(payload) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) throw new Error("⚠️ 请先输入 API Key 再进行操作！");

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL_ID,
            messages: payload
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "网络请求失败");
    return data.choices[0].message.content;
}

// 渲染对话到页面
function renderMessage(role, content) {
    if (chatDisplay.querySelector('.placeholder')) chatDisplay.innerHTML = '';
    const div = document.createElement('div');
    div.className = `msg-bubble ${role === 'user' ? 'user-bubble' : 'ai-bubble'}`;
    div.innerHTML = `<strong>${role === 'user' ? '💡 建议' : '🤖 助手'}:</strong><br>${content.replace(/\n/g, '<br>')}`;
    chatDisplay.appendChild(div);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// 核心功能 1：初次整理笔记
document.getElementById('init-btn').onclick = async () => {
    const note = noteInput.value.trim();
    if (!note) return alert("请输入内容后再点击生成！");

    // 初始化对话历史，设置 System Prompt
    messages = [
        { role: "system", content: "你是一个专业的笔记整理助手。请将用户输入的原始笔记整理为：1.核心摘要 2.知识点罗列 3.重点问题。" },
        { role: "user", content: `请整理以下笔记：\n${note}` }
    ];

    chatDisplay.innerHTML = ''; // 清空之前的内容
    executeAI();
};

// 核心功能 2：多轮修改建议
document.getElementById('modify-btn').onclick = async () => {
    const suggestion = suggestInput.value.trim();
    if (!suggestion) return;

    messages.push({ role: "user", content: suggestion });
    renderMessage('user', suggestion);
    suggestInput.value = ''; // 清空输入框
    executeAI();
};

// 执行 AI 调用流程
async function executeAI() {
    loading.classList.remove('hidden');
    errorBox.classList.add('hidden');

    try {
        const aiReply = await fetchAIResponse(messages);
        messages.push({ role: "assistant", content: aiReply });
        renderMessage('assistant', aiReply);
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

// 功能：清空重置
document.getElementById('clear-btn').onclick = () => {
    messages = [];
    chatDisplay.innerHTML = '<p class="placeholder">整理结果将在此处显示...</p>';
    noteInput.value = '';
    errorBox.classList.add('hidden');
};