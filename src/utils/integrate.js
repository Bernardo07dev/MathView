// Calcula a integral definida de uma expressão em função de x
// usando a Regra de Simpson composta.
// expressionString: string em termos de x (ex: "sin(x)+x")
// a, b: limites de integração (números)
// n: número de subintervalos (par). Quanto maior, mais preciso.
// math: instância do mathjs (opcional). Se não passada, importará localmente.

import { create, all } from 'mathjs'

export function integrateExpression(expressionString, a, b, n = 1000, mathInstance) {
  const math = mathInstance || create(all, {})

  const lower = Number(a)
  const upper = Number(b)
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    throw new Error('Limites de integração inválidos')
  }
  if (lower === upper) return 0

  // n precisa ser par para Simpson
  let segments = Math.max(2, Math.abs(Number(n) || 1000))
  if (segments % 2 !== 0) segments += 1

  let compiled
  try {
    compiled = math.compile(expressionString)
  } catch (e) {
    throw new Error('Expressão inválida para integração')
  }

  const h = (upper - lower) / segments
  let sum = 0

  function f(x) {
    try {
      const y = compiled.evaluate({ x })
      return Number.isFinite(y) ? y : NaN
    } catch {
      return NaN
    }
  }

  let fa = f(lower)
  let fb = f(upper)
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) {
    throw new Error('A função não é finita nos limites de integração')
  }

  sum = fa + fb
  // termos internos
  for (let i = 1; i < segments; i++) {
    const x = lower + i * h
    const fx = f(x)
    if (!Number.isFinite(fx)) continue
    // peso 4 para ímpares, 2 para pares
    sum += (i % 2 === 1 ? 4 : 2) * fx
  }

  const result = (h / 3) * sum
  return result
}


