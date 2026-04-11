"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { GameCoreABI } from "@/config/abis";

type CharacterPreset = {
  id: string;
  name: string;
  codename: string;
  classTier: string;
  origin: string;
  fightingStyle: string;
  traits: string[];
  mood: {
    label: string;
    icon: string;
    color: string;
  };
  tagline: string;
};

const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "sophia",
    name: "Vex Rail",
    codename: "CHAINBREAK",
    classTier: "BRAWLER",
    origin: "Dockside Grid-17",
    fightingStyle: "Street Brawler",
    traits: ["Reckless", "Loyal", "Trash-Talker"],
    mood: { label: "Amped", icon: "⚡", color: "#4ef0d0" },
    tagline: "Breaks guard with raw pressure and laughs through incoming fire.",
  },
  {
    id: "ada",
    name: "Kaze-9",
    codename: "NULL SHADOW",
    classTier: "ASSASSIN",
    origin: "Neon Temple District",
    fightingStyle: "Cyber Ninjutsu",
    traits: ["Disciplined", "Silent", "Precise"],
    mood: { label: "Focused", icon: "◉", color: "#6ea8ff" },
    tagline: "Vanishing dash slashes and surgical punishes from blind angles.",
  },
  {
    id: "turing",
    name: "Mira Static",
    codename: "GLITCH WITCH",
    classTier: "TACTICIAN",
    origin: "Undernet Node V",
    fightingStyle: "Trap Hacker",
    traits: ["Sarcastic", "Brilliant", "Guarded"],
    mood: { label: "Scheming", icon: "⌁", color: "#ff6bd6" },
    tagline: "Builds trap webs that collapse whole teams in one bad rotation.",
  },
  {
    id: "socrates",
    name: "Brax Ironjaw",
    codename: "WALLBREAKER",
    classTier: "TANK",
    origin: "Old Barrens Front",
    fightingStyle: "Power Grappling",
    traits: ["Stoic", "Tactical", "Relentless"],
    mood: { label: "Steady", icon: "▣", color: "#f9b95e" },
    tagline: "Punishes over-extensions with crushing holds and armored slams.",
  },
  {
    id: "aristotle",
    name: "Nyx Fang",
    codename: "MOON CLAW",
    classTier: "RUSH",
    origin: "Ash Alley Warrens",
    fightingStyle: "Beastkin Rushdown",
    traits: ["Predatory", "Playful", "Hotheaded"],
    mood: { label: "Hunting", icon: "✦", color: "#fd6f7a" },
    tagline: "Unleashes bleed chains and savage corner pressure on instinct.",
  },
  {
    id: "descartes",
    name: "Rune Halo",
    codename: "HEX SABER",
    classTier: "BURST",
    origin: "Rift Chapel Sublevel",
    fightingStyle: "Demonic Burstblade",
    traits: ["Prideful", "Charismatic", "Volatile"],
    mood: { label: "Smoldering", icon: "✹", color: "#b08cff" },
    tagline: "Sacrifices stability for explosive rune casts and lethal bursts.",
  },
  {
    id: "plato",
    name: "Tanka-0",
    codename: "IRON SAINT",
    classTier: "JUGGERNAUT",
    origin: "Scrapyard Basilica",
    fightingStyle: "Juggernaut Protocol",
    traits: ["Literal", "Protective", "Unshakable"],
    mood: { label: "Shielding", icon: "⛨", color: "#4ef0d0" },
    tagline: "Absorbs punishment, then deletes lanes with heavy denial patterns.",
  },
  {
    id: "leibniz",
    name: "Lexi Quill",
    codename: "RAIL SPARK",
    classTier: "SKIRMISH",
    origin: "Transit Arcades",
    fightingStyle: "Skater Hit-and-Run",
    traits: ["Defiant", "Optimistic", "Chaotic"],
    mood: { label: "Hyper", icon: "✧", color: "#6ea8ff" },
    tagline: "Dances around heavy fighters and chips them apart with speed tech.",
  },
  {
    id: "dennett",
    name: "Ordo Blacksite",
    codename: "DEBT COLLECTOR",
    classTier: "HUNTER",
    origin: "Corporate Crown Ring",
    fightingStyle: "Bounty Punisher",
    traits: ["Cold", "Methodical", "Contract-Bound"],
    mood: { label: "Locked-In", icon: "◎", color: "#f9b95e" },
    tagline: "Finds one opening, marks the target, then never lets go.",
  },
  {
    id: "paul",
    name: "Mother Rust",
    codename: "WRENCH QUEEN",
    classTier: "DISRUPTOR",
    origin: "Foundry Borough",
    fightingStyle: "Improvised Disable",
    traits: ["Blunt", "Protective", "Resourceful"],
    mood: { label: "Gritty", icon: "⌬", color: "#fd6f7a" },
    tagline: "Turns scrap, sparks, and battlefield junk into brutal control tools.",
  },
  {
    id: "searle",
    name: "Chimera Jax",
    codename: "SPLIT VEIN",
    classTier: "HYBRID",
    origin: "Bioforge Fringe",
    fightingStyle: "Stance Shifter",
    traits: ["Unpredictable", "Poetic", "Feral"],
    mood: { label: "Unstable", icon: "☍", color: "#ff6bd6" },
    tagline: "Swaps forms mid-string to scramble reads and crack defense.",
  },
  {
    id: "chomsky",
    name: "Saint Volt",
    codename: "ARC PILGRIM",
    classTier: "MONK",
    origin: "Storm Shrine Orbit",
    fightingStyle: "Shock Monk",
    traits: ["Calm", "Conflicted", "Merciless"],
    mood: { label: "Charged", icon: "⚔", color: "#4ef0d0" },
    tagline: "Builds tempo through electric strings and punishes panic escapes.",
  },
];

const SHEET = { width: 832, height: 3456 };
const FRONT_FRAME = { x: 18, y: 143, w: 28, h: 47 };
const WALK_FRAMES = [
  { x: 18, y: 655, w: 28, h: 47 },
  { x: 82, y: 655, w: 28, h: 47 },
  { x: 147, y: 655, w: 27, h: 48 },
  { x: 82, y: 655, w: 28, h: 47 },
];

function buildSpriteStyle(characterId: string, scale: number, frame: { x: number; y: number; w: number; h: number }) {
  return {
    width: `${frame.w * scale}px`,
    height: `${frame.h * scale}px`,
    backgroundImage: `url(/assets/characters/${characterId}/atlas.png)`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
    backgroundSize: `${SHEET.width * scale}px ${SHEET.height * scale}px`,
    imageRendering: "pixelated" as const,
  };
}

export default function RegisterPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTER_PRESETS[0].id);
  const [callSign, setCallSign] = useState("");
  const [metadataURI, setMetadataURI] = useState("ipfs://");
  const [heroFrameIndex, setHeroFrameIndex] = useState(0);
  const [contractsReady, setContractsReady] = useState<boolean | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  const { data: agentTxHash, writeContract: registerAgent, isPending: isRegPending, error: regError } = useWriteContract();
  const { isLoading: isAgentConfirming, isSuccess: isAgentSuccess } = useWaitForTransactionReceipt({ hash: agentTxHash });
  const { data: hasCharacter } = useReadContract({
    address: CONTRACTS.gameCore,
    abi: GameCoreABI,
    functionName: "hasCharacter",
    args: address ? [address] : undefined,
    query: { enabled: contractsReady === true && !!address },
  });

  const selectedCharacter = useMemo(
    () => CHARACTER_PRESETS.find((entry) => entry.id === selectedCharacterId) ?? CHARACTER_PRESETS[0],
    [selectedCharacterId],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroFrameIndex((prev) => (prev + 1) % WALK_FRAMES.length);
    }, 180);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAgentSuccess || !address) return;

    const walletKey = address.toLowerCase();
    window.localStorage.setItem(`recruitAtlasByWallet:${walletKey}`, selectedCharacter.id);
  }, [isAgentSuccess, address, selectedCharacter.id]);

  useEffect(() => {
    let active = true;

    const checkContracts = async () => {
      if (!publicClient || !CONTRACTS.agentNFT || !CONTRACTS.gameCore) {
        if (active) setContractsReady(false);
        return;
      }

      try {
        const [agentCode, coreCode] = await Promise.all([
          publicClient.getCode({ address: CONTRACTS.agentNFT }),
          publicClient.getCode({ address: CONTRACTS.gameCore }),
        ]);

        if (!active) return;
        setContractsReady(Boolean(agentCode && agentCode !== "0x") && Boolean(coreCode && coreCode !== "0x"));
      } catch {
        if (active) setContractsReady(false);
      }
    };

    checkContracts();
    return () => {
      active = false;
    };
  }, [publicClient, chainId]);

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setHeroFrameIndex(0);
  };

  const mintedName = callSign.trim() || selectedCharacter.name;
  const hasExistingCharacter = Boolean(hasCharacter as boolean | undefined);
  const recruitDisabled = isRegPending || isAgentConfirming || contractsReady === false;
  const readableRegError =
    (regError as { shortMessage?: string; message?: string } | null)?.shortMessage ||
    (regError as { shortMessage?: string; message?: string } | null)?.message ||
    null;

  const handleRegisterAgent = async () => {
    if (!address || !mintedName.trim()) return;

    setPreflightError(null);

    const request = {
      address: CONTRACTS.gameCore,
      abi: GameCoreABI,
      functionName: "registerAgent" as const,
      args: [address, mintedName.trim(), metadataURI] as const,
    };

    try {
      if (publicClient) {
        const simulation = await publicClient.simulateContract({
          ...request,
          account: address,
        });

        registerAgent(simulation.request);
        return;
      }

      registerAgent(request);
    } catch (err) {
      const msg =
        (err as { shortMessage?: string; message?: string })?.shortMessage ||
        (err as { shortMessage?: string; message?: string })?.message ||
        "Simulation failed before send.";
      setPreflightError(msg);
    }
  };

  if (!isConnected) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 12,
            color: "var(--accent-red)",
            marginBottom: 16,
          }}
        >
          WALLET NOT LINKED
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="page-container recruit-v2-screen">
      <section className="pixel-panel recruit-v2-shell">
        <header className="recruit-v2-header">
          <div>
            <p className="recruit-v2-kicker">HALFKILO AGENT ARENA</p>
            <h1 className="recruit-v2-title">NEON CONTRACT RECRUITMENT</h1>
          </div>
          <p className="recruit-v2-subtitle">Select a combatant, stamp a callsign, and lock your on-chain fighter.</p>
        </header>

        <div className="recruit-v2-stage-grid">
          <section className="pixel-panel-inset recruit-v2-portrait-panel">
            <div className="recruit-v2-portrait-wrap">
              <div className="recruit-v2-platform" />
              <div
                className="recruit-v2-portrait-sprite"
                role="img"
                aria-label={selectedCharacter.name}
                style={buildSpriteStyle(selectedCharacter.id, 6, WALK_FRAMES[heroFrameIndex])}
              />
            </div>
            <div className="recruit-v2-stage-readout">
              <span>CLASS</span>
              <strong>{selectedCharacter.classTier}</strong>
              <span>STYLE</span>
              <strong>{selectedCharacter.fightingStyle}</strong>
            </div>
          </section>

          <section className="pixel-panel recruit-v2-info-panel">
            <div className="recruit-v2-name-block">
              <p className="avatar-label">ACTIVE AGENT</p>
              <h2>{selectedCharacter.name}</h2>
              <span className="recruit-v2-codename">{selectedCharacter.codename}</span>
            </div>

            <div className="recruit-v2-stat-list">
              <div className="recruit-v2-stat-row">
                <span>STYLE</span>
                <strong>{selectedCharacter.fightingStyle}</strong>
              </div>
              <div className="recruit-v2-stat-row">
                <span>ORIGIN</span>
                <strong>{selectedCharacter.origin}</strong>
              </div>
              <div className="recruit-v2-stat-row">
                <span>TRAITS</span>
                <strong>{selectedCharacter.traits.join(" / ")}</strong>
              </div>
              <div className="recruit-v2-stat-row">
                <span>MOOD</span>
                <strong style={{ color: selectedCharacter.mood.color }}>
                  {selectedCharacter.mood.icon} {selectedCharacter.mood.label}
                </strong>
              </div>
            </div>

            <p className="recruit-v2-tagline">{selectedCharacter.tagline}</p>

            <div className="recruit-v2-controls">
              <div>
                <label className="avatar-label">CALLSIGN</label>
                <input
                  className="pixel-input"
                  value={callSign}
                  placeholder={selectedCharacter.name}
                  onChange={(e) => setCallSign(e.target.value)}
                />
              </div>

              <div>
                <label className="avatar-label">METADATA URI</label>
                <input
                  className="pixel-input"
                  placeholder="ipfs://..."
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                />
              </div>

              <button
                className="pixel-btn recruit-v2-btn"
                onClick={() => void handleRegisterAgent()}
                disabled={recruitDisabled}
              >
                {isRegPending
                  ? "CONFIRM IN WALLET..."
                  : isAgentConfirming
                    ? "UPDATING AGENT..."
                    : hasExistingCharacter
                      ? `CHANGE TO ${mintedName.toUpperCase()}`
                      : `RECRUIT ${mintedName.toUpperCase()}`}
              </button>

              {contractsReady === false && (
                <div className="tx-error">
                  CONTRACTS NOT DEPLOYED ON CHAIN {chainId}. SWITCH NETWORK OR UPDATE FRONTEND CONTRACT ADDRESSES.
                </div>
              )}

              {hasExistingCharacter && contractsReady === true && (
                <div className="tx-success">
                  YOU ALREADY HAVE A RECRUITED AGENT. PICK A NEW PRESET AND CLICK CHANGE TO SWITCH YOUR ACTIVE AGENT.
                </div>
              )}

              {readableRegError && <div className="tx-error">TX ERROR: {readableRegError}</div>}
              {preflightError && <div className="tx-error">SIMULATION ERROR: {preflightError}</div>}

              {isAgentSuccess && (
                <div className="tx-success">AGENT RECRUITED | TX: {agentTxHash?.slice(0, 16)}...</div>
              )}
            </div>
          </section>
        </div>

        <section className="pixel-panel recruit-v2-roster-shell">
          <div className="recruit-v2-roster-head">
            <h3 className="avatar-heading">ROSTER GRID</h3>
            <span>{CHARACTER_PRESETS.length} AGENTS ONLINE</span>
          </div>
          <div className="recruit-v2-roster-grid">
            {CHARACTER_PRESETS.map((character) => {
              const selected = selectedCharacter.id === character.id;
              return (
                <button
                  key={character.id}
                  type="button"
                  className={`recruit-v2-thumb ${selected ? "selected" : ""}`}
                  onClick={() => handleCharacterSelect(character.id)}
                  aria-pressed={selected}
                >
                  <div
                    className="recruit-v2-thumb-art"
                    style={buildSpriteStyle(character.id, 2, FRONT_FRAME)}
                    role="img"
                    aria-label={character.name}
                  />
                  <div className="recruit-v2-thumb-copy">
                    <strong>{character.name}</strong>
                    <span>{character.classTier}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
