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
    this.email = 'contato@greger.dev'; // Replace with actual email
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
      
      const response = await fetch('/data/projects.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      allProjects = await response.json();
      
      // Sort by date (newest first) and featured status
      allProjects.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.date) - new Date(a.date);
      });

      filteredProjects = [...allProjects];
      displayedProjectsCount = 0;

      this.hideLoadingState();
      this.createFilterTags();
      this.displayProjects();
      
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      this.showErrorState();
    }
  }

  showLoadingState() {
    document.getElementById('loading-state')?.classList.remove('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('empty-state')?.classList.add('hidden');
  }

  hideLoadingState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.remove('hidden');
  }

  showErrorState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.remove('hidden');
    document.getElementById('empty-state')?.classList.add('hidden');

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadProjects());
    }
  }

  showEmptyState() {
    document.getElementById('loading-state')?.classList.add('hidden');
    document.getElementById('projects-container')?.classList.add('hidden');
    document.getElementById('error-state')?.classList.add('hidden');
    document.getElementById('empty-state')?.classList.remove('hidden');
  }

  createFilterTags() {
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) return;

    // Get all unique tags
    const allTags = [...new Set(allProjects.flatMap(project => project.tags))].sort();

    // Clear existing tags except "Todos"
    const allButton = filterContainer.querySelector('[data-filter="all"]');
    filterContainer.innerHTML = '';
    filterContainer.appendChild(allButton);

    // Add tag buttons
    allTags.forEach(tag => {
      const button = document.createElement('button');
      button.className = 'filter-tag px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 focus-ring';
      button.textContent = tag;
      button.dataset.filter = tag;
      button.setAttribute('aria-pressed', 'false');
      
      button.addEventListener('click', (e) => this.handleFilterClick(e));
      
      filterContainer.appendChild(button);
    });

    // Add event listener to "Todos" button
    allButton.addEventListener('click', (e) => this.handleFilterClick(e));
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

    // Filter projects
    if (filter === 'all') {
      filteredProjects = [...allProjects];
    } else {
      filteredProjects = allProjects.filter(project => project.tags.includes(filter));
    }

    displayedProjectsCount = 0;
    this.displayProjects();
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

    const thumbnail = project.thumb ? 
      `<img src="${project.thumb}" alt="${project.title}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">` :
      `<div class="w-full h-48 bg-gradient-to-br from-primary-100 to-indigo-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <svg class="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      </div>`;

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

  updateLoadMoreButton() {
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (!loadMoreContainer || !loadMoreBtn) return;

    if (displayedProjectsCount < filteredProjects.length) {
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
