
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'pt-BR';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations: Record<Language, Record<string, string>> = {
  'pt-BR': {
    'nav.menu': 'Menu Principal',
    'nav.contact': 'Contato',
    'footer': '© 2025 Celestial Lab - Kaio Lopes. Todos os direitos reservados.',
    
    // Home
    'home.subtitle': 'Essa é a primeira versão do Celestial Lab. Sinta-se a vontade em compartilhar sua opinião.',
    'home.start': 'Iniciar',
    'sim.em_wave.title': 'Onda Eletromagnética',
    'sim.em_wave.desc': 'Visualização 3D da propagação ortogonal dos campos elétricos e magnéticos.',
    'sim.gas.title': 'Gases Ideais',
    'sim.gas.desc': 'Simule o comportamento de partículas de um gás ideal e visualize a Lei PV=nRT em ação.',
    'sim.lever.title': 'Equilíbrio de Alavanca',
    'sim.lever.desc': 'Adicione pesos e visualize torques para entender o equilíbrio de uma alavanca.',
    'sim.vector.title': 'Campos Vetoriais',
    'sim.vector.desc': 'Visualize campos vetoriais 2D.',
    'sim.faraday.title': 'Lei de Faraday',
    'sim.faraday.desc': 'Indução eletromagnética e Lei de Lenz.',

    // EM Wave
    'em.title': 'Onda Eletromagnética',
    'em.text': 'Uma onda eletromagnética consiste em campos',
    'em.text_e': 'elétricos',
    'em.text_b': 'magnéticos',
    'em.text_end': 'oscilantes e perpendiculares entre si.',
    'em.controls':'INFORMAÇÃO',
    'em.drag': 'Arraste para girar',
    'em.efield': 'Campo Elétrico (E)',
    'em.bfield': 'Campo Magnético (B)',
    'em.freq': 'Frequência',
    'em.amp': 'Amplitude',
    'em.maxwell': 'Equações de Maxwell',
    'em.maxwell_desc': 'A variação do campo elétrico gera um campo magnético e vice-versa, permitindo a propagação da onda no vácuo.',

    // Ideal Gas Simulator
    'gas.title': 'Gases Ideais',
    'gas.hint': 'Ajuste os parâmetros e observe o comportamento das partículas',
    'gas.intro': 'A Lei dos Gases Ideais descreve o comportamento de um gás hipotético em que as partículas não interagem entre si e ocupam volume desprezível. A equação PV = nRT relaciona pressão, volume, quantidade de matéria e temperatura.',
    'gas.formula_desc': 'P = Pressão, V = Volume, n = quantidade de matéria, R = constante, T = Temperatura',
    'gas.temperature': 'Temperatura',
    'gas.volume': 'Volume',
    'gas.particles': 'Partículas',
    'gas.pressure': 'Pressão',
    'gas.readings': 'Leituras em Tempo Real',
    'gas.slow': 'Velocidade baixa',
    'gas.medium': 'Velocidade média',
    'gas.fast': 'Velocidade alta',
    'gas.info_title': 'Conceito Fundamental',
    'gas.info_text': 'Ao aumentar a temperatura, as partículas se movem mais rápido, colidindo com mais frequência e intensidade nas paredes do recipiente, aumentando a pressão. Ao reduzir o volume (comprimir), as partículas ficam mais confinadas, também aumentando a pressão.',
    'gas.controls_label': 'Parâmetros',

    // Lever Equilibrium Simulator
    'lever.title': 'Equilíbrio de Alavanca',
    'lever.hint': 'Arraste os pesos para reposicioná-los na barra',
    'lever.intro': 'Uma alavanca está em equilíbrio quando a soma dos torques horários é igual à soma dos torques anti-horários em relação ao fulcro. Torque (τ) é o produto da força pela distância ao ponto de apoio.',
    'lever.challenge_intro': 'É possível equilibrar uma alavanca utilizando quantidades diferentes de moedas em cada lado? Descubra posicionando as moedas na barra!',
    'lever.formula_desc': 'τ = Torque, F = Força (Peso), d = distância ao fulcro',
    'lever.mode_free': 'Livre',
    'lever.challenge_a_tab': 'Desafio A',
    'lever.challenge_b_tab': 'Desafio B',
    'lever.challenge_a_short': 'Desafio A — Moedas de 10¢',
    'lever.challenge_b_short': 'Desafio B — Moedas de 50¢',
    'lever.challenge_a_title': 'Desafio A — Moedas de 10 centavos',
    'lever.challenge_b_title': 'Desafio B — Moedas de 50 centavos',
    'lever.challenge_question': 'É possível equilibrar a alavanca utilizando quantidades diferentes de moedas em cada lado? Adicione moedas e arraste-as para encontrar o equilíbrio!',
    'lever.coin_10_info': 'Moeda de 10 centavos (~4.8g cada)',
    'lever.coin_50_info': 'Moeda de 50 centavos (~7.81g cada)',
    'lever.add_coins': 'Adicionar Moedas',
    'lever.coin_singular': 'moeda',
    'lever.coin_plural': 'moedas',
    'lever.challenge_success': 'Parabéns! Desafio concluído!',
    'lever.challenge_success_desc': 'Você equilibrou a alavanca com quantidades diferentes de moedas em cada lado.',
    'lever.add_weight': 'Adicionar Peso',
    'lever.add_left': 'Esquerda',
    'lever.add_right': 'Direita',
    'lever.clear': 'Remover Todos',
    'lever.weights_list': 'Itens na Barra',
    'lever.left': 'Esq.',
    'lever.right': 'Dir.',
    'lever.torques': 'Análise de Torques',
    'lever.torque_left': 'Torque Esquerdo',
    'lever.torque_right': 'Torque Direito',
    'lever.net_torque': 'Torque Resultante',
    'lever.balanced': 'Equilibrado',
    'lever.unbalanced': 'Desequilibrado',

    // Gradient
    'grad.title': 'Gradiente',
    'grad.desc': 'Visualize o campo vetorial do gradiente de uma função escalar f(x,y) e entenda como ele aponta para a direção de maior crescimento da função.',
    'grad.intro': 'O gradiente de uma função escalar f(x,y) é um campo vetorial que aponta na direção de maior crescimento da função.',
    'grad.surface': 'Superfície f(x,y)',
    'grad.vector': 'Vetor Gradiente ∇f',
    'grad.magnitude_label': 'Magnitude |∇f|',
    'grad.partials': 'Derivadas Parciais',
    'grad.hill': 'Montanha',
    'grad.bowl': 'Paraboloide',
    'grad.saddle': 'Sela',
    'grad.slope': 'Plano',
    'grad.cone': 'Cone ',
    'grad.formula_label': 'Função Escalar f(x,y)',
    'grad.error': 'Erro na fórmula',
    'grad.analysis_at': 'Análise no ponto P',
    'grad.pos_x': 'Posição X',
    'grad.pos_y': 'Posição Y',

    // Vector Field
    'vec.title': 'Campos Vetoriais',
    'vec.vx': 'Componente Fx',
    'vec.vy': 'Componente Fy',
    'vec.examples': 'Exemplos Prontos',
    'vec.time': 'Tempo',
    'vec.error': 'Expressão Inválida',
    'vec.text': 'Visualize campos vetoriais 2D',

    // Faraday Law
    'faraday.title': 'Lei de Faraday',
    'faraday.text': 'A indução eletromagnética ocorre quando o fluxo magnético através de uma espira muda no tempo.',
    'faraday.interaction': 'Interação',
    'faraday.drag': 'Arraste o imã para induzir corrente.',
    'faraday.indicator': 'Indicador',
    'faraday.bulb': 'Lâmpada',
    'faraday.voltmeter': 'Voltímetro',
    'faraday.size': 'Tamanho da Espira',
    'faraday.show_lines': 'Linhas de Campo',
    'faraday.lenz': 'Lei de Lenz',
    'faraday.lenz_desc': 'A corrente opõe-se à mudança.',
    'faraday.flux': 'Fluxo (Φ)',
    'faraday.area': 'B · A · cos(θ)',
    'faraday.status': 'Status da Indução',
    'faraday.current': 'Corrente Induzida',
    'faraday.cw': 'Sentido Horário',
    'faraday.ccw': 'Sentido Anti-horário',

    // Gauss (kept for reference in case GradientSim uses it)
    'gauss.zoom': 'Scroll para zoom | Arraste para girar',

    // Contact
    'contact.title': 'ENTRE EM CONTATO',
    'contact.desc': 'Tem alguma dúvida, sugestão ou feedback sobre as simulações? Ficarei feliz em ouvir você.',
    'contact.email_label': 'E-mail para contato',
    'contact.copy': 'Copiar E-mail',
    'contact.copied': 'Copiado!',
    'contact.send': 'Enviar agora'
  }
};

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt-BR');
  const t = (key: string) => translations[language][key] || key;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};