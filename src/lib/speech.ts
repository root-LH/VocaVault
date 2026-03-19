export const speak = (text: string, lang: string = "en-US") => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    // 이전 음성 재생 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;

    // 사용 가능한 음성 목록 가져오기
    const voices = window.speechSynthesis.getVoices();
    
    const preferredVoice = voices.find(v => 
      (v.lang.includes(lang) && (
        v.name.includes("Female") || 
        v.name.includes("Google") || 
        v.name.includes("Samantha") || 
        v.name.includes("Microsoft Jessa") ||
        v.name.includes("Microsoft Zira")
      ))
    ) || voices.find(v => v.lang.includes(lang));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis not supported in this browser.");
  }
};

// 브라우저에 따라 음성 목록이 늦게 로딩되는 경우가 있어 초기화 호출
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
}
