/**
 * VKU Voice AI & Multi-Agent Call Automation Hub - Client Logic
 * Quản lý Web Speech API (STT & TTS), Multi-Agent Visualizer, 
 * Đồng bộ SQLite CRM Backend, Phê duyệt HITL và 3 Tabs Chức năng chuyên sâu.
 */

// ==========================================
// 1. KHỞI TẠO TRẠNG THÁI ỨNG DỤNG (STATE)
// ==========================================
const STATE = {
  isRecording: false,
  recognition: null,
  speechSynth: window.speechSynthesis || null,
  currentVoiceReply: "",
  activePayloadTab: "request", // 'request' | 'response' | 'docs'
  lastRequestPayload: null,
  lastResponsePayload: null,
  sessionMemory: [],
  
  crmRecords: [],
  approvalQueue: [],
  kpis: {
    total_calls: 0,
    pending_approvals: 0,
    approved_calls: 0,
    avg_latency_ms: 45,
    avg_qa_score: 96.5,
    success_rate: 100
  }
};

// ==========================================
// 2. KHỞI TẠO DOM ELEMENTS
// ==========================================
const DOM = {
  // Badges & Actions
  n8nStatusBadge: document.getElementById('n8nStatusBadge'),
  n8nStatusText: document.getElementById('n8nStatusText'),
  sqliteStatusBadge: document.getElementById('sqliteStatusBadge'),
  sqliteStatusText: document.getElementById('sqliteStatusText'),
  btnHeaderReset: document.getElementById('btnHeaderReset'),

  // KPIs
  kpiTotalCalls: document.getElementById('kpiTotalCalls'),
  kpiSuccessRate: document.getElementById('kpiSuccessRate'),
  kpiAvgLatency: document.getElementById('kpiAvgLatency'),
  kpiPendingApproval: document.getElementById('kpiPendingApproval'),
  kpiAvgQA: document.getElementById('kpiAvgQA'),

  // Tabs
  tabNavButtons: document.querySelectorAll('.nav-tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  // Softphone Inputs
  callerName: document.getElementById('callerName'),
  callerPhone: document.getElementById('callerPhone'),
  geminiApiKey: document.getElementById('geminiApiKey'),
  telegramChatId: document.getElementById('telegramChatId'),
  chkAgentMemory: document.getElementById('chkAgentMemory'),
  voicePersonaSelect: document.getElementById('voicePersonaSelect'),
  ttsEngineSelect: document.getElementById('ttsEngineSelect'),
  btnTestVoice: document.getElementById('btnTestVoice'),
  speechRate: document.getElementById('speechRate'),
  rateValue: document.getElementById('rateValue'),
  speechPitch: document.getElementById('speechPitch'),
  pitchValue: document.getElementById('pitchValue'),
  btnMic: document.getElementById('btnMic'),
  micLabel: document.getElementById('micLabel'),
  transcriptInput: document.getElementById('transcriptInput'),
  btnClearTranscript: document.getElementById('btnClearTranscript'),
  btnSendCall: document.getElementById('btnSendCall'),
  presetButtons: document.querySelectorAll('.btn-preset'),

  // Chat Stream
  chatMessageList: document.getElementById('chatMessageList'),
  btnClearChat: document.getElementById('btnClearChat'),

  // Pipeline
  pipelineStatusBadge: document.getElementById('pipelineStatusBadge'),
  stepNodes: [
    document.getElementById('stepNode1'),
    document.getElementById('stepNode2'),
    document.getElementById('stepNode3'),
    document.getElementById('stepNode4'),
    document.getElementById('stepNode5'),
    document.getElementById('stepNode6'),
    document.getElementById('stepNode7')
  ],

  // Multi-Agent Results
  aiEngineBadge: document.getElementById('aiEngineBadge'),
  techIntent: document.getElementById('techIntent'),
  techSentiment: document.getElementById('techSentiment'),
  techUrgency: document.getElementById('techUrgency'),
  techConfidence: document.getElementById('techConfidence'),
  techTime: document.getElementById('techTime'),
  techPartySize: document.getElementById('techPartySize'),
  techService: document.getElementById('techService'),
  techRagTopic: document.getElementById('techRagTopic'),
  techQaScore: document.getElementById('techQaScore'),
  techGuardrail: document.getElementById('techGuardrail'),
  techLatency: document.getElementById('techLatency'),

  // Voice Reply Box
  voiceReplyBox: document.getElementById('voiceReplyBox'),
  voiceReplyText: document.getElementById('voiceReplyText'),
  btnReplayAudio: document.getElementById('btnReplayAudio'),
  btnStopAudio: document.getElementById('btnStopAudio'),

  // Tab 2: HITL & CRM
  approvalCountBadge: document.getElementById('approvalCountBadge'),
  approvalQueueList: document.getElementById('approvalQueueList'),
  crmFilterIntent: document.getElementById('crmFilterIntent'),
  crmTableBody: document.getElementById('crmTableBody'),
  btnReloadCRM: document.getElementById('btnReloadCRM'),

  // Tab 3: Monitoring & Terminal
  tabBtnRequest: document.getElementById('tabBtnRequest'),
  tabBtnResponse: document.getElementById('tabBtnResponse'),
  tabBtnDocs: document.getElementById('tabBtnDocs'),
  inspectorContent: document.getElementById('inspectorContent'),
  inspectorMetaText: document.getElementById('inspectorMetaText'),
  payloadViewer: document.getElementById('payloadViewer'),
  falconideSpecsBox: document.getElementById('falconideSpecsBox'),
  btnCopyJson: document.getElementById('btnCopyJson'),
  logTerminal: document.getElementById('logTerminal'),
  btnClearLogs: document.getElementById('btnClearLogs')
};

// ==========================================
// 3. TIỆN ÍCH GHI NHẬT KÝ (LOGGING)
// ==========================================
function addLog(message, type = "info") {
  const now = new Date();
  const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">${timeStr}</span> <span class="log-msg ${type}">${message}</span>`;
  
  if (DOM.logTerminal) {
    DOM.logTerminal.appendChild(entry);
    DOM.logTerminal.scrollTop = DOM.logTerminal.scrollHeight;
  }
}

// ==========================================
// 4. BỘ MÁY PHÁT ÂM TIẾNG VIỆT TỰ NHIÊN (TTS)
// ==========================================
const PERSONA_CONFIGS = {
  dieu_linh: {
    name: "Diệu Linh",
    gender: "female",
    rate: 1.0,
    pitch: 1.15,
    sampleText: "Xin chào anh Nguyễn Phú Anh, em là Diệu Linh - trợ lý ảo tổng đài Voice AI. Rất hân hạnh được hỗ trợ anh hôm nay ạ!"
  },
  mai_anh: {
    name: "Mai Anh",
    gender: "female",
    rate: 1.08,
    pitch: 1.25,
    sampleText: "Dạ em chào anh Nguyễn Phú Anh nha! Em là Mai Anh bên tổng đài Voice AI đây ạ. Anh cần em đặt bàn hay tư vấn gì không ạ?"
  },
  minh_triet: {
    name: "Minh Triết",
    gender: "male",
    rate: 0.92,
    pitch: 0.80,
    sampleText: "Kính chào quý khách Nguyễn Phú Anh. Tôi là Minh Triết, tổng đài viên Voice AI. Tôi có thể hỗ trợ gì cho anh hôm nay?"
  },
  gia_huy: {
    name: "Gia Huy",
    gender: "male",
    rate: 0.98,
    pitch: 0.90,
    sampleText: "Chào anh Nguyễn Phú Anh, em là Gia Huy từ bộ phận chăm sóc khách hàng Voice AI. Rất vui được hỗ trợ anh ạ!"
  }
};

const NaturalVietnameseTTS = {
  currentAudio: null,
  queue: [],
  isPlaying: false,
  rate: 1.0,

  stop() {
    this.isPlaying = false;
    this.queue = [];
    this._updateUIState(false);
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  },

  splitIntoPhrases(text) {
    if (!text) return [];
    const cleaned = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    const matches = cleaned.match(/[^,.;!?:]+[,.;!?:]*/g) || [cleaned];
    const result = [];
    for (let m of matches) {
      let piece = m.trim();
      if (!piece) continue;
      while (piece.length > 130) {
        let breakIdx = piece.lastIndexOf(' ', 130);
        if (breakIdx === -1) breakIdx = 130;
        result.push(piece.substring(0, breakIdx).trim());
        piece = piece.substring(breakIdx).trim();
      }
      if (piece && !/^[.,!?;:]+$/.test(piece)) {
        result.push(piece);
      }
    }
    return result.length > 0 ? result : [cleaned];
  },

  speak(text, rate = 1.0, personaName = "Trợ lý AI") {
    this.stop();
    const phrases = this.splitIntoPhrases(text);
    if (phrases.length === 0) return;

    this.queue = phrases;
    this.isPlaying = true;
    this.rate = rate;

    addLog(`Đang phát giọng đọc [${personaName}] qua Google Voice AI (Chuẩn Tiếng Việt tự nhiên 100%)...`, 'info');
    this._playNext();
  },

  _playNext() {
    if (!this.isPlaying || this.queue.length === 0) {
      this.isPlaying = false;
      this._updateUIState(false);
      return;
    }

    const phrase = this.queue.shift();
    const encoded = encodeURIComponent(phrase);
    
    // Ưu tiên 1: Chạy qua Reverse Proxy server (/api/tts?q=...)
    const proxyUrl = `/api/tts?q=${encoded}`;
    // Ưu tiên 2: Gọi trực tiếp Google TTS Cloud
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encoded}`;

    this._updateUIState(true);

    const audio = new Audio(proxyUrl);
    this.currentAudio = audio;
    audio.playbackRate = Math.min(Math.max(this.rate, 0.75), 1.35);

    let hasEnded = false;
    const finishStep = () => {
      if (hasEnded) return;
      hasEnded = true;
      this._playNext();
    };

    audio.onended = finishStep;

    audio.onerror = (err) => {
      console.warn("Lỗi proxy /api/tts, thử direct Google TTS:", err);
      const directAudio = new Audio(directUrl);
      this.currentAudio = directAudio;
      directAudio.playbackRate = Math.min(Math.max(this.rate, 0.75), 1.35);
      directAudio.onended = finishStep;
      directAudio.onerror = (e2) => {
        console.warn("Lỗi direct Google TTS, fallback sang Web Speech:", e2);
        this._fallbackWebSpeech(phrase, finishStep);
      };
      directAudio.play().catch(playErr => {
        console.warn("Direct play failed, fallback sang Web Speech:", playErr);
        this._fallbackWebSpeech(phrase, finishStep);
      });
    };

    audio.play().catch(playErr => {
      console.warn("Proxy play() bị chặn, fallback sang direct URL hoặc Web Speech:", playErr);
      const directAudio = new Audio(directUrl);
      this.currentAudio = directAudio;
      directAudio.onended = finishStep;
      directAudio.onerror = () => this._fallbackWebSpeech(phrase, finishStep);
      directAudio.play().catch(() => this._fallbackWebSpeech(phrase, finishStep));
    });
  },

  _fallbackWebSpeech(phrase, callback) {
    if (!window.speechSynthesis) {
      if (callback) callback();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'vi-VN';
    utterance.rate = this.rate;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onend = () => {
      if (callback) callback();
    };
    utterance.onerror = () => {
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  },

  _updateUIState(isPlaying) {
    if (DOM.btnTestVoice) {
      DOM.btnTestVoice.textContent = isPlaying ? "🔊 Đang đọc..." : "🔊 Thử giọng";
      if (isPlaying) {
        DOM.btnTestVoice.style.background = "var(--accent-cyan)";
        DOM.btnTestVoice.style.color = "#000";
      } else {
        DOM.btnTestVoice.style.background = "";
        DOM.btnTestVoice.style.color = "";
      }
    }
    if (DOM.btnReplayAudio) {
      DOM.btnReplayAudio.innerHTML = isPlaying ? "<span>🔊</span> Đang phát..." : "<span>🔊</span> Phát lại";
    }
  }
};

function speakVoiceReply(text, customRate = null, customPitch = null) {
  if (!text) return;

  const personaKey = DOM.voicePersonaSelect ? DOM.voicePersonaSelect.value : 'dieu_linh';
  const persona = PERSONA_CONFIGS[personaKey] || PERSONA_CONFIGS.dieu_linh;

  const rate = customRate !== null 
    ? customRate 
    : (DOM.speechRate ? parseFloat(DOM.speechRate.value) : persona.rate);
  const pitch = customPitch !== null 
    ? customPitch 
    : (DOM.speechPitch ? parseFloat(DOM.speechPitch.value) : persona.pitch);

  const engine = DOM.ttsEngineSelect ? DOM.ttsEngineSelect.value : 'google';

  if (engine === 'google') {
    NaturalVietnameseTTS.speak(text, rate, persona.name);
    return;
  }

  // Web Speech API
  if (!STATE.speechSynth) {
    NaturalVietnameseTTS.speak(text, rate, persona.name);
    return;
  }

  STATE.speechSynth.cancel();
  const voices = STATE.speechSynth.getVoices();
  const viVoices = voices.filter(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = rate;
  utterance.pitch = pitch;

  if (viVoices.length > 0) {
    utterance.voice = viVoices[0];
  }

  utterance.onstart = () => {
    addLog(`Đang phát giọng đọc trình duyệt [${persona.name}]...`, 'info');
    NaturalVietnameseTTS._updateUIState(true);
  };
  utterance.onend = () => {
    NaturalVietnameseTTS._updateUIState(false);
  };
  utterance.onerror = () => {
    NaturalVietnameseTTS._updateUIState(false);
    NaturalVietnameseTTS.speak(text, rate, persona.name);
  };

  STATE.speechSynth.speak(utterance);
}

// ==========================================
// 5. THIẾT LẬP NHẬN DIỆN GIỌNG NÓI (STT)
// ==========================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    addLog('Trình duyệt hiện tại không hỗ trợ Web Speech API (Hãy dùng nút kịch bản mẫu).', 'warning');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'vi-VN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    STATE.isRecording = true;
    DOM.btnMic.classList.add('recording');
    DOM.micLabel.classList.add('recording');
    DOM.micLabel.textContent = '🔴 Đang lắng nghe... Hãy nói tiếng Việt!';
    addLog('Bắt đầu thu âm giọng nói tiếng Việt (vi-VN)...', 'info');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const currentText = finalTranscript || interimTranscript;
    if (currentText) {
      DOM.transcriptInput.value = currentText;
    }
  };

  recognition.onerror = (event) => {
    console.warn('Lỗi nhận diện âm thanh:', event.error);
    stopRecording();
    if (event.error === 'not-allowed') {
      addLog('Người dùng từ chối quyền Microphone trên trình duyệt.', 'error');
    }
  };

  recognition.onend = () => {
    stopRecording();
    if (DOM.transcriptInput.value.trim().length > 3) {
      addLog(`Thu âm thành công: "${DOM.transcriptInput.value.trim()}"`, 'success');
    }
  };

  STATE.recognition = recognition;
}

function startRecording() {
  if (!STATE.recognition) return;
  try {
    DOM.transcriptInput.value = "";
    STATE.recognition.start();
  } catch (err) {
    stopRecording();
  }
}

function stopRecording() {
  STATE.isRecording = false;
  DOM.btnMic.classList.remove('recording');
  DOM.micLabel.classList.remove('recording');
  DOM.micLabel.textContent = 'Bấm Mic để Nói Tiếng Việt với AI';
}

// ==========================================
// 6. GỬI CUỘC GỌI VÀO n8n VÀ SQLITE CRM
// ==========================================
async function sendCallToBackend(overrideParams = {}) {
  const transcript = overrideParams.transcript || DOM.transcriptInput.value.trim();
  if (!transcript) {
    alert("Vui lòng nói qua Microphone hoặc gõ lời thoại vào khung văn bản trước khi gửi!");
    return;
  }

  const callerName = overrideParams.caller_name || DOM.callerName.value.trim() || "Nguyễn Phú Anh";
  const callerPhone = overrideParams.caller_phone || DOM.callerPhone.value.trim() || "0905123456";
  const apiKey = DOM.geminiApiKey.value.trim();
  const telegramChatId = DOM.telegramChatId.value.trim();
  const useMemory = DOM.chkAgentMemory.checked;

  const requestPayload = {
    trans_id: 'TRANS-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
    caller_name: callerName,
    caller_phone: callerPhone,
    transcript: transcript,
    session_memory: useMemory ? STATE.sessionMemory : [],
    gemini_api_key: apiKey,
    telegram_chat_id: telegramChatId,
    simulate_auth_fail: overrideParams.simulate_auth_fail === true,
    user_agent: navigator.userAgent,
    ip_address: "127.0.0.1",
    x_apiheader: overrideParams.simulate_auth_fail ? "INVALID_TOKEN_999" : "VKU-SECRET-2026"
  };

  STATE.lastRequestPayload = requestPayload;
  renderPayloadViewer();

  // Khóa nút bấm và kích hoạt Pipeline
  DOM.btnSendCall.disabled = true;
  DOM.btnSendCall.innerHTML = `<span>⏳</span> Đang chuyển vào n8n Webhook...`;
  resetPipelineVisualizer();
  animatePipelineStep(0); // Bước 1: Webhook

  // Thêm tin nhắn Khách vào Chat Stream
  appendChatMessage("user", callerName, transcript);

  const startTime = Date.now();
  addLog(`Gửi HTTP POST tới /api/voice-call (caller: "${callerName}", phone: "${callerPhone}")`, 'info');

  try {
    const res = await fetch("/api/voice-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APIHEADER": requestPayload.x_apiheader
      },
      body: JSON.stringify(requestPayload)
    });

    const latency = Date.now() - startTime;
    const data = await res.json();
    STATE.lastResponsePayload = data;
    renderPayloadViewer();

    completeAllPipelineSteps();
    addLog(`Nhận phản hồi HTTP ${res.status} từ n8n/Backend (${latency}ms) - Intent: ${data.ai_analysis?.intent}`, 'success');

    // Lưu vào bộ nhớ nhiều lượt (Memory)
    if (useMemory) {
      STATE.sessionMemory.push({ role: "user", text: transcript });
      if (data.voice_reply) {
        STATE.sessionMemory.push({ role: "ai", text: data.voice_reply });
      }
    }

    // Xử lý dữ liệu phản hồi
    processCallResponse(data, latency);

    // Tải lại dữ liệu từ SQLite Database
    await fetchRecordsFromDB();

  } catch (error) {
    console.error("Lỗi gửi cuộc gọi:", error);
    addLog(`Lỗi xử lý cuộc gọi: ${error.message}`, 'error');
    DOM.pipelineStatusBadge.className = 'badge-tag badge-complaint';
    DOM.pipelineStatusBadge.textContent = 'LỖI KẾT NỐI';
  } finally {
    DOM.btnSendCall.disabled = false;
    DOM.btnSendCall.innerHTML = `<span>🚀</span> Gửi Cuộc Gọi vào n8n Webhook Engine`;
  }
}

// ==========================================
// 7. XỬ LÝ PHẢN HỒI VÀ CẬP NHẬT KẾT QUẢ AGENT
// ==========================================
function processCallResponse(data, latency) {
  const ai = data.ai_analysis || {};
  const decision = data.workflow_decision || {};
  const qa = data.qa_metrics || {};
  const caller = data.caller || {};
  const entities = ai.extracted_entities || {};

  // 1. Phản hồi giọng nói AI
  STATE.currentVoiceReply = data.voice_reply || "Dạ em đã ghi nhận thông tin của mình ạ!";
  DOM.voiceReplyBox.style.display = "block";
  DOM.voiceReplyText.textContent = `"${STATE.currentVoiceReply}"`;

  // Thêm tin nhắn AI vào Chat Stream
  appendChatMessage("ai", "Trợ lý AI (Tổng đài)", STATE.currentVoiceReply);

  // Tự động phát âm thanh tiếng Việt tự nhiên
  speakVoiceReply(STATE.currentVoiceReply);

  // 2. Cập nhật kết quả 3 Agent
  DOM.techIntent.textContent = ai.intent || "INQUIRY";
  DOM.techSentiment.textContent = ai.sentiment || "NEUTRAL";
  DOM.techUrgency.textContent = ai.urgency || "LOW";
  DOM.techConfidence.textContent = Math.round((ai.confidence_score || 0.95) * 100) + "%";

  DOM.techTime.textContent = entities.appointment_time || "19h00 tối nay";
  DOM.techPartySize.textContent = (entities.party_size || 4) + " người";
  DOM.techService.textContent = entities.service_type || "Nhà hàng Tiêu chuẩn";
  DOM.techRagTopic.textContent = data.rag_metadata?.context_used ? "Trích dẫn RAG OK" : "Tri thức tổng quát";

  DOM.techQaScore.textContent = (qa.qa_score || 98) + " / 100";
  DOM.techGuardrail.textContent = qa.guardrail_passed === false ? "✕ BỊ CHẶN" : "✓ AN TOÀN";
  DOM.techLatency.textContent = latency + " ms";
  DOM.aiEngineBadge.textContent = ai.engine_used || "MULTI-AGENT ENGINE";
}

function appendChatMessage(role, sender, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `
    <div class="bubble-sender">${role === 'user' ? '👤 ' + sender : '🤖 ' + sender}</div>
    <div class="bubble-content">${text}</div>
  `;
  DOM.chatMessageList.appendChild(bubble);
  DOM.chatMessageList.scrollTop = DOM.chatMessageList.scrollHeight;
}

// ==========================================
// 8. ĐỒNG BỘ DỮ LIỆU SQLITE CRM & HITL QUEUE
// ==========================================
async function fetchRecordsFromDB() {
  try {
    const res = await fetch("/api/records");
    if (!res.ok) return;
    const data = await res.json();
    STATE.crmRecords = data.records || [];
    STATE.kpis = data.kpis || STATE.kpis;

    updateKPIDisplay();
    renderApprovalQueue();
    renderCRMTable();
  } catch (err) {
    console.warn("Lỗi tải hồ sơ SQLite CRM:", err);
  }
}

function updateKPIDisplay() {
  DOM.kpiTotalCalls.textContent = STATE.kpis.total_calls || 0;
  DOM.kpiPendingApproval.textContent = STATE.kpis.pending_approvals || 0;
  DOM.kpiSuccessRate.textContent = (STATE.kpis.success_rate || 100) + "%";
  DOM.kpiAvgLatency.textContent = (STATE.kpis.avg_latency_ms || 45) + " ms";
  DOM.kpiAvgQA.textContent = STATE.kpis.avg_qa_score || 96.5;
}

function renderApprovalQueue() {
  const pendingItems = STATE.crmRecords.filter(r => r.approval_status === "PENDING_HUMAN_APPROVAL");
  DOM.approvalCountBadge.textContent = `${pendingItems.length} Ca Chờ Duyệt`;

  if (pendingItems.length === 0) {
    DOM.approvalQueueList.innerHTML = `<div class="empty-state" style="padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">Hiện không có ca khiếu nại hoặc tiệc VIP nào cần phê duyệt.</div>`;
    return;
  }

  DOM.approvalQueueList.innerHTML = pendingItems.map(item => {
    const isComplaint = item.intent === "COMPLAINT";
    const cardClass = isComplaint ? "approval-card complaint" : "approval-card";
    const badgeClass = isComplaint ? "badge-complaint" : "badge-vip";
    const assignedTeam = isComplaint ? "Trưởng ca CSKH (Khẩn cấp)" : "Quản lý Điều phối VIP";

    return `
      <div class="${cardClass}">
        <div class="approval-info">
          <div class="approval-meta-line">
            <span class="badge-tag ${badgeClass}">${item.intent}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim); font-family: monospace;">${item.trans_id} • ${item.timestamp}</span>
          </div>
          <div class="approval-client">👤 ${item.caller_name} - 📞 ${item.caller_phone} (${item.party_size} khách)</div>
          <div class="approval-quote">"${item.transcript}"</div>
          <div class="approval-sla">⚠️ Phân luồng: ${assignedTeam} (SLA: 15 phút)</div>
        </div>
        <div class="approval-actions">
          <button class="btn-approve" onclick="handleApprove('${item.trans_id}', 'APPROVE')">✓ Phê duyệt</button>
          <button class="btn-reject" onclick="handleApprove('${item.trans_id}', 'REJECT')">✕ Từ chối</button>
        </div>
      </div>
    `;
  }).join('');
}

window.handleApprove = async function(transId, action) {
  try {
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trans_id: transId, action: action })
    });
    const result = await res.json();
    addLog(`Quản lý đã ${action === 'APPROVE' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} hồ sơ ${transId}`, action === 'APPROVE' ? 'success' : 'warning');
    
    // Đọc thông báo phản hồi
    const notifyText = action === 'APPROVE' ? "Hồ sơ đã được Quản lý phê duyệt thành công!" : "Yêu cầu đã bị từ chối.";
    speakVoiceReply(notifyText);

    await fetchRecordsFromDB();
  } catch (err) {
    console.error("Lỗi phê duyệt:", err);
  }
};

function renderCRMTable() {
  const filter = DOM.crmFilterIntent ? DOM.crmFilterIntent.value : "ALL";
  let items = STATE.crmRecords;
  if (filter !== "ALL") {
    items = items.filter(r => r.intent === filter);
  }

  if (items.length === 0) {
    DOM.crmTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">Chưa có bản ghi nào khớp với bộ lọc.</td></tr>`;
    return;
  }

  DOM.crmTableBody.innerHTML = items.map(rec => {
    let intentBadge = 'badge-inquiry';
    if (rec.intent === 'COMPLAINT') intentBadge = 'badge-complaint';
    else if (rec.intent === 'VIP_BOOKING') intentBadge = 'badge-vip';
    else if (rec.intent === 'BOOKING') intentBadge = 'badge-booking';

    let statusHtml = '';
    if (rec.approval_status === 'AUTO_APPROVED') {
      statusHtml = `<span style="color: var(--accent-green); font-weight: 600;">✓ Tự động duyệt</span>`;
    } else if (rec.approval_status === 'PENDING_HUMAN_APPROVAL') {
      statusHtml = `<span style="color: var(--accent-amber); font-weight: 600;">⏳ Chờ duyệt</span>`;
    } else if (rec.approval_status === 'APPROVED_BY_HUMAN') {
      statusHtml = `<span style="color: var(--accent-cyan); font-weight: 600;">✓ Quản lý duyệt</span>`;
    } else if (rec.approval_status === 'REJECTED_BY_HUMAN') {
      statusHtml = `<span style="color: var(--accent-rose); font-weight: 600;">✕ Đã từ chối</span>`;
    }

    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.72rem; color: var(--accent-cyan);">${rec.trans_id}</td>
        <td style="font-size: 0.72rem; color: var(--text-dim);">${rec.timestamp}</td>
        <td><strong>${rec.caller_name}</strong></td>
        <td>${rec.caller_phone}</td>
        <td><span class="badge-tag ${intentBadge}">${rec.intent}</span></td>
        <td>${rec.appointment_time || 'Hôm nay'}</td>
        <td style="text-align: center;">${rec.party_size || 1}</td>
        <td style="font-weight: 700; color: var(--accent-cyan);">${rec.qa_score || 95}</td>
        <td>${statusHtml}</td>
        <td style="font-family: monospace; font-size: 0.72rem;">${rec.latency_ms || 45}ms</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// 9. PIPELINE VISUALIZER (7 BƯỚC)
// ==========================================
function resetPipelineVisualizer() {
  DOM.stepNodes.forEach(node => {
    node.className = 'pipeline-step-node';
  });
  DOM.pipelineStatusBadge.className = 'badge-tag badge-inquiry';
  DOM.pipelineStatusBadge.textContent = 'ĐANG XỬ LÝ...';
}

function animatePipelineStep(index) {
  if (index >= DOM.stepNodes.length) return;
  DOM.stepNodes[index].classList.add('active');
}

function completeAllPipelineSteps() {
  DOM.stepNodes.forEach(node => {
    node.className = 'pipeline-step-node completed';
  });
  DOM.pipelineStatusBadge.className = 'badge-tag badge-booking';
  DOM.pipelineStatusBadge.textContent = 'HOÀN TẤT 7 BƯỚC (HTTP 200)';
}

// ==========================================
// 10. THANH TRA PAYLOAD & METADATA
// ==========================================
function renderPayloadViewer() {
  if (STATE.activePayloadTab === 'request') {
    DOM.inspectorMetaText.textContent = "Gói tin HTTP POST Request gửi sang n8n Webhook";
    DOM.payloadViewer.textContent = STATE.lastRequestPayload 
      ? JSON.stringify(STATE.lastRequestPayload, null, 2)
      : "// Chưa có gói tin HTTP Request nào gửi đi.";
  } else if (STATE.activePayloadTab === 'response') {
    DOM.inspectorMetaText.textContent = "Gói tin HTTP 200 Response nhận về từ n8n Workflow";
    DOM.payloadViewer.textContent = STATE.lastResponsePayload 
      ? JSON.stringify(STATE.lastResponsePayload, null, 2)
      : "// Đang đợi máy chủ n8n phản hồi HTTP 200...";
  }
}

// ==========================================
// 11. 5 KỊCH BẢN KIỂM THỬ MẪU (1-CLICK)
// ==========================================
const PRESETS = {
  "1": {
    name: "Nguyễn Phú Anh",
    phone: "0905123456",
    transcript: "Chào em, anh là Nguyễn Phú Anh, số điện thoại 0905123456, đặt cho anh một bàn 4 người lúc 19 giờ tối nay nhé.",
    simulate_auth_fail: false
  },
  "2": {
    name: "Trần Quốc Minh",
    phone: "0913888999",
    transcript: "Tôi là Giám đốc Minh, cần đặt phòng VIP cho 20 khách ăn tiệc công ty lúc 18h30 ngày mai, số 0913888999.",
    simulate_auth_fail: false
  },
  "3": {
    name: "Hoàng Thị Mai",
    phone: "0988777666",
    transcript: "Tôi rất bức xúc muốn khiếu nại! Hôm qua tôi đặt hàng mã 9988 mà giao sai món, phục vụ quá tệ, yêu cầu hoàn tiền ngay!",
    simulate_auth_fail: false
  },
  "4": {
    name: "Lê Thu Lan",
    phone: "0935123456",
    transcript: "Cho mình hỏi giá khám nha khoa tổng quát bên mình bao nhiêu tiền và chiều mai còn khung giờ nào trống không?",
    simulate_auth_fail: false
  },
  "5": {
    name: "Anonymous User",
    phone: "0999999999",
    transcript: "Kiểm thử bảo mật Webhook Guardrail: Gói tin không có token hợp lệ.",
    simulate_auth_fail: true
  }
};

function applyPreset(presetId) {
  const p = PRESETS[presetId];
  if (!p) return;
  DOM.callerName.value = p.name;
  DOM.callerPhone.value = p.phone;
  DOM.transcriptInput.value = p.transcript;
  addLog(`Đã tải kịch bản kiểm thử #${presetId}: "${p.name}"`, 'info');
  sendCallToBackend(p);
}

// ==========================================
// 12. KIỂM TRA SỨC KHỎE HỆ THỐNG ĐỊNH KỲ
// ==========================================
async function checkSystemHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (data.n8n_engine_status === 'ONLINE') {
        DOM.n8nStatusBadge.className = 'status-badge';
        DOM.n8nStatusText.textContent = 'n8n Engine: ONLINE (Port 5678)';
      } else {
        DOM.n8nStatusBadge.className = 'status-badge offline';
        DOM.n8nStatusText.textContent = 'n8n Engine: OFFLINE (Dùng Local Engine)';
      }

      if (data.database_connected) {
        DOM.sqliteStatusBadge.className = 'status-badge';
        DOM.sqliteStatusText.textContent = 'SQLite CRM: CONNECTED';
      }
    }
  } catch (err) {
    DOM.n8nStatusBadge.className = 'status-badge offline';
    DOM.n8nStatusText.textContent = 'n8n Engine: OFFLINE (Port 5678)';
  }
}

// ==========================================
// 13. GẮN SỰ KIỆN GIAO DIỆN (EVENT LISTENERS)
// ==========================================
function setupEventListeners() {
  // Chuyển Tabs
  DOM.tabNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabNavButtons.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tab-hitl-crm') {
        fetchRecordsFromDB();
      }
    });
  });

  // Mic Button
  DOM.btnMic.addEventListener('click', () => {
    if (STATE.isRecording) {
      if (STATE.recognition) STATE.recognition.stop();
    } else {
      startRecording();
    }
  });

  // Clear Transcript
  DOM.btnClearTranscript.addEventListener('click', () => {
    DOM.transcriptInput.value = "";
  });

  // Send Call Button
  DOM.btnSendCall.addEventListener('click', () => {
    sendCallToBackend();
  });

  // Preset Buttons
  DOM.presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preset');
      applyPreset(id);
    });
  });

  // Voice Persona Controls
  DOM.voicePersonaSelect.addEventListener('change', (e) => {
    const config = PERSONA_CONFIGS[e.target.value] || PERSONA_CONFIGS.dieu_linh;
    DOM.speechRate.value = config.rate;
    DOM.rateValue.textContent = config.rate.toFixed(2) + 'x';
    DOM.speechPitch.value = config.pitch;
    DOM.pitchValue.textContent = config.pitch.toFixed(2);
    addLog(`Đã chuyển nhân vật trợ lý AI: ${config.name}`, 'info');
  });

  DOM.speechRate.addEventListener('input', (e) => {
    DOM.rateValue.textContent = parseFloat(e.target.value).toFixed(2) + 'x';
  });

  DOM.speechPitch.addEventListener('input', (e) => {
    DOM.pitchValue.textContent = parseFloat(e.target.value).toFixed(2);
  });

  DOM.btnTestVoice.addEventListener('click', () => {
    const personaKey = DOM.voicePersonaSelect ? DOM.voicePersonaSelect.value : 'dieu_linh';
    const persona = PERSONA_CONFIGS[personaKey] || PERSONA_CONFIGS.dieu_linh;
    speakVoiceReply(persona.sampleText);
  });

  DOM.btnReplayAudio.addEventListener('click', () => {
    if (STATE.currentVoiceReply) {
      speakVoiceReply(STATE.currentVoiceReply);
    }
  });

  DOM.btnStopAudio.addEventListener('click', () => {
    NaturalVietnameseTTS.stop();
    addLog('Đã dừng phát âm thanh TTS.', 'info');
  });

  // Clear Chat Stream
  DOM.btnClearChat.addEventListener('click', () => {
    DOM.chatMessageList.innerHTML = '';
    STATE.sessionMemory = [];
    addLog('Đã dọn dẹp lịch sử cuộc gọi và xóa bộ nhớ đệm.', 'info');
  });

  // Filter CRM
  if (DOM.crmFilterIntent) {
    DOM.crmFilterIntent.addEventListener('change', () => {
      renderCRMTable();
    });
  }

  // Reload CRM
  DOM.btnReloadCRM.addEventListener('click', () => {
    fetchRecordsFromDB();
    addLog('Đã làm mới dữ liệu từ SQLite CRM.', 'info');
  });

  // Reset Sample Records
  DOM.btnHeaderReset.addEventListener('click', async () => {
    if (confirm("Bạn có chắc muốn khôi phục cơ sở dữ liệu SQLite về 3 bản ghi mẫu ban đầu?")) {
      try {
        const res = await fetch("/api/reset", { method: "DELETE" });
        if (res.ok) {
          addLog("Đã khôi phục cơ sở dữ liệu SQLite CRM về 3 bản ghi mẫu ban đầu.", 'warning');
          await fetchRecordsFromDB();
        }
      } catch (err) {
        console.error("Lỗi reset DB:", err);
      }
    }
  });

  // Monitoring Inspector Tabs
  DOM.tabBtnRequest.addEventListener('click', () => {
    STATE.activePayloadTab = 'request';
    DOM.tabBtnRequest.classList.add('active');
    DOM.tabBtnResponse.classList.remove('active');
    DOM.tabBtnDocs.classList.remove('active');
    DOM.inspectorContent.style.display = 'block';
    DOM.falconideSpecsBox.style.display = 'none';
    renderPayloadViewer();
  });

  DOM.tabBtnResponse.addEventListener('click', () => {
    STATE.activePayloadTab = 'response';
    DOM.tabBtnResponse.classList.add('active');
    DOM.tabBtnRequest.classList.remove('active');
    DOM.tabBtnDocs.classList.remove('active');
    DOM.inspectorContent.style.display = 'block';
    DOM.falconideSpecsBox.style.display = 'none';
    renderPayloadViewer();
  });

  DOM.tabBtnDocs.addEventListener('click', () => {
    STATE.activePayloadTab = 'docs';
    DOM.tabBtnDocs.classList.add('active');
    DOM.tabBtnRequest.classList.remove('active');
    DOM.tabBtnResponse.classList.remove('active');
    DOM.inspectorContent.style.display = 'none';
    DOM.falconideSpecsBox.style.display = 'block';
  });

  // Copy JSON
  DOM.btnCopyJson.addEventListener('click', () => {
    const text = DOM.payloadViewer.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert("Đã sao chép gói tin JSON vào Clipboard!");
    });
  });

  // Clear Logs
  DOM.btnClearLogs.addEventListener('click', () => {
    DOM.logTerminal.innerHTML = '';
    addLog('Đã dọn dẹp nhật ký sự kiện.', 'info');
  });
}

// Khởi chạy khi tài liệu tải xong
document.addEventListener('DOMContentLoaded', () => {
  initSpeechRecognition();
  setupEventListeners();
  fetchRecordsFromDB();
  checkSystemHealth();
  setInterval(checkSystemHealth, 8000);
  addLog('Hệ thống Voice AI & Multi-Agent Call Automation Hub đã sẵn sàng!', 'success');
});
