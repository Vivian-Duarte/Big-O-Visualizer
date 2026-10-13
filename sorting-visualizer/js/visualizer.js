/**
 * VISUALIZADOR
 * Responsável apenas pela parte visual: criar as barras, atualizar alturas
 * e aplicar as cores de acordo com os eventos emitidos pelos algoritmos.
 */

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Visualizer {
  constructor(container) {
    this.container = container;
    this.array = []; // estado atual (os algoritmos modificam este array)
    this.initial = []; // cópia da ordem inicial, para reiniciar
    this.bars = []; // elementos <div> de cada barra
    this.active = []; // índices com destaque temporário
  }

  /** Cria um novo array embaralhado com valores de 1 até `size`. */
  generate(size) {
    const values = Array.from({ length: size }, (_, i) => i + 1);
    // Fisher-Yates: embaralhamento sem viés
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    this.array = values;
    this.initial = [...values];
    this.build();
  }

  /** Volta para a mesma sequência inicial (útil para comparar algoritmos). */
  restore() {
    this.array = [...this.initial];
    this.build();
  }

  build() {
    const size = this.array.length;
    this.container.innerHTML = "";
    this.container.style.setProperty(
      "--gap",
      size > 60 ? "1px" : size > 30 ? "2px" : "4px"
    );

    this.bars = this.array.map((value) => {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = this.heightOf(value);
      this.container.appendChild(bar);
      return bar;
    });
    this.active = [];
  }

  heightOf(value) {
    return `${(value / this.array.length) * 100}%`;
  }

  refreshHeight(index) {
    this.bars[index].style.height = this.heightOf(this.array[index]);
  }

  /** Interpreta um evento do algoritmo e atualiza a tela. */
  apply({ type, indices }) {
    // remove os destaques temporários do passo anterior
    for (const i of this.active) {
      this.bars[i].classList.remove("compare", "swap", "write");
    }
    this.active = [];

    for (const i of indices) {
      const classes = this.bars[i].classList;
      switch (type) {
        case "compare":
          classes.add("compare");
          this.active.push(i);
          break;
        case "swap":
          this.refreshHeight(i);
          classes.add("swap");
          this.active.push(i);
          break;
        case "overwrite":
          this.refreshHeight(i);
          classes.add("write");
          this.active.push(i);
          break;
        case "pivot":
          classes.add("pivot");
          break;
        case "unpivot":
          classes.remove("pivot");
          break;
        case "sorted":
          classes.add("sorted");
          break;
      }
    }
  }

  /** Animação final: pinta todas as barras de verde, da esquerda para a direita. */
  async sweep(isStillActive) {
    for (const i of this.active) {
      this.bars[i].classList.remove("compare", "swap", "write");
    }
    this.active = [];

    const pause = Math.max(4, 600 / this.bars.length);
    for (const bar of this.bars) {
      if (!isStillActive()) return;
      bar.classList.remove("pivot");
      bar.classList.add("sorted");
      await sleep(pause);
    }
  }
}
