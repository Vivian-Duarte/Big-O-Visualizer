import { Visualizer, sleep } from "./visualizer.js";
import { ALGORITHMS } from "./algorithms.js";

const $ = (id) => document.getElementById(id);

const els = {
  stage: $("bars"),
  algorithm: $("algorithm"),
  size: $("size"),
  sizeOut: $("size-out"),
  speed: $("speed"),
  play: $("play"),
  step: $("step"),
  restart: $("restart"),
  shuffle: $("shuffle"),
  comparisons: $("comparisons"),
  moves: $("moves"),
  status: $("status"),
  statusText: $("status-text"),
  speedOut: $("speed-out"),
  info: {
    name: $("info-name"),
    description: $("info-description"),
    best: $("info-best"),
    average: $("info-average"),
    worst: $("info-worst"),
    space: $("info-space"),
    stable: $("info-stable"),
  },
};

const viz = new Visualizer(els.stage);

/**
 * Estado da aplicação:
 *   mode: "idle" (parado) | "running" | "paused" | "done"
 *   generator: o algoritmo em execução (null se ainda não começou)
 *   runId: identifica a "rodada" atual; serve para cancelar loops antigos
 */
const state = {
  mode: "idle",
  generator: null,
  runId: 0,
  comparisons: 0,
  moves: 0,
};

/* ---------- Velocidade ---------- */

/**
 * Converte o slider (1 a 100) em um intervalo de tempo entre passos.
 * Nas velocidades mais altas, vários passos são processados por vez,
 * porque o navegador não consegue esperar menos de ~4 ms entre eles.
 */
function timing(speed) {
  const t = speed / 100;
  const delay = 500 * Math.pow(1 / 125, t); // de 500 ms até 4 ms
  const batch = 1 + Math.floor(Math.max(0, t - 0.8) * 50); // até 11 passos
  return { delay, batch };
}

/* ---------- Interface ---------- */

function updateCounters() {
  els.comparisons.textContent = state.comparisons.toLocaleString("pt-BR");
  els.moves.textContent = state.moves.toLocaleString("pt-BR");
}

function updateButtons() {
  const labels = {
    idle: ["i-play", "Iniciar"],
    running: ["i-pause", "Pausar"],
    paused: ["i-play", "Continuar"],
    done: ["i-replay", "Ordenar de novo"],
  };
  const [icon, text] = labels[state.mode];
  els.play.innerHTML = `<svg aria-hidden="true"><use href="#${icon}"/></svg>${text}`;
  els.step.disabled = state.mode === "done";
}

function showAlgorithmInfo() {
  const algo = ALGORITHMS[els.algorithm.value];
  els.info.name.textContent = algo.name;
  els.info.description.textContent = algo.description;
  els.info.best.textContent = algo.best;
  els.info.average.textContent = algo.average;
  els.info.worst.textContent = algo.worst;
  els.info.space.textContent = algo.space;
  els.info.stable.textContent = algo.stable;
}

function setStatus(text, { done = false } = {}) {
  els.statusText.textContent = text;
  els.status.classList.toggle("is-done", done);
}

/** Atualiza o preenchimento do slider e o valor mostrado ao lado do rótulo. */
function syncRange(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--pct", `${pct}%`);
}

function syncSpeedOut() {
  els.speedOut.textContent = `${(Number(els.speed.value) / 20).toFixed(1).replace(".", ",")}×`;
}

/* ---------- Controle da execução ---------- */

/** Volta ao estado inicial. Se `newArray` for true, gera novas barras. */
function reset({ newArray = false } = {}) {
  state.runId++; // cancela qualquer loop em andamento
  state.mode = "idle";
  state.generator = null;
  state.comparisons = 0;
  state.moves = 0;

  if (newArray) viz.generate(Number(els.size.value));
  else viz.restore();

  updateCounters();
  updateButtons();
  setStatus("Pronto para começar.");
}

/** Executa um passo do algoritmo. Retorna false quando ele termina. */
function advance() {
  if (!state.generator) {
    state.generator = ALGORITHMS[els.algorithm.value].run(viz.array);
  }

  const { value, done } = state.generator.next();
  if (done) {
    finish();
    return false;
  }

  if (value.type === "compare") state.comparisons++;
  if (value.type === "swap" || value.type === "overwrite") state.moves++;

  viz.apply(value);
  return true;
}

async function finish() {
  state.mode = "done";
  updateCounters();
  updateButtons();

  const name = ALGORITHMS[els.algorithm.value].name;
  setStatus(
    `${name} terminou: ${state.comparisons.toLocaleString("pt-BR")} comparações e ` +
      `${state.moves.toLocaleString("pt-BR")} trocas ou escritas.`,
    { done: true }
  );

  const runId = state.runId;
  await viz.sweep(() => runId === state.runId);
}

async function loop(runId) {
  while (state.mode === "running" && runId === state.runId) {
    const { delay, batch } = timing(Number(els.speed.value));

    for (let i = 0; i < batch; i++) {
      if (!advance()) return;
    }
    updateCounters();
    await sleep(delay);
  }
}

function start() {
  state.mode = "running";
  updateButtons();
  setStatus(`Ordenando com ${ALGORITHMS[els.algorithm.value].name}...`);
  loop(++state.runId);
}

function pause() {
  state.mode = "paused";
  updateButtons();
  setStatus("Pausado.");
}

/* ---------- Eventos ---------- */

els.play.addEventListener("click", () => {
  if (state.mode === "running") {
    pause();
  } else if (state.mode === "done") {
    reset(); // mesma sequência inicial
    start();
  } else {
    start();
  }
});

els.step.addEventListener("click", () => {
  if (state.mode === "running") pause();
  if (state.mode === "idle") state.mode = "paused";
  if (state.mode === "done") return;

  updateButtons();
  setStatus("Executando passo a passo.");
  if (advance()) updateCounters();
});

els.restart.addEventListener("click", () => reset());
els.shuffle.addEventListener("click", () => reset({ newArray: true }));

els.algorithm.addEventListener("change", () => {
  showAlgorithmInfo();
  reset(); // mantém as mesmas barras para comparar algoritmos
});

els.size.addEventListener("input", () => {
  els.sizeOut.textContent = els.size.value;
  syncRange(els.size);
  reset({ newArray: true });
});

els.speed.addEventListener("input", () => {
  syncSpeedOut();
  syncRange(els.speed);
});

/* ---------- Inicialização ---------- */

for (const [key, algo] of Object.entries(ALGORITHMS)) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = algo.name;
  els.algorithm.appendChild(option);
}

els.sizeOut.textContent = els.size.value;
syncRange(els.size);
syncRange(els.speed);
syncSpeedOut();
showAlgorithmInfo();
reset({ newArray: true });
