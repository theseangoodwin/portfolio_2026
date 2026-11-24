document.querySelectorAll('.footnote-toggle').forEach(button => {
    const note = document.getElementById(button.getAttribute('aria-controls'));
    // Notes remain readable when JavaScript is unavailable.
    note.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        note.hidden = expanded;
    });
    note.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            note.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.focus();
        }
    });
});

document.querySelectorAll('.fidelity-diagram').forEach(diagram => {
    if (!('IntersectionObserver' in window)) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const paths = ['.fidelity-gradual', '.fidelity-steep'].map(selector => {
        const group = diagram.querySelector(selector);
        const line = group.querySelector('.fidelity-line');
        const circle = group.querySelector('.fidelity-circle');
        const arrow = group.querySelector('.fidelity-arrow');
        const length = line.getTotalLength();
        const circleLength = circle.getTotalLength();
        line.style.strokeDasharray = `${length} ${length}`;
        circle.style.strokeDasharray = `${circleLength} ${circleLength}`;
        return { group, line, circle, arrow, length, circleLength };
    });
    const stage = Number(diagram.dataset.stage);
    const initial = stage - 1;
    let progress = initial;
    let target = initial;
    let frame;
    let previousTime;
    const clamp = value => Math.max(0, Math.min(1, value));
    const easeOutQuart = value => 1 - Math.pow(1 - value, 4);

    function render() {
        paths.forEach(({ group, line, circle, arrow, length, circleLength }, index) => {
            const phase = clamp(progress - index);
            const draw = easeOutQuart(clamp(phase / .8));
            const circleDraw = easeOutQuart(clamp((phase - .8) / .2));
            group.style.opacity = index === 0 ? 1 - .75 * easeOutQuart(clamp(progress - 1)) : Number(phase > 0);
            line.style.strokeDashoffset = length * (1 - draw);
            line.style.opacity = Number(draw > 0);
            circle.style.strokeDashoffset = circleLength * (1 - circleDraw);
            circle.style.opacity = Number(circleDraw > 0);
            const distance = length * draw;
            const point = line.getPointAtLength(distance);
            const before = line.getPointAtLength(Math.max(0, distance - 1));
            const after = line.getPointAtLength(Math.min(length, distance + 1));
            const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
            arrow.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
            arrow.style.opacity = Number(draw > 0);
        });
    }

    function tick(now) {
        const elapsed = previousTime === undefined ? 0 : Math.min(now - previousTime, 50);
        previousTime = now;
        const step = elapsed / 1500;
        progress += Math.sign(target - progress) * Math.min(Math.abs(target - progress), step);
        render();
        if (progress !== target) frame = requestAnimationFrame(tick);
        else { frame = undefined; previousTime = undefined; }
    }

    const highlightAnimations = new Map();
    function highlightText(stage) {
        const highlight = stage === 1
            ? diagram.closest('.article-body')?.querySelector('.fidelity-highlight-first')
            : diagram.closest('.article-body')?.querySelector('.fidelity-highlight:not(.fidelity-highlight-first)');
        if (!highlight) return;
        highlightAnimations.get(stage)?.cancel();
        // An ordinary inline background follows wrapped text reliably in Safari.
        highlight.classList.add('is-emphasized');
        let timeout;
        const clear = () => {
            clearTimeout(timeout);
            highlight.classList.remove('is-emphasized');
            highlightAnimations.delete(stage);
        };
        highlightAnimations.set(stage, { cancel: clear });
        timeout = setTimeout(clear, 4500);
    }

    function update(next) {
        if (next === stage && target !== stage) highlightText(stage);
        if (next === initial) highlightAnimations.get(stage)?.cancel();
        target = next;
        if (reducedMotion.matches) {
            cancelAnimationFrame(frame);
            frame = undefined;
            previousTime = undefined;
            progress = target;
            render();
        } else if (frame === undefined && progress !== target) {
            frame = requestAnimationFrame(tick);
        }
    }

    render();
    const trigger = diagram.querySelector('.fidelity-entry-trigger');
    let observer;
    let resizeFrame;
    function observeGraphic() {
        const viewportHeight = document.documentElement.clientHeight;
        observer?.disconnect();
        observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                update(entry.boundingClientRect.top <= entry.rootBounds.bottom ? stage : initial);
            }
        }, { rootMargin: `0px 0px -${viewportHeight * .15}px 0px`, threshold: 0 });
        observer.observe(trigger);
        update(trigger.getBoundingClientRect().top <= viewportHeight * .85 ? stage : initial);
    }
    function scheduleResize() {
        if (resizeFrame !== undefined) return;
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = undefined;
            observeGraphic();
        });
    }
    observeGraphic();
    window.addEventListener('resize', scheduleResize);
    new ResizeObserver(scheduleResize).observe(diagram);
    reducedMotion.addEventListener('change', () => update(target));
});
