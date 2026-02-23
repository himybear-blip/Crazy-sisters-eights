import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Plus, 
  ChevronRight,
  Info
} from "lucide-react";

// --- Types & Constants ---

type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-slate-900",
  spades: "text-slate-900",
};

// --- Helper Functions ---

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: index + 1,
      });
    });
  });
  return deck;
};

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// --- Components ---

const CardView = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = ""
}: { 
  card?: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
}) => {
  if (!card && isFaceUp) return null;

  return (
    <motion.div
      layoutId={card?.id}
      onClick={onClick}
      whileHover={(isPlayable || (onClick && !isFaceUp)) ? { y: -10, scale: 1.02 } : {}}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 shadow-lg cursor-pointer transition-colors
        ${isFaceUp ? "bg-white border-slate-200" : "bg-indigo-600 border-indigo-400"}
        ${isPlayable ? "ring-4 ring-yellow-400 border-yellow-400" : ""}
        flex items-center justify-center overflow-hidden
        ${className}
      `}
    >
      {isFaceUp && card ? (
        <div className={`w-full h-full p-2 flex flex-col justify-between ${SUIT_COLORS[card.suit]}`}>
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg sm:text-xl font-bold">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
          <div className="text-3xl sm:text-4xl self-center">
            {SUIT_SYMBOLS[card.suit]}
          </div>
          <div className="flex flex-col items-end leading-none rotate-180">
            <span className="text-lg sm:text-xl font-bold">{card.rank}</span>
            <span className="text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-16 sm:w-16 sm:h-24 border-2 border-indigo-300/30 rounded-lg flex items-center justify-center">
             <div className="w-8 h-12 sm:w-12 sm:h-16 border border-indigo-300/20 rounded flex items-center justify-center">
                <span className="text-indigo-200/20 font-bold text-2xl">8</span>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"player" | "ai">("player");
  const [gameState, setGameState] = useState<"start" | "playing" | "choosingSuit" | "gameOver">("start");
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [winner, setWinner] = useState<"player" | "ai" | null>(null);
  const [message, setMessage] = useState<string>("Welcome to Crazy Eights!");
  const [mustDraw, setMustDraw] = useState<boolean>(false);

  // --- Game Actions ---

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    
    // Find a non-8 card for the start of discard pile if possible
    let firstDiscardIndex = fullDeck.findIndex(c => c.rank !== "8");
    if (firstDiscardIndex === -1) firstDiscardIndex = 0;
    const firstDiscard = fullDeck.splice(firstDiscardIndex, 1)[0];

    setDeck(fullDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(firstDiscard.suit);
    setCurrentPlayer("player");
    setGameState("playing");
    setWinner(null);
    setMessage("Your turn! Match the card or play an 8.");
  }, []);

  const topCard = discardPile[discardPile.length - 1];

  const isCardPlayable = useCallback((card: Card) => {
    if (!topCard) return false;
    if (card.rank === "8") return true;
    return card.suit === currentSuit || card.rank === topCard.rank;
  }, [topCard, currentSuit]);

  const playerHasPlayableCard = useMemo(() => {
    return playerHand.some(isCardPlayable);
  }, [playerHand, isCardPlayable]);

  useEffect(() => {
    if (currentPlayer === "player" && gameState === "playing") {
      if (!playerHasPlayableCard) {
        setMustDraw(true);
        if (deck.length > 0) {
          setMessage("No playable cards! You must draw from the deck.");
        } else {
          setMessage("No playable cards and deck is empty! Skipping turn...");
          const timer = setTimeout(() => {
            setCurrentPlayer("ai");
            setMustDraw(false);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } else {
        setMustDraw(false);
        setMessage("Your turn! Match the card or play an 8.");
      }
    } else {
      setMustDraw(false);
    }
  }, [currentPlayer, gameState, playerHasPlayableCard, deck.length]);

  const checkWin = useCallback((hand: Card[], player: "player" | "ai") => {
    if (hand.length === 0) {
      setWinner(player);
      setGameState("gameOver");
      return true;
    }
    return false;
  }, []);

  const playCard = (card: Card, player: "player" | "ai") => {
    if (player === "player") {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setAiHand(prev => prev.filter(c => c.id !== card.id));
    }

    setDiscardPile(prev => [...prev, card]);
    
    if (card.rank === "8") {
      if (player === "player") {
        setGameState("choosingSuit");
        setMessage("Choose a new suit!");
      } else {
        // AI chooses suit it has most of
        const suitCounts = aiHand.reduce((acc, c) => {
          if (c.id === card.id) return acc;
          acc[c.suit] = (acc[c.suit] || 0) + 1;
          return acc;
        }, {} as Record<Suit, number>);
        
        const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || "hearts";
        setCurrentSuit(bestSuit);
        setMessage(`AI played an 8 and chose ${bestSuit}!`);
        
        if (!checkWin(aiHand.filter(c => c.id !== card.id), "ai")) {
          setCurrentPlayer("player");
        }
      }
    } else {
      setCurrentSuit(card.suit);
      if (player === "player") {
        if (!checkWin(playerHand.filter(c => c.id !== card.id), "player")) {
          setCurrentPlayer("ai");
          setMessage("AI is thinking...");
        }
      } else {
        if (!checkWin(aiHand.filter(c => c.id !== card.id), "ai")) {
          setCurrentPlayer("player");
          setMessage("Your turn!");
        }
      }
    }
  };

  const drawCard = (player: "player" | "ai") => {
    if (deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setCurrentPlayer(player === "player" ? "ai" : "player");
      return;
    }

    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);

    if (player === "player") {
      setPlayerHand(prev => [...prev, card]);
      
      if (isCardPlayable(card)) {
        setMessage("You drew a playable card! You can play it or end turn.");
        // We stay on player turn to let them play it
      } else {
        setMessage("You drew a card, but it's not playable. AI's turn.");
        setCurrentPlayer("ai");
      }
    } else {
      setAiHand(prev => [...prev, card]);
      setMessage("AI drew a card.");
      if (!isCardPlayable(card)) {
        setCurrentPlayer("player");
      }
    }
  };

  // --- AI Logic ---

  useEffect(() => {
    if (currentPlayer === "ai" && gameState === "playing") {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(isCardPlayable);
        
        if (playableCards.length > 0) {
          // Prioritize non-8s first to save them
          const nonEight = playableCards.find(c => c.rank !== "8");
          const cardToPlay = nonEight || playableCards[0];
          playCard(cardToPlay, "ai");
        } else {
          drawCard("ai");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, aiHand, isCardPlayable]);

  // --- UI Handlers ---

  const handlePlayerPlay = (card: Card) => {
    if (currentPlayer !== "player" || gameState !== "playing") return;
    if (isCardPlayable(card)) {
      playCard(card, "player");
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    setCurrentSuit(suit);
    setGameState("playing");
    setCurrentPlayer("ai");
    setMessage(`You chose ${suit}. AI's turn.`);
  };

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-black font-black text-xl">8</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Crazy Sisters' Eights</h1>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-mono">{aiHand.length} cards</span>
           </div>
           <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono">{playerHand.length} cards</span>
           </div>
           <button 
             onClick={initGame}
             className="p-2 hover:bg-white/10 rounded-full transition-colors"
             title="Restart Game"
           >
             <RotateCcw className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4 gap-8">
        
        {/* AI Hand */}
        <div className="flex justify-center -space-x-12 sm:-space-x-16 opacity-80 scale-90 sm:scale-100">
          <AnimatePresence>
            {aiHand.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CardView isFaceUp={false} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Center Area: Deck & Discard */}
        <div className="flex items-center gap-8 sm:gap-16">
          {/* Draw Pile */}
          <div className="relative group">
            <div className={`absolute -inset-2 bg-yellow-400/20 rounded-2xl blur-xl transition-opacity ${mustDraw ? "opacity-100 animate-pulse" : "opacity-0 group-hover:opacity-100"}`} />
            <div className="relative">
              {deck.length > 0 ? (
                <CardView 
                  isFaceUp={false} 
                  onClick={() => currentPlayer === "player" && gameState === "playing" && drawCard("player")}
                  className={mustDraw ? "ring-4 ring-yellow-400 animate-bounce-subtle" : (currentPlayer === "player" && gameState === "playing" ? "ring-2 ring-white/50" : "")}
                />
              ) : (
                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-white/20 text-xs uppercase font-bold">Empty</span>
                </div>
              )}
              {deck.length > 0 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/40 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">
                  {deck.length} Left
                </div>
              )}
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
             <AnimatePresence mode="popLayout">
               {discardPile.map((card, i) => (
                 i === discardPile.length - 1 && (
                   <motion.div
                     key={card.id}
                     initial={{ x: -100, rotate: -45, opacity: 0 }}
                     animate={{ x: 0, rotate: 0, opacity: 1 }}
                     className="relative z-10"
                   >
                     <CardView card={card} isFaceUp={true} />
                     {/* Current Suit Indicator if 8 was played */}
                     {card.rank === "8" && currentSuit && (
                        <div className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-yellow-400">
                           <span className={`text-2xl ${SUIT_COLORS[currentSuit]}`}>
                             {SUIT_SYMBOLS[currentSuit]}
                           </span>
                        </div>
                     )}
                   </motion.div>
                 )
               ))}
             </AnimatePresence>
             <div className="absolute top-1 left-1 -z-10 w-20 h-28 sm:w-24 sm:h-36 bg-black/20 rounded-xl" />
          </div>
        </div>

        {/* Status Message */}
        <div className="h-12 flex items-center justify-center">
          <motion.p 
            key={message}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-lg font-medium text-emerald-100/80 text-center px-4"
          >
            {message}
          </motion.p>
        </div>

        {/* Player Hand */}
        <div className="w-full max-w-5xl px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CardView 
                    card={card} 
                    isFaceUp={true} 
                    isPlayable={currentPlayer === "player" && gameState === "playing" && isCardPlayable(card)}
                    onClick={() => handlePlayerPlay(card)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {gameState === "start" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                <span className="text-black font-black text-4xl">8</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Crazy Eights</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Match the suit or rank of the top card. 8s are wild and can be played anytime to change the suit. First to empty their hand wins!
              </p>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                Start Game
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {gameState === "choosingSuit" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Pick a New Suit</h2>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit)}
                    className={`
                      p-6 rounded-2xl border-2 border-white/5 hover:border-white/20 transition-all
                      flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10
                    `}
                  >
                    <span className={`text-4xl ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</span>
                    <span className="text-xs uppercase font-bold tracking-widest opacity-60">{suit}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === "gameOver" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${winner === "player" ? "bg-emerald-500" : "bg-red-500"}`}>
                <Trophy className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-4xl font-bold mb-2">
                {winner === "player" ? "Victory!" : "Defeat!"}
              </h2>
              <p className="text-slate-400 mb-8">
                {winner === "player" ? "You've cleared all your cards. Well played!" : "The AI beat you this time. Try again?"}
              </p>
              <button 
                onClick={initGame}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Controls */}
      <footer className="p-4 flex items-center justify-center gap-4 bg-black/10">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-100/40 uppercase tracking-tighter">
          <Info className="w-3 h-3" />
          <span>Tap a card to play • Tap deck to draw</span>
        </div>
      </footer>
    </div>
  );
}
