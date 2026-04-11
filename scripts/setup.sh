#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
#  Halfkilo — One-command setup script
# ──────────────────────────────────────────────────

BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
CYAN="\033[36m"
RESET="\033[0m"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════╗"
echo "║     HALFKILO — PROJECT SETUP        ║"
echo "╚══════════════════════════════════════╝"
echo -e "${RESET}"

# ── Step 1: Check prerequisites ──
echo -e "${BOLD}[1/5] Checking prerequisites...${RESET}"

if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found. Install Node.js 20+ first.${RESET}"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 20 ]; then
  echo -e "${RED}✗ Node.js $NODE_VER detected. Need 20+.${RESET}"
  exit 1
fi
echo -e "  ${GREEN}✓${RESET} Node.js $(node -v)"
echo -e "  ${GREEN}✓${RESET} npm $(npm -v)"

# ── Step 2: Install dependencies ──
echo -e "\n${BOLD}[2/5] Installing dependencies (all workspaces)...${RESET}"
cd "$ROOT_DIR"
npm install
echo -e "  ${GREEN}✓${RESET} All workspace dependencies installed"

# ── Step 3: Environment files ──
echo -e "\n${BOLD}[3/5] Setting up environment files...${RESET}"

setup_env() {
  local dir="$1"
  local name="$2"
  if [ -f "$dir/.env" ]; then
    echo -e "  ${DIM}↳ $name/.env already exists — skipping${RESET}"
  elif [ -f "$dir/.env.example" ]; then
    cp "$dir/.env.example" "$dir/.env"
    echo -e "  ${GREEN}✓${RESET} Created $name/.env from .env.example"
  else
    echo -e "  ${YELLOW}⚠${RESET} No .env.example found in $name/"
  fi
}

setup_env "$ROOT_DIR/frontend" "frontend"
setup_env "$ROOT_DIR/mastra-backend" "mastra-backend"

# ── Step 4: Validate API key ──
echo -e "\n${BOLD}[4/5] Checking Google Gemini API key...${RESET}"

MASTRA_ENV="$ROOT_DIR/mastra-backend/.env"
if [ -f "$MASTRA_ENV" ]; then
  GEMINI_KEY=$(grep -oP 'GOOGLE_GENERATIVE_AI_API_KEY=\K.+' "$MASTRA_ENV" 2>/dev/null || true)
  if [ -z "$GEMINI_KEY" ]; then
    echo -e "  ${YELLOW}⚠ GOOGLE_GENERATIVE_AI_API_KEY is empty in mastra-backend/.env${RESET}"
    echo ""
    echo -e "  ${CYAN}To get a FREE API key (no credit card):${RESET}"
    echo -e "  1. Go to ${BOLD}https://aistudio.google.com/apikey${RESET}"
    echo -e "  2. Sign in with your Google account"
    echo -e "  3. Click ${BOLD}\"Create API key\"${RESET}"
    echo -e "  4. Paste the key into ${BOLD}mastra-backend/.env${RESET}"
    echo ""
    read -rp "  Paste your API key now (or press Enter to skip): " USER_KEY
    if [ -n "$USER_KEY" ]; then
      sed -i "s|^GOOGLE_GENERATIVE_AI_API_KEY=.*|GOOGLE_GENERATIVE_AI_API_KEY=$USER_KEY|" "$MASTRA_ENV"
      echo -e "  ${GREEN}✓${RESET} API key saved to mastra-backend/.env"
    else
      echo -e "  ${DIM}↳ Skipped — you can add it later${RESET}"
    fi
  else
    echo -e "  ${GREEN}✓${RESET} API key found"
  fi
else
  echo -e "  ${YELLOW}⚠ mastra-backend/.env not found${RESET}"
fi

# ── Step 5: Summary ──
echo -e "\n${BOLD}[5/5] Setup complete!${RESET}"
echo ""
echo -e "${CYAN}${BOLD}Quick Start:${RESET}"
echo -e "  ${BOLD}Full stack (frontend + mastra + websocket):${RESET}"
echo -e "    npm run dev:all"
echo ""
echo -e "  ${BOLD}Individual services:${RESET}"
echo -e "    npm run dev:frontend    ${DIM}# Next.js on :3000${RESET}"
echo -e "    npm run dev:mastra      ${DIM}# Mastra API :3002 + WS :3001${RESET}"
echo -e "    npm run dev:ws          ${DIM}# PvP relay WS :8080${RESET}"
echo ""
echo -e "${DIM}Contracts: cd contracts && npx hardhat compile${RESET}"
echo ""
echo -e "${GREEN}${BOLD}Ready to battle! 🎮${RESET}"
