# Grid Forge PoC — SCADA 화면 생성

## 개요

AI(Claude)에게 텍스트/이미지로 SCADA 화면을 요청하면, React 컴포넌트를 자동 생성하여 브라우저에서 실시간 렌더링합니다.

```
[사용자 입력] → [Claude API] → [TSX 코드 생성] → [esbuild 컴파일] → [브라우저 렌더링]
                    ↑                                                        ↓
              knowledge/master.md                                  시뮬레이션 태그 연동
```

## 실행 방법

### 1. API 키 설정

`.env` 파일을 생성하고 Anthropic API 키를 등록합니다:

```bash
cp .env.example .env
```

`.env` 파일에서 `ANTHROPIC_API_KEY` 값을 실제 키로 교체:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

> API 키는 [Anthropic Console](https://console.anthropic.com/)에서 발급받을 수 있습니다.

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버가 `http://localhost:20400`에서 시작됩니다.

### 3. PoC 에디터 접속

브라우저에서 `http://localhost:20400/poc`로 접속합니다.

## 사용법

### 화면 구성

```
┌──────────┬──────────────────────┬──────────┐
│          │                      │          │
│ AI Chat  │   SCADA Preview      │   Tags   │
│          │                      │          │
│ 텍스트/  │   AI가 생성한        │ 시뮬레이션│
│ 이미지   │   SCADA 화면이       │ 태그 값  │
│ 입력     │   실시간 렌더링      │ 모니터링 │
│          │                      │ /제어    │
└──────────┴──────────────────────┴──────────┘
```

- **왼쪽 패널 (AI Chat)**: SCADA 화면 요청을 텍스트로 입력하거나 참고 이미지를 첨부
- **가운데 패널 (Preview)**: AI가 생성한 SCADA 화면이 실시간으로 렌더링
- **오른쪽 패널 (Tags)**: 시뮬레이션 태그 값을 확인하고, 쓰기 가능한 태그는 직접 제어 가능

### 기본 테스트

1. 왼쪽 채팅 패널에서 요청을 입력합니다:
   - `"수배전반 단선도 만들어줘"`
   - `"변압기 2대와 차단기가 있는 SCADA 화면"`
   - `"모터 모니터링 대시보드 — 온도, 진동, RPM 차트 포함"`

2. AI가 코드를 생성하는 동안 진행 상태가 표시됩니다:
   - `"AI 분석 중..."` → `"도구 실행: list_tags"` → `"도구 실행: write_screen_code"` → ...

3. 생성이 완료되면 가운데에 SCADA 화면이 렌더링됩니다.

4. 오른쪽 태그 패널에서 값이 자동으로 변동하며 화면에 반영됩니다.

### 이미지 참고

`+` 버튼으로 참고 이미지(기존 SCADA 화면 캡처, 단선도 도면 등)를 첨부하면 AI가 해당 이미지를 참고하여 화면을 생성합니다.

### 화면 수정

생성된 화면을 수정하려면 같은 채팅에서 추가 요청을 합니다:
- `"차단기 색을 빨간색으로 바꿔줘"`
- `"트렌드 차트를 추가해줘"`
- `"레이아웃을 2열로 변경"`

대화 히스토리가 유지되므로 AI가 컨텍스트를 이해합니다.

### Slug 관리

화면은 slug 단위로 관리됩니다. Chat 패널 상단의 `Slug` 입력란에서 변경할 수 있습니다.
- 기본값: `screen`
- 다른 slug로 변경하면 새로운 화면을 생성
- 같은 slug로 재요청하면 기존 화면을 덮어씀

## 시뮬레이션 태그

PoC에서는 실제 TagBus 대신 클라이언트 시뮬레이션을 사용합니다.

### 기본 제공 태그 (20개)

| 태그 ID | 설명 | 단위 | 타입 | 쓰기 |
|---------|------|------|------|------|
| `bus.voltage` | 모선 전압 | kV | analog | N |
| `tr1.voltage` | 변압기1 전압 | V | analog | N |
| `tr1.current` | 변압기1 전류 | A | analog | N |
| `tr1.temp` | 변압기1 온도 | °C | analog | N |
| `tr2.voltage` | 변압기2 전압 | V | analog | N |
| `tr2.current` | 변압기2 전류 | A | analog | N |
| `tr2.temp` | 변압기2 온도 | °C | analog | N |
| `cb1.status` | 차단기1 상태 | - | discrete | Y |
| `cb2.status` | 차단기2 상태 | - | discrete | Y |
| `cb3.status` | 차단기3 상태 | - | discrete | Y |
| `power.active` | 유효전력 | kW | analog | N |
| `power.reactive` | 무효전력 | kVar | analog | N |
| `power.factor` | 역률 | - | analog | N |
| `motor.rpm` | 모터 RPM | RPM | analog | N |
| `motor.temp` | 모터 온도 | °C | analog | N |
| `motor.vibration` | 모터 진동 | mm/s | analog | N |
| `env.temperature` | 환경 온도 | °C | analog | N |
| `env.humidity` | 환경 습도 | % | analog | N |
| `setpoint.voltage` | 전압 설정값 | V | analog | Y |
| `setpoint.temp` | 온도 설정값 | °C | analog | Y |

- **Analog 태그**: 1초마다 ±2% 범위의 랜덤 변동 (Random Walk)
- **Discrete 태그**: 1초마다 2% 확률로 토글
- **Writable 태그**: 태그 패널에서 직접 값 변경 가능

## AI 도구 (Claude API Tools)

AI는 4개의 도구를 사용하여 SCADA 화면을 생성합니다:

### 1. `list_tags`
사용 가능한 시뮬레이션 태그 목록을 조회합니다. AI가 화면에 어떤 데이터를 표시할지 결정하는 데 사용합니다.

### 2. `write_screen_code`
React TSX 코드를 작성합니다. 컴포넌트는 다음 props를 받습니다:
```typescript
{
  tags: Record<string, { v: number | string | boolean; q: string; t: number }>,
  setTags: (pairs: Record<string, number | string | boolean>) => void,
  alarms: { active: any[]; history: any[] },
  chartData: { query: (tagId: string) => Array<{ t: number; v: number }> },
  screenState: { state: Record<string, unknown>; setState: (patch: Record<string, unknown>) => void },
  userSettings: { theme: string },
  assets: any[],
  navigate: (screenSlug: string) => void
}
```

### 3. `validate_code`
작성된 코드에서 금지 패턴(useState, fetch, eval 등)을 검사합니다.

### 4. `compile_screen`
TSX 코드를 esbuild로 컴파일하여 실행 가능한 번들을 생성합니다.

### 일반적인 도구 호출 순서

```
list_tags → write_screen_code → validate_code → compile_screen
```

위반이 발견되면 AI가 코드를 수정하고 다시 validate → compile을 반복합니다 (최대 15회 루프).

## Knowledge 시스템

AI의 시스템 프롬프트는 `knowledge/master.md` 파일에서 로드됩니다. 이 파일에는:

- Props API 계약서 (tags, setTags, chartData 등의 사용법)
- SCADA 화면 디자인 규칙 (색상, 레이아웃, 다크 테마)
- 단선도 그리기 패턴 (SVG 심볼: 변압기, 차단기)
- recharts 차트 코드 예시
- 금지 패턴 목록

이 파일을 수정하면 AI의 화면 생성 방식이 달라집니다.

## 아키텍처

```
src/
├── app/
│   ├── poc/page.tsx              # PoC 메인 페이지
│   └── api/poc/
│       ├── generate/route.ts     # SSE 스트리밍 API (Claude 호출)
│       └── bundle/[slug]/route.ts # 컴파일된 JS 번들 서빙
├── components/poc/
│   ├── editor-layout.tsx         # 3패널 레이아웃
│   ├── chat-panel.tsx            # AI 채팅 인터페이스
│   ├── preview-panel.tsx         # SCADA 프리뷰
│   └── tag-panel.tsx             # 태그 모니터링/제어
└── lib/poc/
    ├── ai-engine.ts              # Claude API 에이전틱 루프
    ├── compiler.ts               # esbuild 컴파일러
    ├── validator.ts              # 코드 검증 (금지 패턴)
    ├── tools.ts                  # Claude 도구 정의/실행
    ├── sim-tags.ts               # 시뮬레이션 태그 설정
    ├── use-sim-tags.ts           # React 시뮬레이션 훅
    ├── screen-renderer.tsx       # 동적 번들 로더/렌더러
    └── shims/                    # esbuild 모듈 별칭
        ├── react-shim.mjs
        ├── jsx-runtime-shim.mjs
        └── recharts-shim.mjs

knowledge/
└── master.md                     # AI 시스템 프롬프트 (SCADA 가이드)

data/poc/                         # 런타임 데이터 (gitignore)
├── screens/{slug}.tsx            # 생성된 소스 코드
└── builds/{slug}.js              # 컴파일된 번들
```

## 보안 모델 (Defense in Depth)

1. **Tool Restriction**: AI가 사용할 수 있는 도구를 4개로 제한
2. **AST Validation**: useState, fetch, eval, document.* 등 금지 패턴 검출
3. **esbuild Sandbox**: 파일시스템 접근 없이 메모리 내 번들링
4. **Runtime Isolation**: Function constructor로 실행 — DOM 접근 제한
5. **Deploy Approval**: 프로덕션 배포 전 관리자 검토 (향후)

## 문제 해결

### API 키 오류
```
Error: ANTHROPIC_API_KEY가 설정되지 않았습니다.
```
→ `.env` 파일에 `ANTHROPIC_API_KEY` 값이 올바르게 설정되었는지 확인

### 컴파일 오류
AI가 생성한 코드에 문법 오류가 있으면 에러 메시지가 채팅에 표시됩니다.
같은 채팅에서 `"컴파일 오류를 수정해줘"`라고 요청하면 AI가 수정을 시도합니다.

### 빈 화면
번들 로드 실패 시 발생합니다. 브라우저 콘솔에서 에러를 확인하세요.
서버 로그에서 `Bundle load error`를 검색합니다.
