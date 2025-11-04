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
import { interpretWithAI } from './ai/interpretWithAI'
import mathLogo from './assets/math.svg'

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
  const [aiStatus, setAiStatus] = useState('')
  const [aiExpression, setAiExpression] = useState('')
  const [xMin, setXMin] = useState(-10)
  const [xMax, setXMax] = useState(10)
  const [samples, setSamples] = useState(400)
  const [errorMsg, setErrorMsg] = useState('')

  const currentExpression = aiExpression || inputFormula

  const { labels, values } = useMemo(() => {
    const count = Math.max(2, Math.min(2000, Number(samples) || 400))
    const min = Number(xMin)
    const max = Number(xMax)
    const step = (max - min) / (count - 1)
    const xs = []
    const ys = []

    let compiled
    try {
      compiled = math.compile(currentExpression)
    } catch (e) {
      // Fallback: try raw input if AI expression failed to compile
      try {
        compiled = math.compile(inputFormula)
      } catch (e2) {
        return { labels: [], values: [] }
      }
    }

    for (let i = 0; i < count; i++) {
      const x = min + step * i
      let y = NaN
      try {
        y = compiled.evaluate({ x })
      } catch (e) {
        y = NaN
      }
      xs.push(Number(x.toFixed(4)))
      ys.push(Number((Number.isFinite(y) ? y : NaN).toFixed(4)))
    }

    return { labels: xs, values: ys }
  }, [currentExpression, inputFormula, xMin, xMax, samples])

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'f(x)',
        data: values,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        pointRadius: 0,
        borderWidth: 2,
        spanGaps: true,
      }
    ]
  }), [labels, values])

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

  async function handleUseAI() {
    setErrorMsg('')
    setAiStatus('Interpretando com IA...')
    const result = await interpretWithAI(inputFormula)
    if (result.note) {
      setAiStatus(result.note)
    } else {
      setAiStatus(result.usedAI ? 'Interpretação via IA aplicada.' : 'Sem IA, usando expressão original.')
    }
    setAiExpression(result.expression || '')
  }

  function clearAI() {
    setAiExpression('')
    setAiStatus('')
  }

  function validateRange() {
    const min = Number(xMin)
    const max = Number(xMax)
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      setErrorMsg('Intervalo inválido: xMin deve ser menor que xMax')
      return false
    }
    setErrorMsg('')
    return true
  }

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
            xMin
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(e.target.value)}
              onBlur={validateRange}
              className="mv-input"
            />
          </label>
          <label style={{ flex: '1 1 160px' }}>
            xMax
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(e.target.value)}
              onBlur={validateRange}
              className="mv-input"
            />
          </label>
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

        <div className="mv-row mv-actions">
          <button onClick={handleUseAI}>Gerar com IA</button>
          <button onClick={clearAI}>Limpar IA</button>
        </div>

        {aiStatus && (
          <div style={{ fontSize: 12, color: '#555' }}>{aiStatus}</div>
        )}
        {aiExpression && (
          <div style={{ fontSize: 12, color: '#111' }}>Expressão usada: {aiExpression}</div>
        )}

        {errorMsg && (
          <div style={{ color: 'crimson' }}>{errorMsg}</div>
        )}

        <div className="mv-card">
          <Line data={data} options={options} />
        </div>
      </div>

      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
        Página desenvolvida por <strong>Bernardo Moreira</strong> - Aluno da FIAP
      </footer>
    </div>
  )
}

export default App
