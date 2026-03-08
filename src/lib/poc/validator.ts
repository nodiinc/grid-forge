export interface Violation {
  pattern: string;
  message: string;
  line: number;
}

const BANNED_PATTERNS: Array<{ regex: RegExp; pattern: string; message: string }> = [
  { regex: /\bfetch\s*\(/, pattern: "fetch", message: "네트워크 호출 금지 — props API를 사용하세요" },
  { regex: /\bXMLHttpRequest\b/, pattern: "XMLHttpRequest", message: "네트워크 호출 금지" },
  { regex: /\bWebSocket\b/, pattern: "WebSocket", message: "WebSocket 직접 사용 금지" },
  { regex: /\beval\s*\(/, pattern: "eval", message: "동적 코드 실행 금지" },
  { regex: /\bdocument\.\b/, pattern: "document.*", message: "DOM 직접 접근 금지" },
  { regex: /\bwindow\.location\b/, pattern: "window.location", message: "브라우저 API 직접 접근 금지" },
  { regex: /\blocalStorage\b/, pattern: "localStorage", message: "브라우저 저장소 접근 금지" },
  { regex: /\bsessionStorage\b/, pattern: "sessionStorage", message: "브라우저 저장소 접근 금지" },
  { regex: /\bdocument\.cookie\b/, pattern: "cookie", message: "쿠키 접근 금지" },
  { regex: /\buseState\b/, pattern: "useState", message: "useState 금지 — screenState를 사용하세요" },
  { regex: /\buseReducer\b/, pattern: "useReducer", message: "useReducer 금지 — screenState를 사용하세요" },
  { regex: /\buseEffect\b/, pattern: "useEffect", message: "useEffect 금지 — props 콜백을 사용하세요" },
];

// Detect dynamic code execution patterns (banned in AI-generated code)
const DYNAMIC_EXEC_PATTERN = /\bnew\s+Function\s*\(/;

export function validateCode(code: string): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // Skip import lines (import React from 'react' is OK — shim handles it)
    if (trimmed.startsWith("import ")) continue;

    for (const rule of BANNED_PATTERNS) {
      if (rule.regex.test(line)) {
        violations.push({
          pattern: rule.pattern,
          message: rule.message,
          line: i + 1,
        });
      }
    }

    // Check dynamic code execution
    if (DYNAMIC_EXEC_PATTERN.test(line)) {
      violations.push({
        pattern: "dynamic code execution",
        message: "동적 코드 실행 금지",
        line: i + 1,
      });
    }
  }

  return violations;
}
