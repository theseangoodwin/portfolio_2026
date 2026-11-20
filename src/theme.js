(() => {
        // Color Themes
        const themes = [
            { name: 'Beige Classic', base: '#fffcf0', accent: '#000000' },
            { name: 'Periwinkle', base: '#9BB8E8', accent: '#2d4a7c' },
            { name: 'Charcoal', base: '#5a5a5a', accent: '#e0e0e0' },
            { name: 'Forest', base: '#1e5945', accent: '#a8d5ba' },
            { name: 'Sand', base: '#d9c7a8', accent: '#4a3f35' },
            { name: 'Sage', base: '#b4c4a8', accent: '#3d5a3d' },
            { name: 'Deep Teal', base: '#0f3d30', accent: '#d0e8df' },
            { name: 'Amber', base: '#F5A623', accent: '#5a3d1e' },
            { name: 'Desert Sand', base: '#918A45', accent: '#FDF5D4' },
            { name: 'Rust Sky', base: '#945C0F', accent: '#9DC7FF' },
            { name: 'Jade', base: '#336C5D', accent: '#E6DBAE' },
            { name: 'Midnight Purple', base: '#282954', accent: '#C6A7E6' },
            { name: 'Mahogany', base: '#482927', accent: '#E3B1AB' },
            { name: 'Slate Coral', base: '#344749', accent: '#FF7560' },
            { name: 'Coral Gold', base: '#ca4c40', accent: '#ffd301' }
        ];

        let currentThemeIndex = 0;

        function luminance(rgb) {
            return rgb.map(value => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        }

        function articleTextColors(theme) {
            const rgb = hex => hex.match(/[a-f\d]{2}/gi).map(channel => parseInt(channel, 16));
            const background = rgb(theme.base);
            const backgroundLight = luminance(background);
            const contrast = color => {
                const light = luminance(color);
                return (Math.max(light, backgroundLight) + 0.05) / (Math.min(light, backgroundLight) + 0.05);
            };
            const endpoint = backgroundLight > 0.179 ? [0, 0, 0] : [255, 255, 255];
            const mix = (from, to, amount) => from.map((value, index) => Math.round(value + (to[index] - value) * amount));
            const accent = rgb(theme.accent);
            let primary = accent;
            for (let step = 1; contrast(primary) < 7 && step <= 100; step++) primary = mix(accent, endpoint, step / 100);
            let secondary = mix(background, primary, 0.8);
            for (let step = 81; contrast(secondary) < 4.5 && step <= 100; step++) secondary = mix(background, primary, step / 100);
            return { primary: `rgb(${primary.join(' ')})`, secondary: `rgb(${secondary.join(' ')})` };
        }

        // Helper function to convert hex to rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Apply theme
        function applyTheme(index) {
            const theme = themes[index];
            const root = document.documentElement;

            root.style.setProperty('--color-base', theme.base);
            root.style.setProperty('--color-accent', theme.accent);
            root.style.setProperty('--color-accent-50', hexToRgba(theme.accent, 0.5));

            if (document.body.classList.contains('article-page')) {
                const colors = articleTextColors(theme);
                document.body.style.setProperty('--color-text-primary', colors.primary);
                document.body.style.setProperty('--color-text-secondary', colors.secondary);
                document.body.style.setProperty('--color-accent', colors.primary);
            }

            currentThemeIndex = index;
            localStorage.setItem('themeName', theme.name);
            const nextTheme = themes[(index + 1) % themes.length];
            root.style.setProperty('--color-next-theme', nextTheme.base);
        }

        // Cycle to next theme
        function nextTheme() {
            const nextIndex = (currentThemeIndex + 1) % themes.length;
            applyTheme(nextIndex);
        }

        // Initialize theme on page load - cycle to next theme on each load
        function initTheme() {
            const savedName = localStorage.getItem('themeName');
            const savedIndex = themes.findIndex(theme => theme.name === savedName);

            if (savedIndex >= 0) {
                // Advance to next theme on each page load
                const nextIndex = (savedIndex + 1) % themes.length;
                applyTheme(nextIndex);
            } else {
                // Random theme on first visit
                const randomIndex = Math.floor(Math.random() * themes.length);
                applyTheme(randomIndex);
            }
        }

        // Theme switcher button
        document.getElementById('theme-switcher').addEventListener('click', nextTheme);

        // Initialize theme
        initTheme();

})();
