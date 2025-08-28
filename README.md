# Link in Bio - Greger

Um site link-in-bio moderno e acessível, desenvolvido com HTML, Tailwind CSS e JavaScript vanilla.

## 🌟 Visão Geral

Este projeto é uma página pessoal estilo "link in bio" que serve como hub central para apresentar projetos, links importantes e informações de contato. O site foi construído com foco em performance, acessibilidade e experiência do usuário.

🔗 **Demo ao vivo**: [link-in-bio-greger.vercel.app](https://link-in-bio-greger.vercel.app)

## 🛠️ Stack Tecnológica

- **HTML5** - Estrutura semântica
- **Tailwind CSS** (via CDN) - Estilização utilitária
- **JavaScript Vanilla** - Funcionalidades interativas
- **Vercel** - Deploy e hospedagem

## ✨ Features

### 🎨 Design e UX
- **Dark Mode** - Respeita preferência do sistema + toggle manual com persistência
- **Design Responsivo** - Otimizado para todos os dispositivos
- **Animações Suaves** - Transições e micro-interações polidas
- **Tipografia Moderna** - Google Fonts (Inter + Manrope) com otimizações

### 🚀 Funcionalidades
- **Hero Section** - Apresentação pessoal com CTAs
- **Links Principais** - GitHub, LinkedIn, Portfolio, Email
- **Projetos Dinâmicos** - Carregamento via JSON com estados de loading/error/empty
- **Sistema de Filtros** - Chips de tags com acessibilidade completa
- **Copiar Email** - Funcionalidade com toast de confirmação
- **Smooth Scrolling** - Navegação suave entre seções

### ♿ Acessibilidade
- **Navegação por Teclado** - Ordem de tabulação correta
- **Screen Readers** - ARIA labels, roles e propriedades
- **Contraste AA** - Cores que atendem padrões WCAG
- **Focus Management** - Indicadores visuais claros
- **Skip Links** - "Pular para conteúdo principal"
- **Semantic HTML** - Estrutura semântica apropriada

### ⚡ Performance
- **Lighthouse Score ≥95** - Performance, Acessibilidade, Melhores Práticas, SEO
- **Lazy Loading** - Imagens carregadas sob demanda
- **Font Optimization** - Preconnect, display=swap, fallback stacks
- **Cache Headers** - Configuração otimizada no Vercel
- **Minimal Bundle** - Sem frameworks pesados

## 🏃‍♂️ Como Rodar Localmente

### Opção 1: Servidor Local Simples
```bash
# Clone o repositório
git clone https://github.com/G-Reg04/link-in-bio-greger.git
cd link-in-bio-greger

# Sirva os arquivos (escolha uma opção)
npx serve .
# ou
python -m http.server 8000
# ou use Live Server no VS Code
```

### Opção 2: Live Server (VS Code)
1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito no `index.html`
3. Selecione "Open with Live Server"

Acesse `http://localhost:3000` (ou porta indicada)

## 🚀 Deploy na Vercel

Este projeto está configurado para deploy automático na Vercel como site estático.

### Deploy Manual

1. **Via CLI da Vercel**:
```bash
npm i -g vercel
vercel
```

2. **Via Dashboard da Vercel**:
   - Conecte seu repositório GitHub
   - Framework Preset: **Other**
   - Build Command: (deixe vazio)
   - Output Directory: **/** (root)
   - Install Command: (deixe vazio)

### Configuração de Deploy

O arquivo `vercel.json` inclui:
- **Cache de Assets**: Assets estáticos com cache de 1 ano
- **Cache de Dados**: JSON com revalidação de 60 segundos
- **Headers de Segurança**: CSRF, XSS, e content-type protection

## 🎨 Fontes Externas - Decisões e Trade-offs

### Por que Google Fonts?

**Escolhas**:
- **Inter** (400/600/800) - Fonte principal para corpo de texto
- **Manrope** (400/600/800) - Fonte display para títulos e nome

**Justificativa**:
- **Identidade Visual**: Fontes modernas que transmitem profissionalismo
- **Legibilidade**: Excelente legibilidade em diferentes tamanhos
- **Versatilidade**: Suporte a diferentes pesos e estilos
- **Popularidade**: Amplamente reconhecidas e testadas

### Otimizações Implementadas

```html
<!-- Preconnect para reduzir latência -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Font loading otimizado -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
```

```css
/* Fallback stack no CSS */
font-family: 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif';
```

### Impacto em Performance

**Trade-offs**:
- ✅ **Benefícios**: Tipografia profissional, identidade visual consistente
- ⚠️ **Custos**: ~15-20KB adiciais, possível delay no LCP

**Mitigações**:
- **Preconnect**: Reduz latência de DNS/TCP
- **display=swap**: Evita FOIT (Flash of Invisible Text)
- **Fallback Stack**: Garante renderização imediata
- **Pesos Limitados**: Apenas pesos necessários (3 por fonte)

### Monitoramento

- **LCP Target**: < 2.5s
- **CLS Target**: < 0.1
- **Font Display**: Usar `swap` para evitar layout shifts

## 📊 Estrutura de Dados

### data/projects.json

```json
{
  "title": "string",           // Nome do projeto
  "description": "string",     // Descrição detalhada
  "demoUrl": "string?",        // URL da demo (opcional)
  "repoUrl": "string?",        // URL do repositório (opcional)
  "tags": ["string"],          // Array de tecnologias/tags
  "date": "YYYY-MM-DD",        // Data no formato ISO
  "featured": boolean,         // Se é projeto em destaque
  "thumb": "string?"           // URL da thumbnail (opcional)
}
```

### Como Editar Projetos

1. Abra `data/projects.json`
2. Adicione/edite projetos seguindo a estrutura acima
3. **Dicas**:
   - Projetos são ordenados por data (mais recentes primeiro)
   - Projetos com `featured: true` aparecem no topo
   - Tags são usadas para filtros (geradas automaticamente)
   - Thumbnails são opcionais (placeholder será usado)

### Validação

O sistema inclui tratamento para:
- ✅ Estados de loading
- ❌ Erros de carregamento
- 📭 Estado vazio (sem projetos)
- 🔍 Filtros sem resultados

## ♿ Acessibilidade - Checklist

### ✅ Navegação
- [x] Ordem de tabulação lógica
- [x] Skip links implementados
- [x] Focus visível em todos elementos interativos
- [x] Navegação por teclado funcional

### ✅ Screen Readers
- [x] Estrutura semântica (headings, sections, nav)
- [x] ARIA labels em botões e links
- [x] `aria-pressed` em filtros toggle
- [x] `aria-live` para notificações
- [x] `role="status"` para toasts

### ✅ Visual
- [x] Contraste mínimo AA (4.5:1)
- [x] Texto redimensionável até 200%
- [x] Indicadores de estado claros
- [x] Cores não como única forma de informação

### ✅ Interação
- [x] Áreas de toque ≥44px
- [x] Timeouts apropriados para toasts
- [x] Feedback imediato para ações
- [x] Estados de erro claros

### ✅ Conteúdo
- [x] Textos alternativos para imagens
- [x] Linguagem clara e objetiva
- [x] Estrutura hierárquica correta
- [x] Links descritivos

## 📝 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🚀 Melhorias Futuras

- [ ] Adicionar animações mais avançadas (Framer Motion)
- [ ] Implementar PWA (Service Worker, manifest)
- [ ] Adicionar analytics (Google Analytics/Plausible)
- [ ] Sistema de comentários/feedback
- [ ] Internacionalização (i18n)
- [ ] Blog integrado
- [ ] API para administração de projetos

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📬 Contato

**Greger** - [contato@greger.dev](mailto:contato@greger.dev)

**Links do Projeto**:
- 🔗 [Demo](https://link-in-bio-greger.vercel.app)
- 📁 [Repositório](https://github.com/G-Reg04/link-in-bio-greger)
- 👨‍💻 [GitHub](https://github.com/G-Reg04)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
