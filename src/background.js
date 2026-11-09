const canvas = document.querySelector('.site-background');
const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
if (getComputedStyle(canvas).position === 'absolute') {
    const header = document.querySelector('.site-header');
    const content = [...document.querySelectorAll('.container > main, .container > .site-footer')];
    let clipFrame;

    function updateContentClip() {
        clipFrame = undefined;
        const edge = header.getBoundingClientRect().top;
        const offsets = content.map(element => edge - element.getBoundingClientRect().top);
        content.forEach((element, index) => {
            element.style.setProperty('--safari-content-clip', `${Math.max(-100, offsets[index])}px`);
        });
    }

    function scheduleContentClip() {
        if (clipFrame === undefined) clipFrame = requestAnimationFrame(updateContentClip);
    }

    window.addEventListener('scroll', scheduleContentClip, { passive: true });
    window.addEventListener('resize', scheduleContentClip);
    updateContentClip();
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (gl) {
    const program = gl.createProgram();
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, 'attribute vec2 position; void main() { gl_Position = vec4(position, 0., 1.); }');
    gl.compileShader(vertex);
    gl.attachShader(program, vertex);

    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, `
        precision highp float;
        uniform vec2 resolution;
        uniform vec2 pointer;
        uniform vec3 base;
        uniform float time;
        uniform float influence;
        uniform float pixelRatio;
        uniform float scrollOffset;

        float warp(vec2 p, float phase) {
            for (int octave = 1; octave <= 5; octave++) {
                float frequency = float(octave);
                vec2 bend = cos(p.yx * frequency * vec2(2.5, 1.5) + phase);
                p += bend * (.6 / frequency);
            }

            float ridge = abs(sin(p.x + p.y - phase));
            return smoothstep(.02, 1., .15 / max(.001, ridge));
        }

        float bayer2(vec2 p) {
            return 2. * p.x + 3. * p.y - 4. * p.x * p.y;
        }

        void main() {
            float patternScale = 1.;
            float cellSize = 2.5 * pixelRatio * patternScale;
            vec2 pageOffset = vec2(0., scrollOffset);
            vec2 cell = floor((gl_FragCoord.xy - pageOffset) / cellSize);
            vec2 pixel = (cell + .5) * cellSize;
            vec2 point = pixel / resolution.y;
            vec2 delta = (pixel + pageOffset - pointer) / resolution.y;
            float falloff = exp(-dot(delta, delta) * 10.) * influence;
            vec2 flow = point * (3.4 / patternScale) + vec2(time * .0175, -time * .01);
            flow += vec2(-delta.y, delta.x) * falloff * 1.2;
            float field = warp(flow, time * .0175);
            float threshold = (4. * bayer2(mod(cell, 2.)) + bayer2(mod(floor(cell / 2.), 2.)) + .5) / 16.;
            gl_FragColor = vec4(mix(base, base * .95, step(threshold, field)), 1.);
        }
    `);
    gl.compileShader(fragment);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const uniforms = {};
        for (const name of ['resolution', 'pointer', 'base', 'time', 'influence', 'pixelRatio', 'scrollOffset']) {
            uniforms[name] = gl.getUniformLocation(program, name);
        }

        let pixelRatio;
        let canvasBottom;
        let followsScroll;
        let target = { x: 0, y: 0 };
        let pointer = target;
        let strength = 0;
        let targetStrength = 0;
        let frame;
        let lastDraw = 0;

        function draw(now) {
            if (reducedMotion.matches || now - lastDraw >= 32) {
                lastDraw = now;
                const scrollY = window.scrollY;
                if (followsScroll) canvas.style.transform = `translateY(${scrollY}px)`;
                pointer = {
                    x: pointer.x + (target.x - pointer.x) * .2,
                    y: pointer.y + (target.y - pointer.y) * .2,
                };
                strength += (targetStrength - strength) * .14;
                gl.uniform2f(uniforms.pointer, pointer.x * pixelRatio, (canvasBottom - pointer.y) * pixelRatio);
                gl.uniform1f(uniforms.time, reducedMotion.matches ? 0 : now / 1000);
                gl.uniform1f(uniforms.influence, reducedMotion.matches ? 0 : strength);
                gl.uniform1f(uniforms.scrollOffset, scrollY * pixelRatio);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
        }

        function refresh() {
            cancelAnimationFrame(frame);
            const color = getComputedStyle(document.documentElement).getPropertyValue('--color-base').trim();
            const rgb = color.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16) / 255);
            gl.uniform3f(uniforms.base, ...rgb);
            pixelRatio = Math.min(devicePixelRatio, 1.5);
            followsScroll = getComputedStyle(canvas).position === 'absolute';
            canvas.style.transform = followsScroll ? `translateY(${window.scrollY}px)` : '';
            canvasBottom = canvas.getBoundingClientRect().bottom;
            canvas.width = Math.round(canvas.clientWidth * pixelRatio);
            canvas.height = Math.round(canvas.clientHeight * pixelRatio);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
            gl.uniform1f(uniforms.pixelRatio, pixelRatio);
            lastDraw = -Infinity;
            draw(performance.now());
            canvas.style.visibility = 'visible';
        }

        window.addEventListener('pointermove', updatePointer, { passive: true });
        window.addEventListener('pointerdown', updatePointer, { passive: true });
        window.addEventListener('pointerup', event => {
            if (event.pointerType !== 'mouse') targetStrength = 0;
        });
        window.addEventListener('pointercancel', () => { targetStrength = 0; });
        document.documentElement.addEventListener('pointerleave', () => { targetStrength = 0; });

        function updatePointer(event) {
            if (reducedMotion.matches) return;
            target = { x: event.clientX, y: event.clientY };
            if (strength < .01) pointer = target;
            targetStrength = 1;
        }

        window.addEventListener('resize', refresh);
        window.addEventListener('scroll', () => {
            if (reducedMotion.matches) draw(performance.now());
        }, { passive: true });
        reducedMotion.addEventListener('change', refresh);
        new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        canvas.addEventListener('webglcontextlost', () => {
            cancelAnimationFrame(frame);
            canvas.style.visibility = 'hidden';
        });
        refresh();
    }
}
