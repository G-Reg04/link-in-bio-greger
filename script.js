// Global variables
let allProjects = [];
let filteredProjects = [];
let displayedProjectsCount = 0;
const PROJECTS_PER_PAGE = 6;

// Theme management
class ThemeManager {
  constructor() {
    this.init();
  }

  init() {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (systemPrefersDark) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }

  setTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
    this.updateThemeToggleIcon(theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  updateThemeToggleIcon(theme) {
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    
    if (theme === 'dark') {
      sunIcon?.classList.remove('hidden');
      moonIcon?.classList.add('hidden');
    } else {
      sunIcon?.classList.add('hidden');
      moonIcon?.classList.remove('hidden');
    }
  }
}

// Toast notifications
class ToastManager {
  static show(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    container.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
}

// Email copy functionality
class EmailManager {
  constructor() {
    this.email = 'rggreger.dev@gmail.com'; // Replace with actual email
    this.init();
  }

  init() {
    const contactBtn = document.getElementById('contact-btn');
    const copyEmailBtn = document.getElementById('copy-email-btn');

    if (contactBtn) {
      contactBtn.addEventListener('click', () => this.copyEmail());
    }

    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', () => this.copyEmail());
    }
  }

  async copyEmail() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.email);
        ToastManager.show('E-mail copiado para a área de transferência!');
      } else {
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(this.email);
      }
    } catch (err) {
      console.error('Erro ao copiar e-mail:', err);
      ToastManager.show('Erro ao copiar e-mail. Tente novamente.', 'error');
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        ToastManager.show('E-mail copiado para a área de transferência!');
      } else {
        throw new Error('Command not supported');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      ToastManager.show('Erro ao copiar e-mail. Tente copiar manualmente: ' + text, 'error');
    }

    document.body.removeChild(textArea);
  }
}

// Projects management
class ProjectsManager {
  constructor() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      this.showLoadingState();
      
      // Cache busting para sempre pegar a versão mais recente
      const response = await fetch(`/data/projects.json?ts=${Date.now()}`, { 
        cache: 'no-store' 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawProjects = await response.json();
      
      // Validar e sanitizar dados
      allProjects = this.validateAndSanitizeProjects(rawProjects);
      
      // Aplicar lógica de featured vs recentes
      const projectsToShow = this.selectProjectsToShow(allProjects);
      
      // Ordenar projetos
      this.sortProjects(projectsToShow);

      filteredProjects = [...projectsToShow];
      displayedProjectsCount = 0;

      this.hideLoadingState();
      this.createFilterTags();
      this.displayProjects();
      
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.showErrorState();
    }
  }

  validateAndSanitizeProjects(projects) {
    if (!Array.isArray(projects)) {
      console.warn('Projects data is not an array, returning empty array');
      return [];
    }

    return projects.map(project => ({
      title: project.title || 'Projeto sem título',
      description: project.description || 'Descrição não disponível',
      demoUrl: project.demoUrl || null,
      repoUrl: project.repoUrl || null,
      tags: Array.isArray(project.tags) ? project.tags : [],
      date: project.date || null,
      featured: Boolean(project.featured),
      thumb: project.thumb || null
    }));
  }

  selectProjectsToShow(projects) {
    // Se existir pelo menos um projeto featured, mostrar apenas os featured
    const featuredProjects = projects.filter(project => project.featured);
    
    if (featuredProjects.length > 0) {
      // Máximo 6 projetos featured
      return featuredProjects.slice(0, 6);
    }
    
    // Se não há featured, mostrar os 6 mais recentes
    return projects.slice(0, 6);
  }

  sortProjects(projects) {
    projects.sort((a, b) => {
      // Primeiro, priorizar featured
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Depois, ordenar por data se ambos tiverem data
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      
      // Se apenas um tem data, ele vem primeiro
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      
      // Se nenhum tem data, manter ordem original
      return 0;
    });
  }

  showLoadingState() {
    document.getElementById('loading-state')?.classList.remove('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('empty-state')?.classList.add('hidden');
    document.getElementById('filter-container')?.classList.add('hidden');
    document.getElementById('load-more-container')?.classList.add('hidden');
    
    // Atualizar aria-live para screen readers
    this.announceStatus('Carregando projetos...');
  }

  hideLoadingState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.remove('hidden');
    document.getElementById('filter-container')?.classList.remove('hidden');
  }

  showErrorState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.remove('hidden');
    document.getElementById('empty-state')?.classList.add('hidden');
    document.getElementById('filter-container')?.classList.add('hidden');
    document.getElementById('load-more-container')?.classList.add('hidden');

    // Anunciar erro para screen readers
    this.announceStatus('Erro ao carregar projetos. Use o botão para tentar novamente.');

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      // Remove listeners anteriores
      const newRetryBtn = retryBtn.cloneNode(true);
      retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
      newRetryBtn.addEventListener('click', () => this.loadProjects());
    }
  }

  showEmptyState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('empty-state')?.classList.remove('hidden');
    document.getElementById('filter-container')?.classList.add('hidden');
    document.getElementById('load-more-container')?.classList.add('hidden');
    
    // Anunciar estado vazio para screen readers
    this.announceStatus('Nenhum projeto encontrado.');
  }

  announceStatus(message) {
    // Criar ou atualizar elemento de status para screen readers
    let statusElement = document.getElementById('projects-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'projects-status';
      statusElement.className = 'sr-only';
      statusElement.setAttribute('role', 'status');
      statusElement.setAttribute('aria-live', 'polite');
      document.body.appendChild(statusElement);
    }
    statusElement.textContent = message;
  }

  createFilterTags() {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    // Usar todos os projetos originais para gerar tags, não apenas os filtrados
    const allTags = [...new Set(allProjects.flatMap(project => 
      Array.isArray(project.tags) ? project.tags : []
    ))].sort();

    // Clear existing tags except "Todos"
    const allButton = filterContainer.querySelector('[data-filter="all"]');
    filterContainer.innerHTML = '';
    filterContainer.appendChild(allButton);

    // Se não há tags, esconder o container de filtros
    if (allTags.length === 0) {
      filterContainer.classList.add('hidden');
      return;
    }

    filterContainer.classList.remove('hidden');

    // Add tag buttons
    allTags.forEach(tag => {
      const button = document.createElement('button');
      button.className = 'filter-tag px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 focus-ring';
      button.textContent = tag;
      button.dataset.filter = tag;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('role', 'button');
      
      button.addEventListener('click', (e) => this.handleFilterClick(e));
      
      // Suporte a teclado
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleFilterClick(e);
        }
      });
      
      filterContainer.appendChild(button);
    });

    // Add event listener to "Todos" button
    allButton.addEventListener('click', (e) => this.handleFilterClick(e));
    allButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleFilterClick(e);
      }
    });
  }

  handleFilterClick(event) {
    const button = event.target;
    const filter = button.dataset.filter;
    
    // Update button states
    document.querySelectorAll('.filter-tag').forEach(btn => {
      btn.classList.remove('active', 'bg-primary-600', 'text-white', 'border-primary-600');
      btn.classList.add('border-gray-300', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
      btn.setAttribute('aria-pressed', 'false');
    });

    button.classList.add('active', 'bg-primary-600', 'text-white', 'border-primary-600');
    button.classList.remove('border-gray-300', 'dark:border-gray-600', 'text-gray-700', 'dark:text-gray-300');
    button.setAttribute('aria-pressed', 'true');

    // Filter projects usando TODOS os projetos originais, não apenas os selecionados
    if (filter === 'all') {
      filteredProjects = [...this.selectProjectsToShow(allProjects)];
    } else {
      // Filtrar por tag e depois aplicar lógica de seleção
      const tagFilteredProjects = allProjects.filter(project => 
        Array.isArray(project.tags) && project.tags.includes(filter)
      );
      filteredProjects = [...this.selectProjectsToShow(tagFilteredProjects)];
    }

    displayedProjectsCount = 0;
    this.displayProjects();
    
    // Anunciar resultado do filtro
    const resultCount = filteredProjects.length;
    const filterName = filter === 'all' ? 'todos os projetos' : `projetos com tag "${filter}"`;
    this.announceStatus(`Filtro aplicado: ${filterName}. ${resultCount} projeto${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}.`);
  }

  displayProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    if (filteredProjects.length === 0) {
      this.showEmptyState();
      return;
    }

    // Clear container if starting fresh
    if (displayedProjectsCount === 0) {
      container.innerHTML = '';
    }

    // Get projects to display
    const projectsToShow = filteredProjects.slice(
      displayedProjectsCount,
      displayedProjectsCount + PROJECTS_PER_PAGE
    );

    // Create project cards
    projectsToShow.forEach(project => {
      const card = this.createProjectCard(project);
      container.appendChild(card);
    });

    displayedProjectsCount += projectsToShow.length;

    // Update load more button
    this.updateLoadMoreButton();
  }

  createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group';

    const featuredBadge = project.featured ? 
      '<span class="absolute top-4 left-4 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">Destaque</span>' : '';

    // Gerar gradient baseado no título do projeto para consistência
    const gradientThumb = this.generateGradientThumb(project.title);

    const thumbnail = project.thumb && project.thumb.trim() !== '' ? 
      `<img src="${project.thumb}" alt="${project.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">` :
      gradientThumb;

    const formattedDate = new Date(project.date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    card.innerHTML = `
      <div class="relative overflow-hidden">
        ${thumbnail}
        ${featuredBadge}
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          ${project.title}
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          ${project.description}
        </p>
        <div class="flex flex-wrap gap-2 mb-4">
          ${project.tags.map(tag => 
            `<span class="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-sm rounded-full font-medium">${tag}</span>`
          ).join('')}
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">${formattedDate}</span>
          <div class="flex gap-2">
            ${project.demoUrl ? 
              `<a href="${project.demoUrl}" target="_blank" rel="noopener noreferrer" 
                 class="inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors focus-ring"
                 aria-label="Ver demo do ${project.title}">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Demo
              </a>` : ''
            }
            ${project.repoUrl ? 
              `<a href="${project.repoUrl}" target="_blank" rel="noopener noreferrer" 
                 class="inline-flex items-center px-3 py-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors focus-ring"
                 aria-label="Ver código do ${project.title}">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Código
              </a>` : ''
            }
          </div>
        </div>
      </div>
    `;

    return card;
  }

  generateGradientThumb(title) {
    // Paleta de gradientes modernos e atraentes
    const gradients = [
      // Azuis e roxos
      'from-blue-500 via-purple-500 to-pink-500',
      'from-indigo-600 via-blue-500 to-cyan-400',
      'from-purple-600 via-blue-600 to-blue-400',
      
      // Verdes e azuis
      'from-green-400 via-blue-500 to-purple-600',
      'from-teal-400 via-green-500 to-blue-600',
      'from-emerald-500 via-teal-500 to-cyan-500',
      
      // Laranjas e vermelhos
      'from-orange-500 via-red-500 to-pink-500',
      'from-yellow-400 via-orange-500 to-red-500',
      'from-pink-500 via-red-500 to-orange-500',
      
      // Tons modernos
      'from-violet-600 via-purple-600 to-blue-600',
      'from-cyan-500 via-blue-500 to-indigo-600',
      'from-rose-500 via-pink-500 to-purple-500',
      
      // Gradientes tech
      'from-slate-700 via-blue-600 to-indigo-700',
      'from-gray-800 via-purple-700 to-violet-800',
      'from-blue-800 via-indigo-700 to-purple-800'
    ];

    // Ícones relacionados a desenvolvimento
    const icons = [
      // Código e desenvolvimento
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
      
      // Aplicativo
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>',
      
      // Banco de dados
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>',
      
      // Engrenagem
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
      
      // Globo (web)
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path></svg>',
      
      // Pasta de projetos
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
      
      // Raio (performance)
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
      
      // Estrela (featured)
      '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>'
    ];

    // Gerar índice baseado no hash do título para consistência
    const hashCode = title.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
    
    const gradientIndex = Math.abs(hashCode) % gradients.length;
    const iconIndex = Math.abs(hashCode >> 3) % icons.length;
    
    const selectedGradient = gradients[gradientIndex];
    const selectedIcon = icons[iconIndex];

    return `
      <div class="relative w-full h-48 bg-gradient-to-br ${selectedGradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        <!-- Pattern overlay -->
        <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px); background-size: 24px 24px;"></div>
        
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
        
        <!-- Icon -->
        <div class="relative z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          ${selectedIcon}
        </div>
        
        <!-- Floating particles effect -->
        <div class="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div class="absolute top-8 right-6 w-1 h-1 bg-white/40 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
        <div class="absolute bottom-6 left-8 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
      </div>
    `;
  }

  updateLoadMoreButton() {
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (!loadMoreContainer || !loadMoreBtn) return;

    // Verificar se há mais projetos no conjunto filtrado original (todos os projetos com filtro aplicado)
    // Em vez de usar apenas os primeiros 6 do filteredProjects
    const currentFilter = document.querySelector('.filter-tag[aria-pressed="true"]')?.dataset.filter || 'all';
    
    let totalAvailableProjects;
    if (currentFilter === 'all') {
      totalAvailableProjects = allProjects.length;
    } else {
      totalAvailableProjects = allProjects.filter(project => 
        Array.isArray(project.tags) && project.tags.includes(currentFilter)
      ).length;
    }

    // Mostrar "Ver mais" apenas se há mais de 6 projetos no total e ainda não mostramos todos
    if (totalAvailableProjects > 6 && displayedProjectsCount < filteredProjects.length) {
      loadMoreContainer.classList.remove('hidden');
      
      // Remove existing event listeners
      const newBtn = loadMoreBtn.cloneNode(true);
      loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
      
      // Add new event listener
      newBtn.addEventListener('click', () => this.displayProjects());
    } else {
      loadMoreContainer.classList.add('hidden');
    }
  }
}

// Smooth scrolling for navigation
class SmoothScrollManager {
  constructor() {
    this.init();
  }

  init() {
    // Handle anchor links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update focus for accessibility
          targetElement.focus({ preventScroll: true });
        }
      }
    });
  }
}

// Accessibility enhancements
class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    // Add focus-visible polyfill behavior for older browsers
    this.addFocusVisiblePolyfill();
    
    // Handle keyboard navigation
    this.handleKeyboardNavigation();
    
    // Update aria-current for active navigation items
    this.updateAriaCurrent();
  }

  addFocusVisiblePolyfill() {
    // Basic focus-visible polyfill
    let hadKeyboardEvent = true;
    const keyboardThrottleTimeout = 100;
    let keyboardThrottleTimeoutID = 0;

    const pointerEvents = ['mousedown', 'pointerdown', 'touchstart'];
    const keyboardEvents = ['keydown'];

    function onPointerDown() {
      hadKeyboardEvent = false;
    }

    function onKeyDown(e) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      hadKeyboardEvent = true;
    }

    function onFocus(e) {
      if (hadKeyboardEvent || e.target.matches(':focus-visible')) {
        e.target.classList.add('focus-visible');
      }
    }

    function onBlur(e) {
      e.target.classList.remove('focus-visible');
    }

    pointerEvents.forEach(eventName => {
      document.addEventListener(eventName, onPointerDown, true);
    });

    keyboardEvents.forEach(eventName => {
      document.addEventListener(eventName, onKeyDown, true);
    });

    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
  }

  handleKeyboardNavigation() {
    // Escape key to close modals/dropdowns (future implementation)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Handle escape key functionality
        console.log('Escape key pressed');
      }
    });
  }

  updateAriaCurrent() {
    // Update aria-current based on scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Remove aria-current from all nav links
            document.querySelectorAll('a[href^="#"]').forEach(link => {
              link.removeAttribute('aria-current');
            });
            
            // Add aria-current to corresponding nav link
            const correspondingLink = document.querySelector(`a[href="#${entry.target.id}"]`);
            if (correspondingLink) {
              correspondingLink.setAttribute('aria-current', 'page');
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe sections
    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all managers
  new ThemeManager();
  new EmailManager();
  new ProjectsManager();
  new SmoothScrollManager();
  new AccessibilityManager();

  console.log('Link-in-Bio Greger inicializado com sucesso!');
});
