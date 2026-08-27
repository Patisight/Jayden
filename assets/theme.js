/* ============================================================
   共享行为层 · 所有页面统一引用
   页面只提供标记（section[id] / [data-count] / [data-gallery]），
   本脚本负责接线；不含页面专属逻辑
   ============================================================ */
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(pointer: fine)').matches;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    /* ---------- 滚动揭示 ---------- */
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.classList.add('in');
                io.unobserve(e.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        $$('.rv').forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
    } else {
        $$('.rv').forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------- 数字滚动 ---------- */
    function runCount(el) {
        var to = parseFloat(el.dataset.count) || 0;
        if (reduce) { el.textContent = to; return; }
        var t0 = null;
        function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / 1300, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
        var cio = new IntersectionObserver(function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
        }, { threshold: .5 });
        $$('[data-count]').forEach(function (el) { cio.observe(el); });
    } else {
        $$('[data-count]').forEach(runCount);
    }

    /* ---------- 能力条 ---------- */
    if ('IntersectionObserver' in window) {
        var mio = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; mio.unobserve(e.target); }
            });
        }, { threshold: .6 });
        $$('.fl[data-w]').forEach(function (el) { mio.observe(el); });
    } else {
        $$('.fl[data-w]').forEach(function (el) { el.style.width = el.dataset.w + '%'; });
    }

    /* ---------- 卡片光标聚光 ---------- */
    if (fine) {
        $$('.card').forEach(function (c) {
            c.addEventListener('pointermove', function (e) {
                var b = c.getBoundingClientRect();
                c.style.setProperty('--mx', (e.clientX - b.left) + 'px');
                c.style.setProperty('--my', (e.clientY - b.top) + 'px');
            });
        });
    }

    /* ---------- 进度 / 导航高亮 / HUD ---------- */
    var fill = $('#rulerFill'), hd = $('#hd'), topBtn = $('#topBtn');
    var hudSec = $('#hudSec'), hudName = $('#hudName'), hudPct = $('#hudPct');
    var links = $$('.nav-links a[data-nav]');
    var secs = $$('main section[id], main footer[id]');
    // 子页在滚动到顶时没有 section 命中，用 body[data-hud] 作为页面级标签
    var pageLabel = document.body.dataset.hud || 'HOME';
    // 章节标题优先取 .sec-t；无 .sec-t 的（如首页 hero）用 data-hud 显式声明
    function secLabel(el) {
        if (el.dataset.hud) return el.dataset.hud;
        var t = $('.sec-t', el);
        if (t) return t.textContent.replace(/\/[\s\S]*/, '').trim();
        return el.getAttribute('aria-label') || el.id;
    }
    var ticking = false;

    function pad(n, w) { return String(n).padStart(w || 2, '0'); }
    function onScroll() {
        var y = window.scrollY || document.documentElement.scrollTop;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(y / max, 1) : 0;
        if (fill) fill.style.width = (p * 100).toFixed(2) + '%';
        if (hd) hd.classList.toggle('pinned', y > 80);
        if (topBtn) topBtn.classList.toggle('show', y > 600);

        var cur = null, best = -Infinity;
        secs.forEach(function (el) {
            var top = el.getBoundingClientRect().top - 130;
            if (top <= 0 && top > best) { best = top; cur = el; }
        });
        var id = cur ? cur.id : '';
        links.forEach(function (l) { l.classList.toggle('on', l.dataset.nav === id); });
        if (hudSec) {
            var idx = cur ? (($('.sec-idx', cur) || {}).textContent || '00') : '00';
            hudSec.textContent = '§ ' + idx;
            if (hudName) hudName.textContent = (cur ? secLabel(cur) : pageLabel).toUpperCase();
        }
        if (hudPct) hudPct.textContent = pad(Math.round(p * 100), 3);
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

    /* ---------- 内部锚点平滑滚动 ---------- */
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        try { history.replaceState(null, '', id); } catch (err) { }
    });

    /* ---------- 命令面板 ---------- */
    var pal = $('#palette'), palInput = $('#palInput'), palList = $('#palList');
    if (pal) {
        var items = secs.map(function (el) {
            return {
                href: '#' + el.id,
                idx: (($('.sec-idx', el) || {}).textContent || '').trim() || pad($$('main section[id]').indexOf(el) + 1),
                t: secLabel(el),
                k: el.id.toUpperCase()
            };
        });
        // 页面可声明跨页跳转项：<script type="application/json" id="site-map">[{href,idx,t,k}]</script>
        var smap = $('#site-map');
        if (smap) { try { items = items.concat(JSON.parse(smap.textContent)); } catch (err) { } }

        var sel = 0, shown = items.slice();
        function render() {
            var q = (palInput.value || '').toLowerCase().trim();
            shown = items.filter(function (i) { return !q || (i.t + ' ' + i.k + ' ' + i.idx).toLowerCase().indexOf(q) > -1; });
            if (!shown.length) { palList.innerHTML = '<li class="pal-empty">无匹配项</li>'; return; }
            sel = Math.min(sel, shown.length - 1);
            palList.innerHTML = shown.map(function (i, n) {
                return '<li data-h="' + i.href + '" data-x="' + (i.ext ? 1 : 0) + '" class="' + (n === sel ? 'sel' : '') + '">' +
                    '<span class="idx">' + i.idx + '</span><span>' + i.t + '</span>' +
                    '<span class="hint">' + i.k + '</span></li>';
            }).join('');
            $$('li[data-h]', palList).forEach(function (li, n) {
                li.addEventListener('mouseenter', function () {
                    if (n === sel) return;
                    sel = n;
                    $$('li[data-h]', palList).forEach(function (x, k) { x.classList.toggle('sel', k === sel); });
                });
                li.addEventListener('click', function () { go(li); });
            });
        }
        function go(li) {
            var href = li.dataset.h;
            if (li.dataset.x === '1') { window.location.href = href; return; }
            close();
            var t = document.querySelector(href);
            if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
        function open() { pal.classList.add('open'); sel = 0; palInput.value = ''; render(); palInput.focus(); }
        function close() { pal.classList.remove('open'); }
        function mark() { $$('li[data-h]', palList).forEach(function (x, k) { x.classList.toggle('sel', k === sel); }); }

        palInput.addEventListener('input', function () { sel = 0; render(); });
        pal.addEventListener('click', function (e) { if (e.target === pal) close(); });
        var op = $('#palOpen'); if (op) op.addEventListener('click', open);
        document.addEventListener('keydown', function (e) {
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                pal.classList.contains('open') ? close() : open();
                return;
            }
            if (!pal.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); mark(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); mark(); }
            else if (e.key === 'Enter' && shown[sel]) { go($$('li[data-h]', palList)[sel]); }
        });
        render();
    }

    /* ---------- 图档浏览 + 灯箱 ---------- */
    var LB = [
        '<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="图片查看">',
        '  <div class="lb-stage"><img id="lbImg" alt="">',
        '    <div class="lb-bar"><span><b id="lbIdx">1</b><span id="lbName"></span></span>',
        '      <button class="lb-x" id="lbX" type="button" aria-label="关闭">&times;</button></div>',
        '    <button class="lb-arrow p" id="lbP" type="button" aria-label="上一张">&#8249;</button>',
        '    <button class="lb-arrow n" id="lbN" type="button" aria-label="下一张">&#8250;</button>',
        '    <div class="lb-ctl">',
        '      <button type="button" id="lbOut" aria-label="缩小">&minus;</button>',
        '      <button type="button" class="z" id="lbZ">100%</button>',
        '      <button type="button" id="lbIn" aria-label="放大">+</button>',
        '      <button type="button" id="lbRst">重置</button>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('');

    $$('[data-gallery]').forEach(function (gal, gi) {
        var stage = $('.gal-stage', gal);
        if (!stage) return;
        var imgs = $$('img', stage);
        if (!imgs.length) return;
        var n = 0;
        var nameEl = $('.gal-name', gal), ctEl = $('.gal-count', gal), capEl = $('.gal-cap', gal);
        var strip = $('.gal-thumbs', gal);

        if (!strip) {
            strip = document.createElement('div');
            strip.className = 'gal-thumbs';
            strip.setAttribute('role', 'tablist');
            strip.setAttribute('aria-label', '图片缩略图');
            gal.appendChild(strip);
        }
        strip.innerHTML = imgs.map(function (im, i) {
            return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' +
                '<i>' + pad(i + 1) + '</i><img src="' + im.getAttribute('src') + '" alt="" loading="lazy"></button>';
        }).join('');
        var tabs = $$('button', strip);
        tabs.forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.i); }); });

        var caps = imgs.map(function (im) { return im.getAttribute('data-cap') || im.alt || ''; });

        function show(i) {
            n = (i + imgs.length) % imgs.length;
            imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); });
            tabs.forEach(function (b, k) {
                b.classList.toggle('on', k === n);
                b.setAttribute('aria-selected', String(k === n));
            });
            if (nameEl) nameEl.textContent = caps[n];
            if (ctEl) ctEl.textContent = pad(n + 1) + ' / ' + pad(imgs.length);
            if (capEl) {
                var b = $('b', capEl), s = $('span', capEl);
                if (b) b.textContent = 'FIG ' + pad(n + 1);
                if (s) s.textContent = caps[n];
            }
            gal.dataset.i = n;
        }
        show(0);

        function step(d) { show(n + d); }
        $$('.gal-nav.p', gal).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); step(-1); }); });
        $$('.gal-nav.n', gal).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); step(1); }); });
        gal.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        });

        /* --- 灯箱 --- */
        var lb = $('#lb');
        if (!lb) {
            document.body.insertAdjacentHTML('beforeend', LB);
            lb = $('#lb');
        }
        var lbImg = $('#lbImg'), lbIdx = $('#lbIdx'), lbName = $('#lbName'), lbZ = $('#lbZ');
        var s = 1, tx = 0, ty = 0;
        function apply() {
            lbImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
            lbZ.textContent = Math.round(s * 100) + '%';
        }
        function zoom(d) { s = Math.min(6, Math.max(.2, s + d)); apply(); }
        function reset() { s = 1; tx = ty = 0; apply(); }
        function setIm(i) {
            n = (i + imgs.length) % imgs.length;
            imgs.forEach(function (im, k) { im.classList.toggle('on', k === n); });
            tabs.forEach(function (b, k) { b.classList.toggle('on', k === n); });
            lbImg.src = imgs[n].getAttribute('src');
            lbImg.alt = imgs[n].alt || '';
            lbIdx.textContent = pad(n + 1);
            lbName.textContent = '  ·  ' + caps[n];
            reset();
            gal.dataset.i = n;
        }
        function open() {
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
            setIm(n);
            $('#lbX').focus();
        }
        function close() {
            lb.classList.remove('open');
            document.body.style.overflow = '';
            show(n);
        }
        stage.addEventListener('click', function (e) {
            if (e.target.closest('.gal-nav, .gal-zoom')) return;
            open();
        });
        $('#lbX').addEventListener('click', close);
        $('#lbIn').addEventListener('click', function () { zoom(.25); });
        $('#lbOut').addEventListener('click', function () { zoom(-.25); });
        $('#lbRst').addEventListener('click', reset);
        $('#lbP').addEventListener('click', function () { setIm(n - 1); });
        $('#lbN').addEventListener('click', function () { setIm(n + 1); });
        lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
        lbImg.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? .18 : -.18); }, { passive: false });

        var drag = null;
        lbImg.addEventListener('pointerdown', function (e) {
            if (s <= 1) return;
            drag = { x: e.clientX - tx, y: e.clientY - ty };
            lbImg.classList.add('drag');
            lbImg.setPointerCapture(e.pointerId);
        });
        lbImg.addEventListener('pointermove', function (e) {
            if (!drag) return;
            tx = e.clientX - drag.x; ty = e.clientY - drag.y; apply();
        });
        ['pointerup', 'pointercancel'].forEach(function (ev) {
            lbImg.addEventListener(ev, function () { drag = null; lbImg.classList.remove('drag'); });
        });

        document.addEventListener('keydown', function (e) {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') setIm(n - 1);
            else if (e.key === 'ArrowRight') setIm(n + 1);
            else if (e.key === '+' || e.key === '=') zoom(.25);
            else if (e.key === '-') zoom(-.25);
            else if (e.key === '0') reset();
        });

        // 多图时键盘可达：stage 可聚焦
        stage.tabIndex = 0;
        stage.setAttribute('role', 'group');
        stage.setAttribute('aria-label', '图档 ' + (gi + 1) + '，共 ' + imgs.length + ' 张，左右方向键切换，Enter 放大');
        stage.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); open(); }
        });
    });

    onScroll();
})();
