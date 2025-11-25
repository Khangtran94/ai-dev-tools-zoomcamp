import React, { useEffect, useRef, useState } from "react";

// Instructions to run this Snake game inside your Week_1 folder:
// 1. Navigate to your Week_1 folder:
//    cd /workspaces/ai-dev-tools-zoomcamp/AI_Dev_Khang_HW/Week_1
// 2. Initialize a Vite React project here (overwrite contents if empty):
//    npm create vite@latest . -- --template react-ts
//    - Select React + TypeScript
//    - Say No to experimental options
//    - Say Yes to install dependencies
// 3. Copy this SnakeGame.jsx into Week_1/src/
// 4. Replace App.tsx in Week_1/src/ with:
//      import SnakeGame from './SnakeGame';
//      function App() { return <SnakeGame />; }
//      export default App;
// 5. Run the project:
//    npm run dev
// This way, the Snake game runs inside Week_1 folder.

export default function SnakeGame() {
  // Config
  const CANVAS_SIZE = 480;
  const CELL_SIZE = 16;
  const COLS = Math.floor(CANVAS_SIZE / CELL_SIZE);
  const ROWS = COLS;
  const INITIAL_SPEED = 8;

  const snakeRef = useRef([]);
  const dirRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 0, y: 0 });
  const runningRef = useRef(false);

  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);

  function randomCell() {
    return { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  }

  function placeFood() {
    let pos;
    const snake = snakeRef.current;
    do {
      pos = randomCell();
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }

  function resetGame() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snakeRef.current = [
      { x: midX - 2, y: midY },
      { x: midX - 1, y: midY },
      { x: midX, y: midY },
    ];
    dirRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    placeFood();
  }

  useEffect(() => {
    function handleKey(e) {
      if (gameOver) return;
      const key = e.key;
      const d = dirRef.current;
      if ((key === "ArrowUp" || key === "w") && d.y !== 1) dirRef.current = { x: 0, y: -1 };
      else if ((key === "ArrowDown" || key === "s") && d.y !== -1) dirRef.current = { x: 0, y: 1 };
      else if ((key === "ArrowLeft" || key === "a") && d.x !== 1) dirRef.current = { x: -1, y: 0 };
      else if ((key === "ArrowRight" || key === "d") && d.x !== -1) dirRef.current = { x: 1, y: 0 };
      else if (key === " ") toggleRunning();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameOver]);

  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    const tickMs = 1000 / speed;
    const id = setInterval(() => { if (runningRef.current) step(); }, tickMs);
    return () => clearInterval(id);
  }, [running, speed]);

  useEffect(() => { draw(); }, [score, gameOver]);
  useEffect(() => { resetGame(); draw(); }, []);

  function toggleRunning() { if (!gameOver) setRunning(r => { runningRef.current = !r; return !r; }); }

  function step() {
    const snake = snakeRef.current.slice();
    const dir = dirRef.current;
    const head = snake[snake.length - 1];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS || snake.some(s => s.x === newHead.x && s.y === newHead.y)) { endGame(); return; }
    snake.push(newHead);
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) { setScore(s => s + 1); placeFood(); } else snake.shift();
    snakeRef.current = snake;
    draw();
  }

  function endGame() { setRunning(false); runningRef.current = false; setGameOver(true); }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const scale = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * scale; canvas.height = CANVAS_SIZE * scale;
    canvas.style.width = `${CANVAS_SIZE}px`; canvas.style.height = `${CANVAS_SIZE}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) { const x = i * CELL_SIZE; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_SIZE); ctx.stroke(); }
    for (let j = 0; j <= ROWS; j++) { const y = j * CELL_SIZE; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_SIZE, y); ctx.stroke(); }
    drawCell(ctx, foodRef.current.x, foodRef.current.y, "#ef4444");
    snakeRef.current.forEach((s, i) => drawCell(ctx, s.x, s.y, i === snakeRef.current.length - 1 ? "#10b981" : "#34d399"));
  }

  function drawCell(ctx, cx, cy, color) { ctx.fillStyle = color; ctx.fillRect(cx * CELL_SIZE + 1, cy * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2); }
  function changeDir(newDir) { const d = dirRef.current; if (d.x + newDir.x === 0 && d.y + newDir.y === 0) return; dirRef.current = newDir; }
  function handleSpeedChange(e) { setSpeed(Number(e.target.value)); }

  return (
    <div className="p-4 min-h-screen flex flex-col items-center justify-start gap-4 bg-gradient-to-br from-slate-800 to-slate-900 text-slate-200">
      <h1 className="text-2xl font-semibold">Snake — React (single-file)</h1>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="rounded-2xl shadow-2xl p-4 bg-slate-800">
          <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="rounded" />
        </div>
        <div className="flex flex-col items-stretch gap-3">
          <div className="text-lg">Score: <span className="font-bold">{score}</span></div>
          <div className="flex gap-2">
            <button onClick={() => { if (gameOver) { resetGame(); setRunning(true); runningRef.current = true; } else toggleRunning(); }} className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 font-medium">{gameOver ? "Restart" : running ? "Pause" : "Start"}</button>
            <button onClick={() => { resetGame(); setRunning(false); runningRef.current = false; }} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200">Reset</button>
            <button onClick={() => { setScore(0); resetGame(); setGameOver(false); }} className="px-3 py-2 rounded-lg bg-yellow-500 text-slate-900">Quick New</button>
          </div>
          <label className="text-sm mt-2">Speed: {speed} cells / sec</label>
          <input type="range" min={4} max={20} value={speed} onChange={handleSpeedChange} className="w-48" />
          <div className="mt-2">
            <div className="text-sm mb-1">Controls</div>
            <div className="flex gap-2">
              <button onClick={() => changeDir({ x: 0, y: -1 })} className="px-3 py-2 rounded bg-slate-700">Up</button>
              <button onClick={() => changeDir({ x: -1, y: 0 })} className="px-3 py-2 rounded bg-slate-700">Left</button>
              <button onClick={() => changeDir({ x: 1, y: 0 })} className="px-3 py-2 rounded bg-slate-700">Right</button>
              <button onClick={() => changeDir({ x: 0, y: 1 })} className="px-3 py-2 rounded bg-slate-700">Down</button>
            </div>
          </div>
          {gameOver && <div className="mt-3 text-red-400">Game Over — your score: {score}</div>}
          <div className="mt-2 text-xs text-slate-400">Use arrow keys or WASD. Space toggles start/pause.</div>
        </div>
      </div>
      <div className="mt-6 text-sm text-slate-400 max-w-2xl text-center">This is a single-file React component using Tailwind classes. If you don't have Tailwind in your project, either set it up or remove the className values and apply your own styles.</div>
    </div>
  );
}
