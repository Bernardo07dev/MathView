import { useMemo, useState } from 'react'
import './App.css'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { create, all } from 'mathjs'
import mathLogo from './assets/math.svg'
import { integrateExpression } from './utils/integrate'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const math = create(all, {})

function App() {
  const [inputFormula, setInputFormula] = useState('sin(x) + 0.5 * x')
  const [samples, setSamples] = useState(400)
  const [showDerivative, setShowDerivative] = useState(false)
  const [derivedExpression, setDerivedExpression] = useState('')
  const [intA, setIntA] = useState(-1)
  const [intB, setIntB] = useState(1)
  const [intResult, setIntResult] = useState('')

  // Valores fixos para o intervalo
  const xMin = -10
  const xMax = 10
  const currentExpression = inputFormula

  const { labels, values, valuesDerivative } = useMemo(() => {
    const count = Math.max(2, Math.min(2000, Number(samples) || 400))
    const min = Number(xMin)
    const max = Number(xMax)
    const step = (max - min) / (count - 1)
    const xs = []
    const ys = []
    const dys = []

    let compiled
    let compiledDerivative
    try {
      compiled = math.compile(currentExpression)
    } catch (e) {
      // Fallback: try raw input if AI expression failed to compile
      try {
        compiled = math.compile(inputFormula)
      } catch (e2) {
        return { labels: [], values: [], valuesDerivative: [] }
      }
    }

    // Try to compute symbolic derivative if requested
    if (showDerivative) {
      try {
        const node = math.derivative(currentExpression, 'x')
        setDerivedExpression(node.toString())
        compiledDerivative = node.compile()
      } catch (e) {
        // If derivative fails, clear expression and skip plotting derivative
        setDerivedExpression('')
        compiledDerivative = null
      }
    } else {
      setDerivedExpression('')
    }

    for (let i = 0; i < count; i++) {
      const x = min + step * i
      let y = NaN
      let dy = NaN
      try {
        y = compiled.evaluate({ x })
      } catch (e) {
        y = NaN
      }
      if (compiledDerivative) {
        try {
          dy = compiledDerivative.evaluate({ x })
        } catch (e) {
          dy = NaN
        }
      }
      xs.push(Number(x.toFixed(4)))
      ys.push(Number((Number.isFinite(y) ? y : NaN).toFixed(4)))
      if (showDerivative) {
        dys.push(Number((Number.isFinite(dy) ? dy : NaN).toFixed(4)))
      }
    }

    return { labels: xs, values: ys, valuesDerivative: dys }
  }, [currentExpression, inputFormula, samples, showDerivative])

  const data = useMemo(() => {
    const ds = [
      {
        label: 'f(x)',
        data: values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        pointRadius: 0,
        borderWidth: 2,
        spanGaps: true,
      },
    ]
    if (showDerivative && valuesDerivative?.length) {
      ds.push({
        label: "f'(x)",
        data: valuesDerivative,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [6, 4],
        spanGaps: true,
      })
    }
    return { labels, datasets: ds }
  }, [labels, values, valuesDerivative, showDerivative])

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Visualizador de Fórmulas' }
    },
    scales: {
      x: { title: { display: true, text: 'x' }, ticks: { maxTicksLimit: 9 } },
      y: { title: { display: true, text: 'f(x)' }, ticks: { maxTicksLimit: 7 } }
    },
    animation: false,
  }), [])


  return (
    <div className="mv-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <img src={mathLogo} alt="Math logo" width={40} height={40} />
        <h2 style={{ margin: 0 }}>MathView — Gráfico a partir de Fórmula</h2>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
        <label>
          Fórmula (em função de x):
          <input
            value={inputFormula}
            onChange={(e) => setInputFormula(e.target.value)}
            placeholder="ex: sin(x) + 0.5*x ou pow(x,2) + 3*x"
            className="mv-input"
          />
        </label>

        <div className="mv-row">
          <label style={{ flex: '1 1 160px' }}>
            Amostras
            <input
              type="number"
              value={samples}
              onChange={(e) => setSamples(e.target.value)}
              min={10}
              max={2000}
              className="mv-input"
            />
          </label>
        </div>

        {showDerivative && derivedExpression && (
          <div style={{ fontSize: 12, color: '#0f766e' }}>Derivada simbólica: {derivedExpression}</div>
        )}

        <div className="mv-card">
          <Line data={data} options={options} />
        </div>

        <div className="mv-row" style={{ alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showDerivative}
              onChange={(e) => setShowDerivative(e.target.checked)}
            />
            Mostrar derivada f'(x)
          </label>
        </div>

        <div className="mv-row" style={{ alignItems: 'flex-end' }}>
          <label style={{ flex: '1 1 140px' }}>
            Integral de (a)
            <input
              type="number"
              value={intA}
              onChange={(e) => setIntA(e.target.value)}
              className="mv-input"
            />
          </label>
          <label style={{ flex: '1 1 140px' }}>
            até (b)
            <input
              type="number"
              value={intB}
              onChange={(e) => setIntB(e.target.value)}
              className="mv-input"
            />
          </label>
          <div className="mv-actions" style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => {
              try {
                const val = integrateExpression(currentExpression, Number(intA), Number(intB), 1000, math)
                setIntResult(String(Number(val.toFixed(6))))
              } catch (e) {
                setIntResult('Erro ao integrar')
              }
            }}>Calcular integral</button>
          </div>
        </div>
        {intResult !== '' && (
          <div style={{ fontSize: 12, color: '#374151' }}>∫ de {intA} a {intB} f(x) dx = <strong>{intResult}</strong></div>
        )}
      </div>

      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
        Página desenvolvida por <strong>Bernardo Moreira</strong> - Aluno da FIAP
      </footer>
    </div>
  )
}

export default App
