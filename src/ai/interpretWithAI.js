// Simple helper that tries to use an AI API (OpenAI-compatible) to
// normalize a user formula into a JS-safe expression in terms of x.
// If no API key is configured, it falls back to the original input.

export async function interpretWithAI(rawFormula) {
  const xaiKey = import.meta?.env?.VITE_XAI_API_KEY;
  const openaiKey = import.meta?.env?.VITE_OPENAI_API_KEY;

  if (!xaiKey && !openaiKey) {
    return { expression: rawFormula, usedAI: false, note: 'Sem chave de IA configurada. Usando expressão original.' };
  }

  const systemPrompt = [
    'Você é um conversor de fórmulas matemáticas para expressões JavaScript seguras para avaliação com mathjs.',
    'Regras:',
    '- Use a variável x como variável independente.',
    '- Use funções de mathjs (sin, cos, tan, log, exp, sqrt, abs, pow, etc.).',
    '- Converta ^ para pow(a,b) quando necessário.',
    '- Nunca inclua nada além da expressão final. Sem texto extra.',
    '- Exemplos: x^2 + 3x -> (pow(x,2) + 3*x),   sen(x) -> sin(x),   ln(x) -> log(x)'
  ].join('\n');

  const userPrompt = `Converta para uma expressão JS/mathjs segura, apenas retornando a expressão final:\n${rawFormula}`;

  try {
    if (xaiKey) {
      // xAI (Grok) - OpenAI-compatible Chat Completions
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0
        })
      });

      if (!response.ok) {
        return { expression: rawFormula, usedAI: false, note: 'Falha na chamada ao Grok. Usando expressão original.' };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim?.() ?? '';
      const cleaned = text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
      if (!cleaned) {
        return { expression: rawFormula, usedAI: false, note: 'Resposta do Grok vazia. Usando expressão original.' };
      }
      return { expression: cleaned, usedAI: true };
    }

    // OpenAI Responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      return { expression: rawFormula, usedAI: false, note: 'Falha na chamada de IA. Usando expressão original.' };
    }

    const data = await response.json();
    const text = data?.output?.[0]?.content?.[0]?.text?.trim?.() ?? '';
    const cleaned = text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
    if (!cleaned) {
      return { expression: rawFormula, usedAI: false, note: 'Resposta de IA vazia. Usando expressão original.' };
    }
    return { expression: cleaned, usedAI: true };
  } catch (err) {
    return { expression: rawFormula, usedAI: false, note: 'Erro ao usar IA. Usando expressão original.' };
  }
}


