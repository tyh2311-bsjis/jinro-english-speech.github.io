import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  pri: "#4F46E5", priLight: "#EEF2FF", priDark: "#3730A3",
  suc: "#10B981", sucLight: "#ECFDF5",
  war: "#F59E0B", warLight: "#FFFBEB",
  dan: "#EF4444", danLight: "#FEF2F2",
  bg: "#F8FAFC", border: "#E2E8F0",
  text: "#1E293B", text2: "#64748B", text3: "#94A3B8",
};

const DEMO = {
  overallScore: 68,
  segmental: {
    score: 65,
    problemSounds: [
      { sound: "/θ/", examples: ["think","three"], tip: "혀끝을 윗니 사이에 살짝 넣고 바람을 불어내세요.", koreanEquivalent: "ㅅ이나 ㄷ으로 발음하는 경향이 있어요" },
      { sound: "/r/", examples: ["really","right"], tip: "혀를 어디에도 닿지 않게 들어올린 채 발음하세요.", koreanEquivalent: "ㄹ처럼 혀가 천장에 닿지 않도록 주의하세요" },
    ],
    wordLevelIssues: [
      { word: "beautiful", issue: "강세 위치 오류", correct: "BEA-u-ti-ful", tip: "첫 번째 음절에 강세를 두세요." },
      { word: "favorite", issue: "3음절로 발음", correct: "FAV-rite", tip: "'favorite'는 실제로 2음절처럼 빠르게 발음합니다." },
    ],
  },
  suprasegmental: {
    score: 72,
    intonation: { rating: "보통", feedback: "문장 끝이 모두 올라가는 경향이 있어요. 평서문은 끝을 내려야 합니다.", modelingSuggestion: "I LOVE spring ↘ because the flowers BLOOM ↘ and the weather is WARM ↘." },
    rhythm: { rating: "보통", feedback: "모든 단어를 같은 박자로 말하고 있어요. 영어는 강세 박자 언어로 내용어를 더 강하게 말해야 해요." },
    stress: { rating: "개선 필요", feedback: "문장 내 핵심 단어에 강세를 주지 않아서 단조롭게 들립니다." },
    pace: { wpm: 95, ideal: "120-150", feedback: "말하는 속도가 너무 느려요. 조금 더 자신감 있게 빠르게 말해보세요." },
  },
  fluency: {
    score: 66,
    pausePatterns: "모든 쉼표와 마침표에서 너무 길게 멈추고 있어요.",
    fillerWords: ["um","uh","like"],
    feedback: "um/uh 같은 간투사가 많이 들어가고 있어요. 막히는 부분에서 짧게 호흡하고 이어서 말하는 연습을 하세요.",
  },
  coachingAdvice: {
    mood: "전체적으로 원고를 읽는 느낌이 강해요. 청중에게 이야기하듯 말하면 훨씬 자연스러워질 거예요. 눈을 들고 미소 지으며 말해보세요! 😊",
    specificTips: [
      "내용어(명사, 동사, 형용사)를 더 크고 길게 말하고, 기능어(전치사, 관사)는 빠르게 지나가세요.",
      "문장 끝 억양을 연습하세요: 평서문(↘), 의문문(↗), 열거(→→↘)",
      "모델링 스크립트를 보며 대문자 단어를 강조하면서 낭독해 보세요.",
    ],
    modelingScript: "Hello EVERYONE ↗. My NAME is Jimin ↘, and TODAY I will TALK about my FAVORITE season ↘. I absolutely LOVE spring ↗ because the FLOWERS bloom ↘ and the weather becomes WARM and PLEASANT ↘.",
  },
  passThreshold: { required: 75, achieved: false },
};

const DEMO_SCRIPT = "Hello everyone. My name is Jimin and today I will talk about my favorite season. I absolutely love spring because the flowers bloom and the weather becomes warm and pleasant. Don't you agree that spring is the best time of year?";
const DEMO_TRANSCRIPT = "Hello everyone. My name is Jimin and today I will talk about my, um, favorite season. I absolutely, uh, love spring because the flowers bloom and the weather become warm and pleasant. Don't you agree that spring is the best time of year?";

function scoreColor(s) { return s >= 75 ? COLORS.suc : s >= 60 ? COLORS.war : COLORS.dan; }
function scoreLabel(s) { return s >= 75 ? "합격" : s >= 60 ? "보통" : "미흡"; }
function scoreBg(s) { return s >= 75 ? COLORS.sucLight : s >= 60 ? COLORS.warLight : COLORS.danLight; }
function scoreTextColor(s) { return s >= 75 ? "#065F46" : s >= 60 ? "#92400E" : "#991B1B"; }

function ScoreTag({ score }) {
  return (
    <span style={{ background: scoreBg(score), color: scoreTextColor(score), borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
      {scoreLabel(score)}
    </span>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 7, background: COLORS.border, borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: `${value}%`, height: "100%", background: color || scoreColor(value), borderRadius: 4, transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 500, color: COLORS.text2, marginBottom: 8 }}>{children}</div>;
}

function ScoreCircle({ score }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ - (circ * score / 100);
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke={COLORS.border} strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.8s" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "monospace" }}>{score}</div>
        <div style={{ fontSize: 10, color: COLORS.text2 }}>/ 100점</div>
      </div>
    </div>
  );
}

function ModelingText({ text }) {
  const parts = text.split(/(\b[A-Z]{2,}\b)/g);
  return (
    <div style={{ fontSize: 14, lineHeight: 1.9, background: "#FAFAF5", border: "1px solid #E5E7C5", borderRadius: 8, padding: 14, letterSpacing: "0.2px" }}>
      {parts.map((p, i) =>
        /^[A-Z]{2,}$/.test(p)
          ? <strong key={i} style={{ color: "#B45309", fontSize: 15 }}>{p}</strong>
          : <span key={i}>{p}</span>
      )}
    </div>
  );
}

function WaveAnimation() {
  const bars = [40, 70, 90, 60, 100, 70, 80, 50];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 36 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, height: `${h}%`, background: COLORS.dan, borderRadius: 2,
          animation: `wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
        }} />
      ))}
      <style>{`@keyframes wave { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }`}</style>
    </div>
  );
}

function PracticeTab({ apiKey, setApiKey }) {
  const [script, setScript] = useState("");
  const [passScore, setPassScore] = useState(75);
  const [transcript, setTranscript] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const timeRef = useRef(0);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setManualMode(true); return; }
    const r = new SR();
    r.lang = "en-US"; r.continuous = true; r.interimResults = true;
    let final = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    r.onerror = () => { stopRec(); setManualMode(true); };
    r.start();
    recognitionRef.current = r;
    setRecording(true);
    timeRef.current = 0;
    timerRef.current = setInterval(() => { timeRef.current++; setRecTime(timeRef.current); }, 1000);
  };

  const stopRec = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const getEffectiveTranscript = () => manualText.trim() || transcript.trim();

  const analyze = async () => {
    const t = getEffectiveTranscript();
    if (!t && !script) { alert("녹음하거나 직접 입력해 주세요!"); return; }
    if (!apiKey) { alert("API 키를 입력하거나 데모 모드를 사용하세요!"); return; }

    setLoading(true); setResult(null);
    const prompt = `당신은 한국 중고등학생의 영어 스피치 수행평가를 분석하는 전문 영어 선생님입니다.
아래 정보를 바탕으로 발음을 분석하고 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요.

[목표 스크립트]
${script || "(스크립트 없음)"}

[학생이 실제로 말한 내용]
${t || "(transcript 없음)"}

[합격 기준 점수]: ${passScore}점

다음 JSON 구조로 정확히 응답하세요:
{
  "overallScore": <0-100>,
  "segmental": {
    "score": <0-100>,
    "problemSounds": [{"sound": "/IPA/", "examples": ["단어1","단어2"], "tip": "한국어 교정 팁", "koreanEquivalent": "한국어 발음 습관"}],
    "wordLevelIssues": [{"word": "단어", "issue": "문제 설명(한국어)", "correct": "올바른 강세 표시(하이픈으로 음절 구분, 대문자=강세)", "tip": "교정 팁(한국어)"}]
  },
  "suprasegmental": {
    "score": <0-100>,
    "intonation": {"rating": "등급", "feedback": "한국어 피드백", "modelingSuggestion": "억양 기호 포함 예시 문장"},
    "rhythm": {"rating": "등급", "feedback": "한국어 피드백"},
    "stress": {"rating": "등급", "feedback": "한국어 피드백"},
    "pace": {"wpm": <숫자>, "ideal": "120-150", "feedback": "한국어 피드백"}
  },
  "fluency": {
    "score": <0-100>,
    "pausePatterns": "한국어 설명",
    "fillerWords": ["filler1"],
    "feedback": "한국어 피드백"
  },
  "coachingAdvice": {
    "mood": "전체적인 분위기/태도 한국어 코칭",
    "specificTips": ["팁1(한국어)","팁2(한국어)","팁3(한국어)"],
    "modelingScript": "강세는 대문자, 억양은 ↗↘ 기호로 표시한 모범 스크립트"
  },
  "passThreshold": {"required": ${passScore}, "achieved": <true/false>}
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": apiKey, "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content[0].text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      saveAttempt(parsed);
      setResult(parsed);
    } catch (e) {
      alert("분석 오류: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAttempt = (r) => {
    const h = JSON.parse(localStorage.getItem("speechPractice_history") || "[]");
    h.push({ timestamp: new Date().toISOString(), overallScore: r.overallScore, segScore: r.segmental.score, supraScore: r.suprasegmental.score, fluScore: r.fluency.score, passed: r.passThreshold.achieved });
    localStorage.setItem("speechPractice_history", JSON.stringify(h));
  };

  const speakModeling = (text) => {
    if (!("speechSynthesis" in window)) { alert("이 브라우저에서는 TTS가 지원되지 않아요."); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[↗↘]/g, ""));
    u.lang = "en-US"; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const reset = () => { setResult(null); setTranscript(""); setManualText(""); setRecTime(0); };

  const loadDemo = () => {
    setScript(DEMO_SCRIPT);
    setManualText(DEMO_TRANSCRIPT);
    setManualMode(true);
    setResult(DEMO);
    saveAttempt(DEMO);
  };

  return (
    <div style={{ padding: 14 }}>
      {/* API 키 */}
      <Card>
        <Label>🔑 Anthropic API 키 설정</Label>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..."
          style={{ width: "100%", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: "monospace", outline: "none", color: COLORS.text }} />
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={loadDemo} style={{ background: COLORS.warLight, color: "#92400E", border: `1.5px solid ${COLORS.war}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            ✨ 데모 모드로 체험하기 (API 없이)
          </button>
          <span style={{ fontSize: 11, color: COLORS.text3 }}>키는 이 기기에만 저장됩니다</span>
        </div>
      </Card>

      {/* 스크립트 & 목표점수 */}
      <Card>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Label>📝 발표 스크립트 (선생님이 주신 원고)</Label>
            <textarea value={script} onChange={e => setScript(e.target.value)} placeholder={"여기에 발표할 영어 원고를 붙여넣으세요...\n예) Hello everyone. My name is Jimin and today I will talk about my favorite season..."}
              style={{ width: "100%", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, resize: "vertical", minHeight: 80, outline: "none", color: COLORS.text, background: COLORS.bg }} />
          </div>
          <div>
            <Label>🎯 합격 기준 점수</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" value={passScore} onChange={e => setPassScore(+e.target.value)} min="0" max="100"
                style={{ width: 65, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "6px 8px", fontSize: 13, textAlign: "center", outline: "none", color: COLORS.text }} />
              <span style={{ fontSize: 13, color: COLORS.text2 }}>점</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 녹음 */}
      <Card>
        <Label>🎙️ 발음 녹음 또는 전사 입력</Label>
        <div style={{ border: `2px dashed ${recording ? COLORS.dan : COLORS.border}`, borderRadius: 12, padding: 20, textAlign: "center", background: recording ? COLORS.danLight : "transparent", transition: "all .2s", marginBottom: 10 }}>
          {recording ? (
            <>
              <WaveAnimation />
              <div style={{ fontSize: 13, color: COLORS.dan, margin: "8px 0", fontWeight: 500 }}>녹음 중... {recTime}초</div>
              <button onClick={stopRec} style={{ border: `1.5px solid ${COLORS.pri}`, background: "#fff", color: COLORS.pri, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>⏹ 녹음 중지</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
              <p style={{ fontSize: 13, color: COLORS.text2, marginBottom: 12 }}>마이크 버튼을 눌러 말하기 시작하세요</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={startRec} style={{ background: COLORS.dan, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>🔴 녹음 시작</button>
                <span style={{ fontSize: 12, color: COLORS.text3, alignSelf: "center" }}>또는</span>
                <button onClick={() => setManualMode(!manualMode)} style={{ border: `1.5px solid ${COLORS.pri}`, background: "#fff", color: COLORS.pri, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>✍️ 직접 입력</button>
              </div>
            </>
          )}
        </div>
        {transcript && (
          <div style={{ marginBottom: 10 }}>
            <Label>📋 인식된 텍스트</Label>
            <div style={{ background: "#F1F5F9", borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.7, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>{transcript}</div>
          </div>
        )}
        {manualMode && (
          <div>
            <Label>✍️ 직접 말한 내용 입력 (음성 인식이 어려울 때)</Label>
            <textarea value={manualText} onChange={e => setManualText(e.target.value)} placeholder="말한 내용을 영어로 입력해 주세요..."
              style={{ width: "100%", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, resize: "vertical", minHeight: 70, outline: "none", color: COLORS.text, background: COLORS.bg }} />
          </div>
        )}
      </Card>

      {/* 분석 버튼 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={analyze} disabled={loading} style={{ background: loading ? COLORS.text3 : COLORS.pri, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          {loading ? "⏳ 분석 중..." : "🤖 AI 분석 시작"}
        </button>
        {result && (
          <button onClick={reset} style={{ border: `1.5px solid ${COLORS.pri}`, background: "#fff", color: COLORS.pri, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>🔄 다시 연습</button>
        )}
      </div>

      {/* 로딩 */}
      {loading && (
        <Card>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0", gap: 12 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.pri, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ fontSize: 13, color: COLORS.text2, textAlign: "center", lineHeight: 1.7 }}>Claude AI가 발음을 분석하고 있습니다...<br />잠시만 기다려주세요 ✨</p>
          </div>
        </Card>
      )}

      {/* 결과 */}
      {result && <ResultView result={result} onSpeak={speakModeling} />}
    </div>
  );
}

function ResultView({ result, onSpeak }) {
  const pass = result.passThreshold.achieved;
  const seg = result.segmental;
  const sup = result.suprasegmental;
  const flu = result.fluency;
  const coach = result.coachingAdvice;

  return (
    <>
      {/* 합격/불합격 배너 */}
      <div style={{ borderRadius: 12, padding: 18, textAlign: "center", marginBottom: 12, background: pass ? COLORS.sucLight : COLORS.danLight, border: `2px solid ${pass ? COLORS.suc : COLORS.dan}` }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: pass ? "#065F46" : "#991B1B" }}>{pass ? "🎉 합격!" : "💪 조금 더 연습이 필요해요"}</div>
        <div style={{ fontSize: 13, color: COLORS.text2 }}>{pass ? `목표 점수 ${result.passThreshold.required}점을 달성했어요! 정말 잘했어요!` : `현재 ${result.overallScore}점 / 목표 ${result.passThreshold.required}점. 포기하지 마세요!`}</div>
      </div>

      {/* 총점 */}
      <Card>
        <SectionTitle>📊 종합 점수</SectionTitle>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <ScoreCircle score={result.overallScore} />
          <div style={{ flex: 1, minWidth: 180 }}>
            {[{ label: "🔤 분절음", score: seg.score }, { label: "🎵 초분절음", score: sup.score }, { label: "💬 유창성", score: flu.score }].map(c => (
              <div key={c.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: COLORS.text2 }}>{c.label}</span>
                  <span style={{ fontWeight: 600, color: scoreColor(c.score) }}>{c.score}점</span>
                </div>
                <ProgressBar value={c.score} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 분절음 */}
      <Card>
        <SectionTitle>🔤 발음 분석 (분절음)</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(seg.score) }}>{seg.score}점</span>
          <ScoreTag score={seg.score} />
        </div>
        {seg.problemSounds.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Label>⚠️ 교정이 필요한 발음</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }}>
              {seg.problemSounds.map((s, i) => (
                <div key={i} style={{ background: COLORS.priLight, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 15, color: COLORS.pri, fontWeight: 700 }}>{s.sound}</div>
                  <div style={{ fontSize: 11, color: COLORS.text2, margin: "2px 0" }}>{s.examples.join(", ")}</div>
                  <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5, color: COLORS.text }}>{s.tip}</div>
                  <div style={{ fontSize: 10, color: COLORS.text3, marginTop: 3 }}>💡 {s.koreanEquivalent}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {seg.wordLevelIssues.length > 0 && (
          <div>
            <Label>📝 단어 강세 교정</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {seg.wordLevelIssues.map((w, i) => {
                const parts = w.correct.split("-");
                return (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 4 }}>
                      {parts.map((p, j) => (
                        <div key={j} style={{ padding: "3px 7px", borderRadius: 4, background: /^[A-Z]/.test(p) ? COLORS.pri : COLORS.bg, color: /^[A-Z]/.test(p) ? "#fff" : COLORS.text, fontWeight: /^[A-Z]/.test(p) ? 700 : 400, fontSize: 13, border: `1px solid ${COLORS.border}` }}>{p}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.text2, maxWidth: 120 }}>{w.tip}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 초분절음 */}
      <Card>
        <SectionTitle>🎵 억양 &amp; 리듬 분석 (초분절음)</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(sup.score) }}>{sup.score}점</span>
          <ScoreTag score={sup.score} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          {[
            { icon: "🎶", label: "억양", data: sup.intonation },
            { icon: "🥁", label: "리듬", data: sup.rhythm },
            { icon: "💪", label: "강세", data: sup.stress },
            { icon: "⏱", label: "속도", data: { rating: `${sup.pace.wpm} WPM`, feedback: sup.pace.feedback } },
          ].map((item, i) => (
            <div key={i} style={{ background: COLORS.bg, borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: COLORS.text }}>{item.icon} {item.label} <span style={{ background: COLORS.warLight, color: "#92400E", borderRadius: 10, padding: "1px 7px", fontSize: 10, marginLeft: 4 }}>{item.data.rating}</span></div>
              <div style={{ color: COLORS.text2, lineHeight: 1.6 }}>{item.data.feedback}</div>
            </div>
          ))}
        </div>
        {sup.intonation.modelingSuggestion && (
          <>
            <Label>📢 억양 모델링 예시</Label>
            <div style={{ fontSize: 13, lineHeight: 1.9, background: "#FAFAF5", border: "1px solid #E5E7C5", borderRadius: 8, padding: 12, color: COLORS.text }}>{sup.intonation.modelingSuggestion}</div>
          </>
        )}
      </Card>

      {/* 유창성 */}
      <Card>
        <SectionTitle>💬 유창성 분석</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(flu.score) }}>{flu.score}점</span>
          <ScoreTag score={flu.score} />
        </div>
        <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.7, color: COLORS.text2, marginBottom: 8 }}>{flu.feedback}</div>
        {flu.fillerWords.length > 0 && (
          <div style={{ fontSize: 12, color: COLORS.text2, marginBottom: 6 }}>
            🚫 간투사 감지: {flu.fillerWords.map((f, i) => (
              <span key={i} style={{ background: COLORS.danLight, color: "#991B1B", borderRadius: 10, padding: "2px 8px", fontSize: 11, margin: "0 3px" }}>{f}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: COLORS.text2 }}>⏸ 쉬는 패턴: {flu.pausePatterns}</div>
      </Card>

      {/* 코칭 & 모델링 */}
      <Card>
        <SectionTitle>🎓 코치 조언 &amp; 모델링 스크립트</SectionTitle>
        <div style={{ fontSize: 14, lineHeight: 1.7, background: COLORS.bg, borderRadius: 8, padding: 12, borderLeft: `3px solid ${COLORS.pri}`, color: COLORS.text, marginBottom: 10 }}>{coach.mood}</div>
        <Label>✅ 구체적인 연습 방법</Label>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {coach.specificTips.map((t, i) => (
            <li key={i} style={{ fontSize: 13, padding: "8px 12px", background: COLORS.bg, borderRadius: 6, lineHeight: 1.6, display: "flex", gap: 8, color: COLORS.text }}>
              <span>💡</span><span>{t}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <Label style={{ marginBottom: 0 }}>🎯 모델링 스크립트 (굵은 글자 = 강조)</Label>
          <button onClick={() => onSpeak(coach.modelingScript)} style={{ border: `1.5px solid ${COLORS.pri}`, background: "#fff", color: COLORS.pri, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>🔊 TTS 듣기</button>
        </div>
        <ModelingText text={coach.modelingScript} />
      </Card>
    </>
  );
}

function ProgressTab() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("speechPractice_history") || "[]"));
  }, []);

  const chartData = history.map((h, i) => ({ name: `${i + 1}회`, 종합: h.overallScore, 분절음: h.segScore, 초분절음: h.supraScore, 유창성: h.fluScore }));
  const best = history.length ? Math.max(...history.map(h => h.overallScore)) : 0;

  return (
    <div style={{ padding: 14 }}>
      <Card>
        <SectionTitle>📈 점수 변화 추이</SectionTitle>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: COLORS.text3 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>아직 기록이 없어요.<br />연습하고 나면 점수 변화를 여기서 볼 수 있어요!</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="종합" stroke={COLORS.pri} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="분절음" stroke={COLORS.suc} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="초분절음" stroke={COLORS.war} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="유창성" stroke={COLORS.dan} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            {best > 0 && (
              <div style={{ marginTop: 10, background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", borderRadius: 8, padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "#92400E", fontWeight: 500 }}>
                🏆 개인 최고 기록: <strong>{best}점</strong>
              </div>
            )}
          </>
        )}
      </Card>
      <Card>
        <SectionTitle>🗂 최근 시도 기록</SectionTitle>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: COLORS.text3, fontSize: 13 }}>아직 기록이 없어요.</div>
        ) : (
          [...history].reverse().slice(0, 5).map((h, i) => {
            const d = new Date(h.timestamp);
            const dateStr = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            const isB = h.overallScore === best;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${COLORS.border}` : "none" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    {dateStr}
                    {isB && <span style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>최고기록!</span>}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.text3, marginTop: 2 }}>{h.passed ? "✅ 합격" : "❌ 미달"} &nbsp; 분절음{h.segScore}·초분절음{h.supraScore}·유창성{h.fluScore}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(h.overallScore) }}>{h.overallScore}점</div>
              </div>
            );
          })
        )}
        {history.length > 0 && (
          <div style={{ marginTop: 8, textAlign: "right" }}>
            <button onClick={() => { localStorage.removeItem("speechPractice_history"); setHistory([]); }} style={{ background: "none", border: `1px solid ${COLORS.dan}`, color: COLORS.dan, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑 기록 삭제</button>
          </div>
        )}
      </Card>
    </div>
  );
}

function RubricTab() {
  const tips = ["목표 점수 이상이 될 때까지 같은 스크립트로 반복 연습하세요.", "모델링 스크립트를 소리 내어 읽으며 억양을 따라해 보세요.", "TTS 듣기 버튼으로 원어민 발음을 여러 번 들어보세요.", "가장 점수가 낮은 카테고리에 집중적으로 연습하세요."];
  const grades = [{ range: "90–100점", label: "최우수 ★★★", score: 90 }, { range: "75–89점", label: "우수 (합격)", score: 75 }, { range: "60–74점", label: "보통 (재도전)", score: 60 }, { range: "0–59점", label: "미흡 (집중 필요)", score: 30 }];
  return (
    <div style={{ padding: 14 }}>
      <Card>
        <SectionTitle>📋 평가 영역 및 기준</SectionTitle>
        {[{ t: "🔤 분절음 (Segmental)", p: "30점", d: "개별 자음/모음 정확도, 단어 강세 위치, 묵음 처리, 연음 처리 등을 평가합니다." },
          { t: "🎵 초분절음 (Suprasegmental)", p: "40점", d: "문장 억양 패턴, 발화 리듬, 강조 단어, 말하는 속도(WPM), 끊어 읽기 등을 평가합니다." },
          { t: "💬 유창성 (Fluency)", p: "30점", d: "머뭇거림 횟수, filler word 사용, 자연스러운 발화 흐름, 자신감을 평가합니다." }
        ].map((r, i) => (
          <div key={i} style={{ paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{r.t}</span>
              <span style={{ background: COLORS.priLight, color: "#3730A3", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{r.p}</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.text2, lineHeight: 1.7 }}>{r.d}</div>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>🎯 점수 등급표</SectionTitle>
        {grades.map((g, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none", fontSize: 13 }}>
            <span style={{ color: COLORS.text }}>{g.range}</span>
            <span style={{ background: scoreBg(g.score), color: scoreTextColor(g.score), borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{g.label}</span>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>💡 연습 팁</SectionTitle>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {tips.map((t, i) => (
            <li key={i} style={{ fontSize: 13, padding: "8px 12px", background: COLORS.bg, borderRadius: 6, lineHeight: 1.6, display: "flex", gap: 8, color: COLORS.text }}>
              <span>💡</span><span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("practice");
  const [apiKey, setApiKey] = useState(localStorage.getItem("speechApiKey") || "");
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem("speechPractice_history") || "[]"));

  useEffect(() => { localStorage.setItem("speechApiKey", apiKey); }, [apiKey]);

  const streak = history.length;

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      {/* 헤더 */}
      <div style={{ background: COLORS.pri, color: "#fff", padding: "16px 18px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>🎤 스피치 수행평가 연습</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>English Speech Practice Trainer</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 500 }}>
          연속 {streak}회 연습 중
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 56, zIndex: 99 }}>
        {[["practice", "🎤 연습하기"], ["progress", "📊 내 기록"], ["rubric", "📋 평가기준"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: "11px 4px", fontSize: 13, fontWeight: 500, color: tab === key ? COLORS.pri : COLORS.text2, cursor: "pointer", border: "none", background: "none", borderBottom: tab === key ? `2px solid ${COLORS.pri}` : "2px solid transparent", transition: "all .2s", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      {tab === "practice" && <PracticeTab apiKey={apiKey} setApiKey={setApiKey} />}
      {tab === "progress" && <ProgressTab />}
      {tab === "rubric" && <RubricTab />}
    </div>
  );
}
