import { z } from "zod";
import { writeScreenCode as writeFile, compileScreen as compile } from "./compiler";
import { validateCode as validate } from "./validator";
import { DEFAULT_TAGS } from "./sim-tags";

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolResult {
  content: string;
  is_error?: boolean;
}

// Current screen slug — set per request
let currentSlug = "screen";

export function setCurrentSlug(slug: string) {
  currentSlug = slug;
}

// Tool schemas for Claude API
export const toolDefinitions: ToolDef[] = [
  {
    name: "write_screen_code",
    description:
      "TSX 화면 코드를 작성한다. React 컴포넌트를 default export로 작성해야 한다. " +
      "컴포넌트는 { tags, setTags, alarms, chartData, screenState, userSettings, assets, navigate } props를 받는다.",
    input_schema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "React TSX 컴포넌트 코드 (default export 필수)",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "validate_code",
    description:
      "작성된 코드의 금지 패턴을 검사한다. useState, fetch, eval 등 금지 패턴이 있으면 위반 목록을 반환한다. 위반이 없으면 통과.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "compile_screen",
    description:
      "작성된 TSX 코드를 esbuild로 컴파일한다. 성공 시 번들 생성, 실패 시 에러 메시지를 반환한다.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_tags",
    description:
      "사용 가능한 태그 목록을 조회한다. 태그 ID, 설명, 단위, 데이터 타입, 쓰기 가능 여부를 반환한다.",
    input_schema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "태그 ID 필터 (부분 일치, 예: 'tr1', 'motor'). 생략하면 전체 목록.",
        },
      },
      required: [],
    },
  },
];

// Tool execution
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  switch (name) {
    case "write_screen_code": {
      const code = input.code as string;
      if (!code) return { content: "코드가 비어있습니다.", is_error: true };
      await writeFile(currentSlug, code);
      return { content: "코드 작성 완료." };
    }

    case "validate_code": {
      const { readScreenCode } = await import("./compiler");
      const code = await readScreenCode(currentSlug);
      if (!code) return { content: "작성된 코드가 없습니다. write_screen_code를 먼저 호출하세요.", is_error: true };
      const violations = validate(code);
      if (violations.length === 0) return { content: "검증 통과 — 금지 패턴 없음." };
      const report = violations.map((v) => `- ${v.pattern}: ${v.message} (line ${v.line})`).join("\n");
      return { content: `위반 발견 (${violations.length}건):\n${report}` };
    }

    case "compile_screen": {
      const result = await compile(currentSlug);
      if (result.success) return { content: "컴파일 성공 — 번들 생성 완료." };
      return { content: `컴파일 실패:\n${result.errors.join("\n")}` };
    }

    case "list_tags": {
      const filter = (input.filter as string) || "";
      const filtered = filter
        ? DEFAULT_TAGS.filter((t) => t.tagId.includes(filter) || t.label.includes(filter))
        : DEFAULT_TAGS;
      const list = filtered.map(
        (t) =>
          `${t.tagId} — ${t.label} (${t.unit || "없음"}, ${t.dataType}, ${t.writable ? "읽기/쓰기" : "읽기전용"})`,
      );
      return { content: `사용 가능한 태그 (${list.length}개):\n${list.join("\n")}` };
    }

    default:
      return { content: `알 수 없는 도구: ${name}`, is_error: true };
  }
}
