import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { toolDefinitions, executeTool, setCurrentSlug } from "./tools";
import { readScreenCode } from "./compiler";

const knowledgePath = path.resolve(process.cwd(), "knowledge/master.md");

async function loadKnowledge(): Promise<string> {
  return fs.readFile(knowledgePath, "utf-8");
}

export interface AiEvent {
  type: "status" | "delta" | "done" | "error";
  data: Record<string, unknown>;
}

export interface GenerateRequest {
  message: string;
  images?: Array<{ data: string; mimeType: string }>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  slug?: string;
}

// Compress conversation history to reduce token usage on follow-up requests.
// Instead of replaying all tool_use/tool_result turns, send a summary with
// only the last generated code and recent assistant text.
function compressHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  lastCode: string | null,
): Anthropic.MessageParam[] {
  if (history.length === 0) return [];

  // Collect user messages and last assistant response
  const userMessages: string[] = [];
  let lastAssistantText = "";

  for (const msg of history) {
    if (msg.role === "user") {
      userMessages.push(msg.content);
    } else {
      lastAssistantText = msg.content;
    }
  }

  const parts: string[] = [];
  parts.push("[이전 대화 요약]");
  parts.push(`사용자 요청: ${userMessages.join(" → ")}`);
  if (lastAssistantText) {
    // Truncate long assistant text
    const truncated = lastAssistantText.length > 300
      ? lastAssistantText.slice(0, 300) + "..."
      : lastAssistantText;
    parts.push(`AI 응답: ${truncated}`);
  }
  if (lastCode) {
    parts.push(`현재 화면 코드:\n\`\`\`tsx\n${lastCode}\n\`\`\``);
  }

  return [
    { role: "user", content: parts.join("\n") },
    { role: "assistant", content: "이전 대화 내용을 확인했습니다. 새 요청을 처리하겠습니다." },
  ];
}

export async function* generateScreen(req: GenerateRequest): AsyncGenerator<AiEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: "error", data: { message: "ANTHROPIC_API_KEY가 설정되지 않았습니다." } };
    return;
  }

  const client = new Anthropic({ apiKey });
  const knowledge = await loadKnowledge();
  const slug = req.slug || "screen";
  setCurrentSlug(slug);

  // Build messages with history compression
  const messages: Anthropic.MessageParam[] = [];

  if (req.history && req.history.length > 0) {
    // Read last generated code for context
    const lastCode = await readScreenCode(slug);
    const compressed = compressHistory(req.history, lastCode);
    messages.push(...compressed);
  }

  // Build current user message content
  const userContent: Anthropic.ContentBlockParam[] = [];

  if (req.images) {
    for (const img of req.images) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          data: img.data,
        },
      });
    }
  }

  userContent.push({ type: "text", text: req.message });
  messages.push({ role: "user", content: userContent });

  // Tool definitions for Claude API
  const tools: Anthropic.Tool[] = toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }));

  // System prompt with cache_control for prompt caching
  const systemPrompt: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: knowledge,
      cache_control: { type: "ephemeral" },
    },
  ];

  yield { type: "status", data: { message: "AI 분석 중..." } };

  // Agentic loop (manual — for progress reporting)
  let loopCount = 0;
  const maxLoops = 15;

  while (loopCount < maxLoops) {
    loopCount++;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 16000,
        system: systemPrompt,
        tools,
        messages,
      });
    } catch (exc) {
      const msg = exc instanceof Error ? exc.message : String(exc);
      yield { type: "error", data: { message: `Claude API 에러: ${msg}` } };
      return;
    }

    // Log token usage for cost tracking
    if (response.usage) {
      const cached = (response.usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
      yield {
        type: "status",
        data: {
          message: `Turn ${loopCount} — 입력: ${response.usage.input_tokens}토큰 (캐시: ${cached}), 출력: ${response.usage.output_tokens}토큰`,
          usage: response.usage,
        },
      };
    }

    // Process response content
    let assistantText = "";
    const toolUseBlocks: Anthropic.ToolUseBlock[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        assistantText += block.text;
        yield { type: "delta", data: { text: block.text } };
      } else if (block.type === "tool_use") {
        toolUseBlocks.push(block);
      }
    }

    // If no tool calls, we're done
    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      yield {
        type: "done",
        data: { slug, response: assistantText },
      };
      return;
    }

    // Execute tool calls
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolBlock of toolUseBlocks) {
      yield {
        type: "status",
        data: { message: `도구 실행: ${toolBlock.name}`, tool: toolBlock.name },
      };

      const result = await executeTool(
        toolBlock.name,
        toolBlock.input as Record<string, unknown>,
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result.content,
        is_error: result.is_error,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  yield { type: "error", data: { message: "에이전틱 루프 최대 반복 횟수 초과" } };
}
