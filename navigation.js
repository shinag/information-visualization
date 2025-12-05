// Navigation and Progress Bar
(function() {
    const progressBar = document.getElementById('progressBar');
    const navItems = document.querySelectorAll('.nav-item');
    const chapters = document.querySelectorAll('.chapter');

    // Update progress bar on scroll
    function updateProgressBar() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        progressBar.style.width = progress + '%';
    }

    // Update active navigation item
    function updateActiveNav() {
        let currentChapter = '';
        
        chapters.forEach(chapter => {
            const chapterTop = chapter.offsetTop;
            const chapterHeight = chapter.offsetHeight;
            
            if (window.scrollY >= chapterTop - 200) {
                currentChapter = chapter.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href').substring(1);
            if (href === currentChapter) {
                item.classList.add('active');
            }
        });
    }

    // Smooth scroll to chapter
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Event listeners
    window.addEventListener('scroll', () => {
        updateProgressBar();
        updateActiveNav();
    });

    // Initial call
    updateProgressBar();
    updateActiveNav();
})();