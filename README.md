# Ordenação, passo a passo

Visualizador de algoritmos de ordenação feito com HTML, CSS e JavaScript puro, sem frameworks nem dependências. Cada algoritmo é animado barra por barra, com contador de comparações e de trocas.

## Algoritmos

| Algoritmo | Melhor caso | Caso médio | Pior caso | Memória extra | Estável |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Sim |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | Não |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | Sim |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Sim |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | Não |

## Recursos

- Escolha do algoritmo, da quantidade de barras (10 a 100) e da velocidade
- Pausar, continuar e avançar **um passo por vez**
- **Reiniciar** com a mesma sequência para comparar algoritmos com os mesmos dados
- Contador de comparações e de trocas ou escritas
- Painel com a complexidade de cada algoritmo
- Respeita a preferência de movimento reduzido do sistema

## Como rodar

O projeto usa módulos ES (`<script type="module">`), e os navegadores bloqueiam módulos quando a página é aberta com um duplo clique (`file://`). Use um servidor local:

```bash
# com Python
python -m http.server 8000

# ou com Node
npx serve
```

Depois abra `http://localhost:8000`. Também funciona com a extensão **Live Server** do VS Code.

## Como funciona

A ideia central é escrever cada algoritmo como um **generator** (`function*`). Em vez de ordenar de uma vez, ele emite um evento a cada passo importante:

```js
function* bubbleSort(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      yield { type: "compare", indices: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { type: "swap", indices: [j, j + 1] };
      }
    }
  }
}
```

O `main.js` pede um evento por vez, o `visualizer.js` desenha o passo, e um `sleep()` entre os passos cria a animação. Assim os algoritmos não sabem nada sobre a tela, e a tela não sabe nada sobre os algoritmos.

```
sorting-visualizer/
├── index.html
├── style.css
└── js/
    ├── algorithms.js   # os algoritmos (generators) e o registro com as informações
    ├── visualizer.js   # desenho das barras e cores
    └── main.js         # controles, loop de animação e contadores
```

## Adicionando um algoritmo

1. Escreva o generator em `js/algorithms.js`, emitindo eventos `compare`, `swap`, `overwrite`, `pivot`, `unpivot` ou `sorted`.
2. Adicione uma entrada no objeto `ALGORITHMS` com nome, descrição e complexidades.

O menu e o painel de informações são montados automaticamente.

## Ideias para evoluir futuramente

- Heap Sort e Shell Sort
- Sons com a Web Audio API (uma nota para cada barra comparada)
- Modo de comparação com dois algoritmos lado a lado
- Escolha entre array aleatório, quase ordenado ou invertido
- Testes automáticos dos algoritmos
