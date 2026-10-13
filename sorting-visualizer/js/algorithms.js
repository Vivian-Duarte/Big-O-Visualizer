/**
 * ALGORITMOS DE ORDENAÇÃO
 *
 * Cada algoritmo é um *generator* (function*). Em vez de apenas ordenar o
 * array e terminar, ele "emite" (yield) um evento a cada passo importante.
 * Quem consome o generator (main.js) pede um evento por vez, desenha o passo
 * na tela e espera alguns milissegundos. 
 *
 * Tipos de evento:
 *   compare    -> dois elementos estão sendo comparados
 *   swap       -> dois elementos trocaram de lugar
 *   overwrite  -> uma posição recebeu um novo valor (usado no Merge Sort)
 *   pivot      -> marca a barra que serve de pivô (Quick Sort)
 *   unpivot    -> remove a marca de pivô
 *   sorted     -> a posição já está na sua posição final
 *
 * Os algoritmos modificam o array recebido diretamente (in-place),
 * e o visualizador lê esse mesmo array para saber a altura de cada barra.
 */

const event = (type) => (...indices) => ({ type, indices });
const compare = event("compare");
const swap = event("swap");
const overwrite = event("overwrite");
const pivot = event("pivot");
const unpivot = event("unpivot");
const sorted = event("sorted");

/* ---------- Bubble Sort ---------- */
function* bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield compare(j, j + 1);
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        yield swap(j, j + 1);
      }
    }
    yield sorted(n - i - 1);
    if (!swapped) return; // nenhuma troca: já está ordenado
  }
}

/* ---------- Selection Sort ---------- */
function* selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      yield compare(min, j);
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      yield swap(i, min);
    }
    yield sorted(i);
  }
  yield sorted(n - 1);
}

/* ---------- Insertion Sort ---------- */
function* insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0) {
      yield compare(j - 1, j);
      if (arr[j - 1] > arr[j]) {
        [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
        yield swap(j - 1, j);
        j--;
      } else {
        break;
      }
    }
  }
}

/* ---------- Merge Sort ---------- */
function* mergeSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return;
  const mid = Math.floor((lo + hi) / 2);
  yield* mergeSort(arr, lo, mid); // yield* delega para a chamada recursiva
  yield* mergeSort(arr, mid + 1, hi);
  yield* merge(arr, lo, mid, hi);
}

function* merge(arr, lo, mid, hi) {
  const left = arr.slice(lo, mid + 1);
  const right = arr.slice(mid + 1, hi + 1);
  let i = 0;
  let j = 0;
  let k = lo;

  while (i < left.length && j < right.length) {
    yield compare(lo + i, mid + 1 + j);
    arr[k] = left[i] <= right[j] ? left[i++] : right[j++];
    yield overwrite(k++);
  }
  while (i < left.length) {
    arr[k] = left[i++];
    yield overwrite(k++);
  }
  while (j < right.length) {
    arr[k] = right[j++];
    yield overwrite(k++);
  }
}

/* ---------- Quick Sort (partição de Lomuto) ---------- */
function* quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo > hi) return;
  if (lo === hi) {
    yield sorted(lo);
    return;
  }
  const p = yield* partition(arr, lo, hi);
  yield sorted(p);
  yield* quickSort(arr, lo, p - 1);
  yield* quickSort(arr, p + 1, hi);
}

function* partition(arr, lo, hi) {
  const pivotValue = arr[hi];
  yield pivot(hi);

  let i = lo; // fronteira dos elementos menores que o pivô
  for (let j = lo; j < hi; j++) {
    yield compare(j, hi);
    if (arr[j] < pivotValue) {
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield swap(i, j);
      }
      i++;
    }
  }
  if (i !== hi) {
    [arr[i], arr[hi]] = [arr[hi], arr[i]];
    yield swap(i, hi);
  }
  yield unpivot(hi);
  return i; // posição final do pivô
}

/**
 * REGISTRO DE ALGORITMOS
 * Para adicionar um novo algoritmo basta escrever o generator acima
 * e incluir uma entrada aqui: o menu e o painel de informações
 * são montados automaticamente a partir deste objeto.
 */
export const ALGORITHMS = {
  bubble: {
    name: "Bubble Sort",
    run: bubbleSort,
    description:
      "Compara pares de vizinhos e troca os que estão fora de ordem. A cada rodada, o maior elemento restante sobe até o fim.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "Sim",
  },
  selection: {
    name: "Selection Sort",
    run: selectionSort,
    description:
      "Procura o menor elemento da parte desordenada e o coloca na próxima posição, uma barra de cada vez.",
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "Não",
  },
  insertion: {
    name: "Insertion Sort",
    run: insertionSort,
    description:
      "Pega um elemento por vez e o desliza para trás até achar o seu lugar, como quem ordena cartas na mão.",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "Sim",
  },
  merge: {
    name: "Merge Sort",
    run: mergeSort,
    description:
      "Divide o array ao meio, ordena cada metade e intercala os resultados. As barras vermelhas mostram valores sendo escritos na posição.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
    stable: "Sim",
  },
  quick: {
    name: "Quick Sort",
    run: quickSort,
    description:
      "Escolhe um pivô (barra roxa), joga os menores para a esquerda e os maiores para a direita, e repete em cada lado.",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
    stable: "Não",
  },
};
