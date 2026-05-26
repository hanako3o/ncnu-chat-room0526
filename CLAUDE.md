# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace Overview

This is a development workspace for an **Anonymous WebSocket Chat** — a serverless, single-channel, anonymous real-time chat room. The target implementation repository is `git@github.com:samsonchen/ai_course_2.git`.

**Current workspace directories:**
- `ncnu-chat-room0526/documents/` — Latest design and spec documents (authoritative source of truth)
- `0520test/` — Working SAM template (`template.yaml`) and `samconfig.toml` with deployment config
- `ai_workshop_assets/` — Workshop assets (QR codes, prerequisite guides)

## Backend Commands (AWS SAM)

Run from the project root where `template.yaml` lives (e.g., `0520test/` or the cloned `ai_course_2/`):

```bash
sam validate --template template.yaml
sam build
sam deploy --no-confirm-changeset    # After first guided deploy
sam deploy --guided                  # First-time only — requires interactive terminal (human)

# Test a single Lambda locally
sam local invoke ConnectFunction -e events/connect_valid.json

# View logs
sam logs -n ConnectFunction --stack-name anonymous-chat --tail
sam logs -n SendMessageFunction --stack-name anonymous-chat --tail

# Inspect DynamoDB connections
aws dynamodb scan --table-name ChatConnections

# Get WebSocket URL after deploy
aws cloudformation describe-stacks \
  --stack-name anonymous-chat \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketUrl'].OutputValue" \
  --output text

# Teardown
sam delete --stack-name anonymous-chat --no-prompts
```

**Stack name:** `anonymous-chat` | **Region:** `us-west-2`

## Frontend Commands

Run from `webui/` inside the implementation repo:

```bash
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Output to webui/dist/
```

Create `webui/.env.local` for local development:
```
VITE_WS_ENDPOINT=wss://{api-id}.execute-api.us-west-2.amazonaws.com/prod
```

## Architecture

```
Browser (React + Vite + TypeScript, GitHub Pages)
  └─ WebSocket (wss://) with ?callsign=<name>
       └─ API Gateway v2 (WebSocket, route selection: $request.body.action)
            ├─ $connect      → connect Lambda     → DynamoDB PUT
            ├─ $disconnect   → disconnect Lambda  → DynamoDB DELETE + broadcast user_left
            └─ sendMessage   → send_message Lambda → DynamoDB SCAN + PostToConnection fan-out
                                                      → DynamoDB DELETE on GoneException
```

**DynamoDB table `ChatConnections`:** partition key `connectionId` (String). Attributes: `callsign`, `connectedAt`. Stores only active connections — no message history. Access pattern: PUT / DELETE / full SCAN for broadcast.

**Three Lambda functions** (Python 3.12):
- `connect`: validates `callsign` query param (`^[a-zA-Z0-9_]{1,20}$`), writes to DynamoDB, broadcasts `user_joined` system event. Returns non-200 to reject the WebSocket handshake.
- `disconnect`: deletes `connectionId` from DynamoDB, broadcasts `user_left` system event.
- `send_message`: retrieves sender's callsign from DynamoDB by `connectionId` (not from client payload — prevents spoofing), scans all connections, calls `PostToConnection` on each.

**API Gateway Management API endpoint** (for `PostToConnection` inside Lambda):
```python
endpoint_url = f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}"
```

`TABLE_NAME` is auto-injected by SAM — no manual env var setup needed.

## Message Formats (Server → Client)

```typescript
// Chat message
{ type: "message", callsign: string, text: string, timestamp: string }

// System event
{ type: "system", event: "user_joined" | "user_left", callsign: string, timestamp: string }
```

**Client → server** (sendMessage route):
```json
{ "action": "sendMessage", "text": "Hello!" }
```

## Frontend Structure (inside `webui/src/`)

```
App.tsx                  # Routes between JoinScreen and ChatScreen
components/
  JoinScreen.tsx         # Callsign input + join button; validates ^[a-zA-Z0-9_]{1,20}$
  ChatScreen.tsx         # Message list + input + status
  MessageList.tsx        # Scrollable container, auto-scrolls to bottom
  MessageItem.tsx        # Single message; own messages visually distinct
  MessageInput.tsx       # Text input (max 1000 chars) + send button
  StatusIndicator.tsx    # connecting / connected / disconnected / reconnecting
hooks/useWebSocket.ts    # WebSocket lifecycle, reconnection with exponential backoff
types/index.ts           # ChatMessage, SystemEvent, SendMessagePayload, AppState
config.ts                # VITE_WS_ENDPOINT env var
```

**Vite config must set** `base: '/ai_course_2/'` for GitHub Pages deployment.

**Reconnection strategy:** 2s initial wait, exponential backoff (2s → 4s → 8s → max 30s), manual reconnect button after 5 failures.

## Human-Only Steps

- `sam deploy --guided` (first deploy — requires interactive terminal)
- `aws configure` (credentials setup — never handle AWS keys)
- GitHub Pages activation (repo Settings → Pages → set source branch)

## Design Documents

Authoritative specs in `ncnu-chat-room0526/documents/`:
- `01-system-architecture.md` — architecture and design rationale
- `02-api-specification.md` — WebSocket routes, payloads, DynamoDB schema
- `03-aws-configuration.md` — full SAM template, deployment procedures, post-deploy verification
- `04-lambda-connect-spec.md` — connect Lambda with test event examples
- `05-lambda-disconnect-spec.md` — disconnect Lambda spec
- `06-lambda-send-message-spec.md` — send_message Lambda spec
- `07-frontend-design.md` — React components, TypeScript interfaces, RWD breakpoints
